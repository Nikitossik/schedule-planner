from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import List

from ..repositories import RecurringLessonTemplateRepository
from ..models import RecurringLessonTemplate, Lesson
from ..schemas.recurring_template import (
    RecurringLessonTemplateIn,
    RecurringLessonTemplateUpdate,
)
from ..schemas.lesson import LessonIn
from .base import BaseService
from .lesson import LessonService
from .university_holiday import UniversityHolidayService


class RecurringLessonTemplateService(
    BaseService[RecurringLessonTemplate, RecurringLessonTemplateIn]
):
    def __init__(self, db: Session):
        super().__init__(
            db, RecurringLessonTemplate, RecurringLessonTemplateRepository(db)
        )
        self.lesson_service = LessonService(db)
        self.holiday_service = UniversityHolidayService(db)

    def apply_filters(self, query, params):
        """
        Apply filters to recurring lesson templates query.

        Supported filters:
        - schedule_ids: filter by multiple schedule IDs
        - start_date_from/start_date_to: filter by start_date range

        Args:
            query: SQLAlchemy query for RecurringLessonTemplate.
            params: Combined query/filter params.

        Returns:
            The filtered SQLAlchemy query.
        """
        if params.schedule_ids:
            query = query.filter(
                RecurringLessonTemplate.schedule_id.in_(params.schedule_ids)
            )
        if params.start_date_from:
            query = query.filter(
                RecurringLessonTemplate.start_date >= params.start_date_from
            )
        if params.start_date_to:
            query = query.filter(
                RecurringLessonTemplate.start_date <= params.start_date_to
            )

        return super().apply_filters(query, params)

    def create(self, data: RecurringLessonTemplateIn) -> RecurringLessonTemplate:
        """Переопределенный метод создания - создаем шаблон и генерируем уроки"""

        template_data = data.model_dump(exclude={"group_ids"})
        group_ids = data.group_ids

        # Создаем шаблон
        template = super().create(template_data)

        # Привязываем группы к шаблону
        self._assign_groups_to_template(template, group_ids)

        # Генерируем уроки
        self._generate_lessons_from_template(template)

        return template

    def update(
        self, id: int, data: RecurringLessonTemplateUpdate
    ) -> RecurringLessonTemplate:
        """Переопределенный метод обновления - обновляем шаблон и пересоздаем уроки"""

        # Обновляем шаблон
        template_data = data.model_dump(exclude_unset=True, exclude={"group_ids"})
        template = super().update(id, template_data)

        # Обновляем группы если они переданы
        if hasattr(data, "group_ids") and data.group_ids is not None:
            self._assign_groups_to_template(template, data.group_ids)

        # Удаляем старые будущие уроки
        self._delete_future_lessons_by_template(id)

        # Генерируем новые уроки
        self._generate_lessons_from_template(template)

        return template

    def delete(self, id: int) -> bool:
        """Переопределенный метод удаления - удаляем шаблон (уроки удаляются автоматически)"""
        # Удаляем будущие уроки (на всякий случай)
        self._delete_future_lessons_by_template(id)

        # Удаляем шаблон (остальные уроки удаляются по CASCADE)
        return super().delete(id)

    def _generate_lessons_from_template(
        self, template: RecurringLessonTemplate
    ) -> List[Lesson]:
        """Генерируем уроки по шаблону - ОДИН урок на дату со ВСЕМИ группами"""

        # Вычисляем даты уроков
        lesson_dates = self._calculate_lesson_dates(template)

        # Создаем ОДИН урок на каждую дату для ВСЕХ групп сразу
        lessons = []
        for lesson_date in lesson_dates:
            lesson_data = LessonIn(
                schedule_id=template.schedule_id,
                group_ids=[group.id for group in template.groups],
                subject_assignment_id=template.subject_assignment_id,
                room_id=template.room_id,
                lesson_type=template.lesson_type,
                is_online=template.is_online,
                date=lesson_date,
                start_time=template.start_time,
                end_time=template.end_time,
                recurring_template_id=template.id,
            )

            lesson = self.lesson_service.create(lesson_data)
            lessons.append(lesson)

        return lessons

    def _assign_groups_to_template(
        self, template: RecurringLessonTemplate, group_ids: List[int]
    ) -> None:
        """Привязываем группы к шаблону"""
        from ..models.group import Group

        # Получаем группы по их ID
        groups = self.db.query(Group).filter(Group.id.in_(group_ids)).all()

        # Привязываем группы к шаблону
        template.groups = groups

        # Сохраняем изменения
        self.db.commit()

    def _calculate_lesson_dates(self, template: RecurringLessonTemplate) -> List[date]:
        """Вычисляем все даты уроков с учетом праздников и недоступных дней профессора"""

        dates = []
        current_date = template.start_date
        end_date = template.end_date or template.schedule.semester.end_date

        # Получаем праздники для исключения
        expanded_holidays = self.holiday_service.get_expanded_holiday_dates(
            current_date, end_date
        )
        # Конвертируем строки дат в объекты date для корректного сравнения
        holiday_dates = set(holiday["date"] for holiday in expanded_holidays)

        # Получаем недоступные дни профессора
        unavailable_days = self._get_professor_unavailable_days(template)

        # Получаем дни недели (работаем со строкой напрямую)
        days_of_week = template.days_of_week

        # Проходим по всем дням в диапазоне
        while current_date <= end_date:
            # Проверяем день недели (0=Понедельник в ISO)
            day_of_week = current_date.weekday()

            # Конвертируем номер дня в строку и проверяем его наличие в JSON строке
            if str(day_of_week) in days_of_week:
                # Исключаем праздники
                if current_date not in holiday_dates:
                    # Исключаем недоступные дни профессора
                    if unavailable_days is None or day_of_week not in unavailable_days:
                        dates.append(current_date)

            current_date += timedelta(days=1)

        return dates

    def _get_professor_unavailable_days(
        self, template: RecurringLessonTemplate
    ) -> set[int] | None:
        """Получаем недоступные дни профессора из subject_assignment"""
        import json

        if not template.subject_assignment:
            return None

        # Получаем профессора через subject_assignment -> workload -> contract -> professor_profile
        professor_profile = (
            template.subject_assignment.workload.contract.professor_profile
        )

        if not professor_profile or not professor_profile.unavailable_days:
            return None

        try:
            # Парсим JSON строку в список дней
            unavailable_days_list = json.loads(professor_profile.unavailable_days)
            return set(unavailable_days_list)
        except (json.JSONDecodeError, TypeError):
            return None

    def _delete_future_lessons_by_template(self, template_id: int) -> int:
        """Удаляем только будущие уроки по шаблону"""

        today = date.today()

        deleted = (
            self.db.query(Lesson)
            .filter(
                Lesson.recurring_template_id == template_id,
                Lesson.date >= today,  # Только будущие
            )
            .delete(synchronize_session=False)
        )

        self.db.commit()
        return deleted

    def get_lessons_count_by_template(self, template_id: int) -> int:
        """Получаем количество созданных уроков по шаблону"""
        return (
            self.db.query(Lesson)
            .filter(Lesson.recurring_template_id == template_id)
            .count()
        )

    def get_future_lessons_count_by_template(self, template_id: int) -> int:
        """Получаем количество будущих уроков"""
        today = date.today()
        return (
            self.db.query(Lesson)
            .filter(Lesson.recurring_template_id == template_id, Lesson.date >= today)
            .count()
        )
