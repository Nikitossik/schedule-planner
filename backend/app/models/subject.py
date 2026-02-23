from __future__ import annotations

from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, String, ForeignKey

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .direction import Direction
    from .semester import Semester
    from .subject_assignment import SubjectAssignment


class Subject(Base):
    """
    Represents a subject/course offered by a Direction in a specific Semester.
    Used to organize assignments and lessons, and to provide UI metadata (color).

    Fields overview:
    - id: numeric primary key.
    - name: human-readable subject name.
    - allocated_hours: total hours allocated for this subject (can be used for tracking).
    - semester_id: FK to the Semester when this subject is offered.
    - direction_id: FK to the owning Direction.
    - relationships: semester, direction, subject_assignments.
    - properties: faculty, academic_year (convenience accessors).
    """

    __tablename__ = "subject"

    id: Mapped[int] = mapped_column(primary_key=True)  # Unique identifier (primary key)
    name: Mapped[str] = mapped_column(String(100))  # Subject display name
    allocated_hours: Mapped[int] = mapped_column(Integer, default=0)
    semester_id: Mapped[int] = mapped_column(
        ForeignKey("semester.id")
    )  # FK to the offering semester
    direction_id: Mapped[int] = mapped_column(
        ForeignKey("direction.id")
    )  # FK to the owning direction/program

    # relations
    semester: Mapped["Semester"] = relationship(
        "Semester", lazy="selectin"
    )  # Many-to-one: semester that includes this subject
    direction: Mapped["Direction"] = relationship(
        "Direction", back_populates="subjects", lazy="selectin"
    )  # Many-to-one: direction that owns this subject
    subject_assignments: Mapped[list["SubjectAssignment"]] = relationship(
        "SubjectAssignment", back_populates="subject", lazy="selectin", cascade="all, delete-orphan"
    )  # One-to-many: assignments of this subject to professor workloads

    @property
    def faculty(self):
        # Convenience: faculty via the owning direction.
        return self.direction.faculty

    @property
    def academic_year(self):
        # Convenience: academic year via the subject's semester.
        return self.semester.academic_year

    @property
    def used_hours(self) -> float:
        """
        Calculate total academic hours used across all lessons for this subject.
        Sums academic_hours from all lessons in all subject_assignments.
        """
        total_hours = 0.0
        for assignment in self.subject_assignments:
            for lesson in assignment.lessons:
                total_hours += lesson.academic_hours
        return round(total_hours, 2)
