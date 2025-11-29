from __future__ import annotations

from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .study_form import StudyForm
    from .student_profile import StudentProfile
    from .lesson import Lesson
    from .semester import Semester


class Group(Base):
    """
    Represents a student group/cohort within a study form and semester.
    Used to organize students, lessons, and scheduling within a specific term.

    Fields overview:
    - id: numeric primary key.
    - name: human-readable group name/identifier.
    - study_form_id: FK to StudyForm (ties the group to a direction and study format).
    - semester_id: FK to Semester (ties the group to an academic period).
    - study_form: many-to-one relation to StudyForm.
    - semester: many-to-one relation to Semester.
    - students: one-to-many relation to StudentProfile.
    - students_count/academic_year/direction: convenience accessors.
    """

    __tablename__ = "group"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )  # Unique numeric identifier (primary key)
    name: Mapped[str] = mapped_column(
        String(100)
    )  # Group display name (e.g., "CS-101")
    student_count: Mapped[int | None] = mapped_column(
        nullable=True
    )  # Manual student count (for production mode without student accounts)
    study_form_id: Mapped[int] = mapped_column(
        ForeignKey("study_form.id")
    )  # FK to the associated study form
    semester_id: Mapped[int] = mapped_column(
        ForeignKey("semester.id")
    )  # FK to the associated semester

    # relations
    study_form: Mapped["StudyForm"] = relationship(
        "StudyForm", back_populates="groups"
    )  # Many-to-one: this group belongs to one study form
    semester: Mapped["Semester"] = relationship(
        "Semester", back_populates="groups"
    )  # Many-to-one: this group belongs to one semester
    students: Mapped[list["StudentProfile"]] = relationship(
        "StudentProfile", back_populates="group"
    )  # One-to-many: student profiles assigned to this group
    # lessons: Mapped[list["Lesson"]] = relationship("Lesson", back_populates="group")  # One-to-many: lessons scheduled for this group (currently disabled)

    @property
    def students_count_display(self):
        # Returns manual count if set, otherwise actual count from relationship
        return (
            self.student_count if self.student_count is not None else len(self.students)
        )

    @property
    def academic_year(self):
        # Convenience: academic year accessed via the group's semester.
        return self.semester.academic_year

    @property
    def direction(self):
        # Convenience: direction accessed via the group's study form.
        return self.study_form.direction
