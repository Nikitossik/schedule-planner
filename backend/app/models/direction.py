from __future__ import annotations
from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, ForeignKey

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .faculty import Faculty
    from .study_form import StudyForm
    from .subject import Subject
    from .schedule import Schedule


class Direction(Base):
    """
    Represents an academic direction/program (e.g., a specialization or degree track).
    Connects to the owning Faculty and organizes study forms, subjects, and schedules
    under this direction.

    Fields overview:
    - id: numeric primary key.
    - name: human-readable program/direction name.
    - code: unique formal code for the direction.
    - faculty_id: foreign key to the owning faculty.
    - faculty: many-to-one relation to Faculty.
    - study_forms: one-to-many study formats (e.g., full-time/part-time) with cascading delete.
    - subjects: one-to-many subjects offered in this direction.
    - schedules: one-to-many schedules associated with this direction.
    """

    __tablename__ = "direction"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )  # Unique numeric identifier (primary key)
    name: Mapped[str] = mapped_column(
        String(100)
    )  # Human-readable direction/program name
    code: Mapped[str] = mapped_column(
        String(20), unique=True
    )  # Unique program code (enforced at DB level)
    faculty_id: Mapped[int] = mapped_column(
        ForeignKey("faculty.id")
    )  # FK referencing the owning faculty

    # relations
    faculty: Mapped["Faculty"] = relationship(
        "Faculty", back_populates="directions", lazy="selectin"
    )  # Many-to-one: this direction belongs to a single faculty
    study_forms: Mapped[list["StudyForm"]] = relationship(
        "StudyForm",
        back_populates="direction",
        cascade="all, delete-orphan",
    )  # One-to-many: study formats under this direction; cascades on direction deletion
    subjects: Mapped[list["Subject"]] = relationship(
        "Subject", back_populates="direction", cascade="all, delete-orphan"
    )  # One-to-many: subjects associated with this direction
