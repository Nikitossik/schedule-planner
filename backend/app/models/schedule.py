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
    from .recurring_template import RecurringLessonTemplate

class Schedule(Base):
    """
    Represents a timetable for a specific direction within a semester.
    Owns a collection of Lesson entries and provides shortcuts to academic year and faculty.

    Fields overview:
    - id: numeric primary key.
    - name: human-readable schedule name.
    - semester_id: FK to Semester this schedule belongs to.
    - study_form_id: FK to StudyForm (direction/program) this schedule is for.
    - relationships: semester, study_form, lessons.
    - properties: academic_year, faculty, direction, workloads, groups.
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

    recurring_lessons: Mapped[List["RecurringLessonTemplate"]] = relationship(
        "RecurringLessonTemplate", back_populates="schedule", cascade="all, delete-orphan",
    )
    lessons: Mapped[List["Lesson"]] = relationship(
        "Lesson", back_populates="schedule", cascade="all, delete-orphan",
    )  # One-to-many: lessons contained in this schedule
    study_form: Mapped["StudyForm"] = relationship("StudyForm", lazy="selectin")

    @property
    def academic_year(self):
        if self.semester and self.semester.academic_year:
            return self.semester.academic_year

    @property
    def faculty(self):
        if self.study_form and self.study_form.direction and self.study_form.direction.faculty:
            return self.study_form.direction.faculty
        

    @property
    def direction(self):
        if self.study_form and self.study_form.direction:
            return self.study_form.direction

    @property
    def workloads(self):
        if self.study_form and self.study_form.workloads:
            return self.study_form.workloads

    @property
    def groups(self):
        if self.study_form and self.study_form.groups:
            return self.study_form.groups