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
        """Redefined create method to handle template creation and lesson generation"""

        template_data = data.model_dump(exclude={"group_ids"})
        group_ids = data.group_ids

        # Create the template
        template = super().create(template_data)

        # Assign groups to the template
        self._assign_groups_to_template(template, group_ids)

        # Generate lessons
        self._generate_lessons_from_template(template)

        return template

    def update(
        self, id: int, data: RecurringLessonTemplateUpdate
    ) -> RecurringLessonTemplate:
        """Redefined update method to handle template updates and lesson regeneration"""

        # Update the template
        template_data = data.model_dump(exclude_unset=True, exclude={"group_ids"})
        template = super().update(id, template_data)

        # Update groups if provided
        if hasattr(data, "group_ids") and data.group_ids is not None:
            self._assign_groups_to_template(template, data.group_ids)

        # Delete old future lessons
        self._delete_future_lessons_by_template(id)

        # Generate new lessons
        self._generate_lessons_from_template(template)

        return template

    def delete(self, id: int) -> bool:
        """Redefined delete method - delete template (lessons are deleted automatically)"""
        # Delete future lessons (just in case)
        self._delete_future_lessons_by_template(id)

        # Delete the template (other lessons are deleted via CASCADE)
        return super().delete(id)

    def _generate_lessons_from_template(
        self, template: RecurringLessonTemplate
    ) -> List[Lesson]:
        """Generate lessons from the template - ONE lesson per date for ALL groups"""
        # Calculate lesson dates
        lesson_dates = self._calculate_lesson_dates(template)

        # Create ONE lesson per date for ALL groups
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
        """Assign groups to the template"""
        from ..models.group import Group

        # Get groups by their IDs
        groups = self.db.query(Group).filter(Group.id.in_(group_ids)).all()

        # Assign groups to the template
        template.groups = groups

        # Commit changes
        self.db.commit()

    def _calculate_lesson_dates(self, template: RecurringLessonTemplate) -> List[date]:
        """Calculate all lesson dates considering holidays and professor's unavailable days"""

        dates = []
        current_date = template.start_date
        end_date = template.end_date or template.schedule.semester.end_date

        # Get holidays for exclusion
        expanded_holidays = self.holiday_service.get_expanded_holiday_dates(
            current_date, end_date
        )
        # Convert holiday date strings to date objects for proper comparison
        holiday_dates = set(holiday["date"] for holiday in expanded_holidays)

        # Get professor's unavailable days
        unavailable_days = self._get_professor_unavailable_days(template)

        # Get days of the week (work directly with the string)
        days_of_week = template.days_of_week

        # Iterate over all days in the range
        while current_date <= end_date:
            # Check the day of the week (0=Monday in ISO)
            day_of_week = current_date.weekday()

            # Convert the day number to a string and check its presence in the JSON string
            if str(day_of_week) in days_of_week:
                # Exclude holidays
                if current_date not in holiday_dates:
                    # Exclude professor's unavailable days
                    if unavailable_days is None or day_of_week not in unavailable_days:
                        dates.append(current_date)

            current_date += timedelta(days=1)

        return dates

    def _get_professor_unavailable_days(
        self, template: RecurringLessonTemplate
    ) -> set[int] | None:
        """Get professor's unavailable days from subject_assignment"""
        import json

        if not template.subject_assignment:
            return None

        # Get professor through subject_assignment -> workload -> contract -> professor_profile
        professor_profile = (
            template.subject_assignment.workload.contract.professor_profile
        )

        if not professor_profile or not professor_profile.unavailable_days:
            return None

        try:
            # Parse JSON string into a list of days
            unavailable_days_list = json.loads(professor_profile.unavailable_days)
            return set(unavailable_days_list)
        except (json.JSONDecodeError, TypeError):
            return None

    def _delete_future_lessons_by_template(self, template_id: int) -> int:
        """Delete only future lessons by template"""

        today = date.today()

        deleted = (
            self.db.query(Lesson)
            .filter(
                Lesson.recurring_template_id == template_id,
                Lesson.date >= today,  # Only future lessons
            )
            .delete(synchronize_session=False)
        )

        self.db.commit()
        return deleted

    def get_lessons_count_by_template(self, template_id: int) -> int:
        """Get the number of lessons created by template"""
        return (
            self.db.query(Lesson)
            .filter(Lesson.recurring_template_id == template_id)
            .count()
        )

    def get_future_lessons_count_by_template(self, template_id: int) -> int:
        """Get the number of future lessons"""
        today = date.today()
        return (
            self.db.query(Lesson)
            .filter(Lesson.recurring_template_id == template_id, Lesson.date >= today)
            .count()
        )
