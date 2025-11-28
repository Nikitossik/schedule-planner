from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import List

from ..repositories import RecurringLessonTemplateRepository
from ..models import RecurringLessonTemplate, Lesson, UniversityHoliday
from ..schemas.recurring_template import (
    RecurringLessonTemplateIn,
    RecurringLessonTemplateUpdate,
)
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

    def create(self, data: RecurringLessonTemplateIn) -> RecurringLessonTemplate:
        """Переопределенный метод создания - создаем шаблон и генерируем уроки"""

        template_data = data.model_dump()

        template = super().create(template_data)

        # Генерируем уроки
        self._generate_lessons_from_template(template)

        return template

    def update(
        self, id: int, data: RecurringLessonTemplateUpdate
    ) -> RecurringLessonTemplate:
        """Переопределенный метод обновления - обновляем шаблон и пересоздаем уроки"""

        # Обновляем шаблон
        template_data = data.model_dump(exclude_unset=True)
        template = super().update(id, template_data)

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
        """Генерируем уроки по шаблону"""

        # Вычисляем даты уроков
        lesson_dates = self._calculate_lesson_dates(template)

        # Создаем уроки
        lessons = []
        for lesson_date in lesson_dates:
            lesson_data = {
                "schedule_id": template.schedule_id,
                "group_id": template.group_id,
                "subject_assignment_id": template.subject_assignment_id,
                "room_id": template.room_id,
                "lesson_type": template.lesson_type,
                "is_online": template.is_online,
                "date": lesson_date,
                "start_time": template.start_time,
                "end_time": template.end_time,
                "recurring_template_id": template.id,
            }

            lesson = self.lesson_service.create(lesson_data)
            lessons.append(lesson)

        return lessons

    def _calculate_lesson_dates(self, template: RecurringLessonTemplate) -> List[date]:
        """Вычисляем все даты уроков с учетом праздников"""

        dates = []
        current_date = template.start_date
        end_date = template.end_date or self._get_semester_end_date(template)

        # Получаем праздники для исключения
        holiday_dates = self._get_holiday_dates(current_date, end_date)

        # Получаем дни недели (работаем со строкой напрямую)
        days_of_week = template.days_of_week

        # Проходим по всем дням в диапазоне
        while current_date <= end_date:
            # Проверяем день недели (0=Понедельник в ISO)
            # Конвертируем номер дня в строку и проверяем его наличие в JSON строке
            if str(current_date.weekday()) in days_of_week:
                # Исключаем праздники
                if current_date not in holiday_dates:
                    dates.append(current_date)

            current_date += timedelta(days=1)

        return dates

    def _get_holiday_dates(self, start_date: date, end_date: date) -> set[date]:
        """Получаем множество праздничных дат в диапазоне"""

        holiday_dates = set()

        # Получаем все праздники
        holidays = self.db.query(UniversityHoliday).all()

        for holiday in holidays:
            holiday_date = holiday.date

            if holiday.is_annual:
                # Для ежегодных праздников создаем даты для каждого года в диапазоне
                for year in range(start_date.year, end_date.year + 1):
                    annual_date = date(year, holiday_date.month, holiday_date.day)
                    if start_date <= annual_date <= end_date:
                        holiday_dates.add(annual_date)
            else:
                # Для обычных праздников используем указанную дату
                if start_date <= holiday_date <= end_date:
                    holiday_dates.add(holiday_date)

        return holiday_dates

    def _get_semester_end_date(self, template: RecurringLessonTemplate) -> date:
        """Получаем дату окончания семестра"""
        return template.schedule.semester.end_date

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
