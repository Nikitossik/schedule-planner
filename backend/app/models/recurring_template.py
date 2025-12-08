from __future__ import annotations

from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Enum, Date, Time, ForeignKey, Boolean, Table, Column
from datetime import date, time
from typing import TYPE_CHECKING, List
from ..utils.enums import LessonTypeEnum


if TYPE_CHECKING:
    from .schedule import Schedule
    from .group import Group
    from .subject_assignment import SubjectAssignment
    from .room import Room
    from .lesson import Lesson


recurring_template_groups = Table(
    "recurring_template_groups",
    Base.metadata,
    Column(
        "recurring_template_id",
        ForeignKey("recurring_lesson_template.id"),
        primary_key=True,
    ),
    Column("group_id", ForeignKey("group.id"), primary_key=True),
)


class RecurringLessonTemplate(Base):
    """
    Template for recurring lessons that defines the pattern and generates individual Lesson instances.

    This model stores the recurring pattern (days of week, time, duration) and the lesson details
    (group, subject assignment, room) that will be used to generate individual Lesson records
    for each occurrence within the specified date range.

    Fields overview:
    - id: numeric primary key
    - name: optional human-readable name for the template
    - schedule_id: FK to Schedule this template belongs to
    - group_id: FK to Group that will attend these lessons
    - subject_assignment_id: FK to SubjectAssignment (professor + subject + workload)
    - room_id: optional FK to Room (can be null for online lessons)
    - lesson_type: type of lesson (lecture, practice, lab, seminar)
    - is_online: whether lessons are conducted online
    - days_of_week: JSON array of weekday numbers (0=Monday, 6=Sunday)
    - start_time/end_time: time bounds for each lesson occurrence
    - start_date: first date to generate lessons from
    - end_date: last date to generate lessons until (null = until semester end)
    """

    __tablename__ = "recurring_lesson_template"

    # Primary key
    id: Mapped[int] = mapped_column(primary_key=True)

    # Optional name - if not provided, will be auto-generated from subject + group
    name: Mapped[str] = mapped_column(String(200), nullable=True)

    # Foreign keys to related entities
    schedule_id: Mapped[int] = mapped_column(ForeignKey("schedule.id"))
    subject_assignment_id: Mapped[int] = mapped_column(
        ForeignKey("subject_assignment.id")
    )
    room_id: Mapped[int] = mapped_column(
        ForeignKey("room.id"), nullable=True
    )  # Nullable for online lessons

    # Metadata
    lesson_type: Mapped[LessonTypeEnum] = mapped_column(
        Enum(LessonTypeEnum, create_constraint=True, name="lesson_type_enum")
    )  # Lesson delivery type, stored as an enum

    is_online: Mapped[bool] = mapped_column(Boolean, default=False)

    # Recurrence pattern
    days_of_week: Mapped[str] = mapped_column(
        String(20)
    )  # JSON array: "[1,3,5]" for Mon,Wed,Fri
    start_time: Mapped[time] = mapped_column(Time)  # Start time for each lesson
    end_time: Mapped[time] = mapped_column(Time)  # End time for each lesson

    # Date range for generation
    start_date: Mapped[date] = mapped_column(
        Date
    )  # First date to generate lessons from
    end_date: Mapped[date] = mapped_column(
        Date, nullable=True
    )  # Last date (null = until semester end)

    # Relationships
    schedule: Mapped["Schedule"] = relationship("Schedule", back_populates="recurring_lessons")
    groups: Mapped[List["Group"]] = relationship(
        "Group", secondary=recurring_template_groups
    )
    subject_assignment: Mapped["SubjectAssignment"] = relationship("SubjectAssignment", back_populates="recurring_templates")
    room: Mapped["Room"] = relationship("Room")
    lessons: Mapped[List["Lesson"]] = relationship(
        "Lesson", back_populates="recurring_template", cascade="all, delete-orphan"
    )

    @property
    def professor(self):
        # Convenience: User associated via the contract’s professor profile.
        return self.subject_assignment.workload.contract.professor_profile.user

    @property
    def workload(self):
        # Convenience: Workload via the subject assignment.
        return self.subject_assignment.workload
