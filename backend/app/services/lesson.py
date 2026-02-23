from typing import List
from sqlalchemy.orm import Session, selectinload

from app.repositories.lesson import LessonRepository
from app.models import (
    Lesson,
    Group,
    SubjectAssignment,
    ProfessorWorkload,
    ProfessorContract,
    ProfessorProfile,
)
from ..schemas.lesson import (
    LessonIn,
    LessonOut,
    LessonQueryParams,
    CalendarLessonsResponse,
)

from .base import BaseService


class LessonService(BaseService[Lesson, LessonIn]):
    """
    Service layer for lesson management.

    Responsibilities:
    - List/filter lessons (by schedule and date range).
    - Provide calendar-oriented listing without pagination with eager loading.
    - Detect and summarize scheduling conflicts (room, professor, group).
    - Offer utility helpers for conflict analysis and transformations.
    """

    def __init__(self, db: Session):
        """
        Initialize the Lesson service.

        Args:
            db (Session): Active SQLAlchemy session.
        """
        super().__init__(db, Lesson, LessonRepository(db))

    def create(self, data: LessonIn) -> Lesson:
        """Redefined create method to handle group associations when creating a lesson."""

        lesson_data = data.model_dump(exclude={"group_ids"})
        group_ids = data.group_ids

        # Create the lesson
        lesson = super().create(lesson_data)

        # Assign groups to the lesson
        if group_ids:
            self._assign_groups_to_lesson(lesson, group_ids)

        return lesson

    def update(self, id: int, data) -> Lesson:
        """Redefined update method to handle lesson and group updates"""

        # Exclude group_ids from main data
        lesson_data = (
            data.model_dump(exclude_unset=True, exclude={"group_ids"})
            if hasattr(data, "model_dump")
            else {k: v for k, v in data.items() if k != "group_ids"}
        )

        # Update the lesson
        lesson = super().update(id, lesson_data)

        # Update groups if provided
        if hasattr(data, "group_ids") and data.group_ids is not None:
            self._assign_groups_to_lesson(lesson, data.group_ids)
        elif isinstance(data, dict) and "group_ids" in data:
            self._assign_groups_to_lesson(lesson, data["group_ids"])

        return lesson

    def _assign_groups_to_lesson(self, lesson: Lesson, group_ids: List[int]) -> None:
        """Assign groups to the lesson"""
        from ..models.group import Group

        # Get groups by their IDs
        groups = self.db.query(Group).filter(Group.id.in_(group_ids)).all()

        # Assign groups to the lesson
        lesson.groups = groups

        # Commit changes
        self.db.commit()

    def apply_filters(self, query, params):
        """
        Apply common filters to the lessons query.

        Supported:
        - schedule_id: filter by owning schedule.
        - date_from/date_to: inclusive date window.

        Args:
            query: SQLAlchemy query object for Lesson.
            params (LessonQueryParams): Query/filter parameters.

        Returns:
            The filtered SQLAlchemy query.
        """
        if params.schedule_id:
            query = query.filter(Lesson.schedule_id == params.schedule_id)

        # Apply inclusive date range filters when provided
        if hasattr(params, "date_from") and params.date_from:
            query = query.filter(Lesson.date >= params.date_from)
        if hasattr(params, "date_to") and params.date_to:
            query = query.filter(Lesson.date <= params.date_to)

        return super().apply_filters(query, params)

    def get_calendar_lessons(
        self, params: LessonQueryParams
    ) -> CalendarLessonsResponse:
        """
        Get lessons for the calendar view without pagination, filtered by dates.

        Eager-loads related entities for efficient serialization in the calendar UI.

        Args:
            params (LessonQueryParams): Filtering parameters including schedule_id and optional date range.

        Returns:
            CalendarLessonsResponse: Items, count, and the requested date bounds.
        """
        query = (
            self.db.query(Lesson)
            .options(
                selectinload(Lesson.groups).selectinload(Group.semester),
                selectinload(Lesson.room),
                selectinload(Lesson.schedule),
                selectinload(Lesson.subject_assignment).selectinload(
                    SubjectAssignment.subject
                ),
                selectinload(Lesson.subject_assignment)
                .selectinload(SubjectAssignment.workload)
                .selectinload(ProfessorWorkload.contract)
                .selectinload(ProfessorContract.professor_profile)
                .selectinload(ProfessorProfile.user),
            )
            .filter(Lesson.schedule_id == params.schedule_id)
        )

        # Apply date filters if provided
        if params.date_from:
            query = query.filter(Lesson.date >= params.date_from)
        if params.date_to:
            query = query.filter(Lesson.date <= params.date_to)

        lessons = query.order_by(Lesson.date, Lesson.start_time).all()

        return CalendarLessonsResponse(
            items=[LessonOut.model_validate(lesson) for lesson in lessons],
            count=len(lessons),
            date_from=params.date_from,
            date_to=params.date_to,
        )
