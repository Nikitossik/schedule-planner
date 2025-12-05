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
    from .study_form import StudyForm


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

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

    semester_id: Mapped[int] = mapped_column(
        ForeignKey("semester.id")
    )  # FK to the related semester
    study_form_id: Mapped[int] = mapped_column(
        ForeignKey("study_form.id")
    )  # FK to the related direction/program
    # Relationships

    semester: Mapped["Semester"] = relationship(
        "Semester", back_populates="schedules"
    )  # Many-to-one: this schedule belongs to one semester

    lessons: Mapped[List["Lesson"]] = relationship(
        "Lesson", back_populates="schedule"
    )  # One-to-many: lessons contained in this schedule
    study_form: Mapped["StudyForm"] = relationship("StudyForm", lazy="selectin")

    @property
    def academic_year(self):
        # Convenience: academic year derived via the related semester.
        return self.semester.academic_year

    @property
    def faculty(self):
        # Convenience: faculty derived via the related study form.
        return self.study_form.direction.faculty

    @property
    def direction(self):
        # Convenience: direction derived via the related study form.
        return self.study_form.direction

    @property
    def workloads(self):
        # Convenience: workloads derived via the related study form.
        return self.study_form.workloads

    @property
    def groups(self):
        return self.study_form.groups
