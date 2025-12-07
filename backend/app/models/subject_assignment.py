from __future__ import annotations
from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, ForeignKey, UniqueConstraint

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .subject import Subject
    from .professor_workload import ProfessorWorkload
    from .lesson import Lesson


class SubjectAssignment(Base):
    """
    Represents assignment of a Subject under a specific ProfessorWorkload (within a semester).
    Records the allocated hours for that subject and serves as the anchor for Lessons.
    Ensures uniqueness of (workload, subject) pairs.

    Fields overview:
    - id: numeric primary key.
    - workload_id: FK to ProfessorWorkload (budget/context of hours).
    - subject_id: FK to Subject being taught.
    - hours_per_subject: allocated hours for the subject within the workload.
    - unique constraint: one SubjectAssignment per (workload, subject).
    - relationships: subject, workload, lessons.
    - properties: professor, direction (convenience accessors).
    """

    __tablename__ = "subject_assignment"

    id: Mapped[int] = mapped_column(primary_key=True)  # Unique identifier (primary key)
    workload_id: Mapped[int] = mapped_column(
        ForeignKey("professor_workload.id")
    )  # FK to the parent workload
    subject_id: Mapped[int] = mapped_column(
        ForeignKey("subject.id")
    )  # FK to the assigned subject
    hours_per_subject: Mapped[int] = mapped_column(
        Integer
    )  # Hours allocated to this subject within the workload

    __table_args__ = (
        UniqueConstraint("workload_id", "subject_id", name="uq_workload_subject"),
    )  # Enforce a single assignment per (workload, subject)

    # relations
    subject: Mapped["Subject"] = relationship(
        "Subject", back_populates="subject_assignments"
    )  # Many-to-one: target subject of this assignment
    workload: Mapped["ProfessorWorkload"] = relationship(
        "ProfessorWorkload", back_populates="subject_assignments"
    )  # Many-to-one: workload under which this assignment is managed

    lessons: Mapped[list["Lesson"]] = relationship(
        "Lesson", back_populates="subject_assignment", lazy="selectin", cascade="all, delete-orphan"
    )  # One-to-many: lessons scheduled for this subject assignment

    @property
    def professor(self):
        # Convenience: User of the professor via workload -> contract -> profile.
        return self.workload.contract.professor_profile.user

    @property
    def direction(self):
        # Convenience: Direction obtained from the subject.
        return self.subject.direction
