from __future__ import annotations
from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Date, Time, ForeignKey, Index, Enum
from datetime import datetime, date, time
from typing import TYPE_CHECKING
from ..utils.enums import LessonTypeEnum

if TYPE_CHECKING:
    from .schedule import Schedule
    from .subject_assignment import SubjectAssignment
    from .group import Group
    from .room import Room
    from .recurring_template import RecurringLessonTemplate


class Lesson(Base):
    """
    Represents a single scheduled lesson session.
    Connects a schedule, group, and subject assignment (professor + subject),
    optionally a room, and stores timing and type metadata.
    Used for conflict detection (room/group/time) and calendar filtering.

    Fields overview:
    - id: numeric primary key.
    - schedule_id: FK to Schedule (owning timetable).
    - group_id: FK to Group (attending cohort).
    - subject_assignment_id: FK to SubjectAssignment (subject/professor/workload).
    - room_id: optional FK to Room (physical location) when not online.
    - is_online: marks whether the lesson is conducted online.
    - date/start_time/end_time: temporal bounds for the lesson occurrence.
    - lesson_type: enum describing the lesson format (e.g., lecture/seminar/lab).
    - relationships: schedule, group, subject_assignment, room.
    - convenience properties: workload, professor, subject.
    - indices: support fast conflict checks and calendar queries.
    """

    __tablename__ = "lesson"

    id: Mapped[int] = mapped_column(primary_key=True)  # Unique identifier (primary key)

    schedule_id: Mapped[int] = mapped_column(
        ForeignKey("schedule.id")
    )  # FK to the owning schedule
    group_id: Mapped[int] = mapped_column(
        ForeignKey("group.id")
    )  # FK to the attending group
    subject_assignment_id: Mapped[int] = mapped_column(
        ForeignKey("subject_assignment.id")
    )  # FK to subject assignment (links subject + professor/workload)
    room_id: Mapped[int] = mapped_column(
        ForeignKey("room.id"), nullable=True
    )  # Optional FK to room (null for online or TBA)

    is_online: Mapped[bool] = mapped_column(
        default=False
    )  # True if the lesson is online

    recurring_template_id: Mapped[int] = mapped_column(
        ForeignKey("recurring_lesson_template.id"), nullable=True
    )

    # Time window (date and start/end times)
    date: Mapped[date] = mapped_column(Date)  # Lesson calendar date
    start_time: Mapped[time] = mapped_column(Time)  # Start time (local)
    end_time: Mapped[time] = mapped_column(Time)  # End time (local)

    # Metadata
    lesson_type: Mapped[LessonTypeEnum] = mapped_column(
        Enum(LessonTypeEnum, create_constraint=True, name="lesson_type_enum")
    )  # Lesson delivery type, stored as an enum

    # Relationships
    schedule: Mapped["Schedule"] = relationship(
        "Schedule", back_populates="lessons"
    )  # Many-to-one: this lesson belongs to a schedule
    group: Mapped["Group"] = relationship(
        "Group"
    )  # Many-to-one: the group attending this lesson
    subject_assignment: Mapped["SubjectAssignment"] = relationship(
        "SubjectAssignment", back_populates="lessons"
    )  # Many-to-one: assignment that ties subject and professor
    room: Mapped["Room"] = relationship("Room")  # Many-to-one: physical room (if any)
    recurring_template: Mapped["RecurringLessonTemplate"] = relationship(
        "RecurringLessonTemplate", back_populates="lessons"
    )

    # Convenience properties accessing related data via subject_assignment
    @property
    def workload(self):
        return self.subject_assignment.workload

    @property
    def professor(self):
        return self.subject_assignment.workload.contract.professor_profile.user

    @property
    def subject(self):
        return self.subject_assignment.subject

    # Optional shortcuts (kept commented out); can be enabled if needed
    # @property
    # def direction(self):
    #     return self.subject_assignment.workload.direction

    # @property
    # def study_form(self):
    #     return self.subject_assignment.workload.study_form

    # Indices supporting fast conflict checks and filtering
    __table_args__ = (
        # Room-time conflict: a room cannot host multiple lessons at the same time
        Index("idx_room_time_conflict", "room_id", "date", "start_time", "end_time"),
        # Group-time conflict: a group cannot attend multiple lessons at the same time
        Index("idx_group_time_conflict", "group_id", "date", "start_time", "end_time"),
        # Calendar filtering: by schedule and start time
        Index("idx_lesson_calendar", "schedule_id", "date", "start_time"),
        # Filtering by subject assignment and group
        Index("idx_lesson_subject_group", "subject_assignment_id", "group_id"),
    )

    # Computed properties for convenience
    @property
    def start_datetime(self) -> datetime:
        return datetime.combine(self.date, self.start_time)

    @property
    def end_datetime(self) -> datetime:
        return datetime.combine(self.date, self.end_time)

    @property
    def duration_minutes(self) -> int:
        delta = datetime.combine(date.min, self.end_time) - datetime.combine(
            date.min, self.start_time
        )
        return int(delta.total_seconds() / 60)
