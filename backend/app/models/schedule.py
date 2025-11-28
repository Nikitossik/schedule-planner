from __future__ import annotations
from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, DateTime, ForeignKey
from sqlalchemy import func
from datetime import datetime
from typing import TYPE_CHECKING, List

if TYPE_CHECKING:
    from .semester import Semester
    from .lesson import Lesson
    from .direction import Direction


class Schedule(Base):
    """
    Represents a timetable for a specific direction within a semester.
    Owns a collection of Lesson entries and provides shortcuts to academic year and faculty.

    Fields overview:
    - id: numeric primary key.
    - name: human-readable schedule name.
    - semester_id: FK to Semester this schedule belongs to.
    - direction_id: FK to Direction this schedule is created for.
    - relationships: semester, direction, lessons.
    - properties: academic_year, faculty.
    """

    __tablename__ = "schedule"

    id: Mapped[int] = mapped_column(primary_key=True)  # Unique identifier (primary key)
    name: Mapped[str] = mapped_column(String(100))  # Display name for the schedule
    semester_id: Mapped[int] = mapped_column(
        ForeignKey("semester.id")
    )  # FK to the related semester
    direction_id: Mapped[int] = mapped_column(
        ForeignKey("direction.id")
    )  # FK to the related direction

    # Relationships
    semester: Mapped["Semester"] = relationship(
        "Semester", back_populates="schedules"
    )  # Many-to-one: this schedule belongs to one semester
    direction: Mapped["Direction"] = relationship(
        "Direction", back_populates="schedules"
    )  # Many-to-one: this schedule is for one direction
    lessons: Mapped[List["Lesson"]] = relationship(
        "Lesson", back_populates="schedule"
    )  # One-to-many: lessons contained in this schedule

    @property
    def academic_year(self):
        # Convenience: academic year derived via the related semester.
        return self.semester.academic_year

    @property
    def faculty(self):
        # Convenience: faculty derived via the related direction.
        return self.direction.faculty
