from __future__ import annotations
from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Enum
from ..utils.enums import StudyFormEnum

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .direction import Direction
    from .group import Group
    from .professor_workload import ProfessorWorkload
    from .schedule import Schedule

class StudyForm(Base):
    """
    Represents a study format for a given Direction (e.g., full-time, part-time).
    Groups and professor workloads are tied to a specific study form.

    Fields overview:
    - id: numeric primary key.
    - direction_id: FK to the owning Direction.
    - form: enum value indicating the study format (StudyFormEnum).
    - relationships: direction, groups, workloads.
    """

    __tablename__ = "study_form"

    id: Mapped[int] = mapped_column(primary_key=True)  # Unique identifier (primary key)
    direction_id: Mapped[int] = mapped_column(
        ForeignKey("direction.id")
    )  # FK to Direction this study form belongs to
    form: Mapped[StudyFormEnum] = mapped_column(
        Enum(StudyFormEnum, create_constraint=True, name="study_form_enum")
    )  # Enum storing the study format (e.g., FULL_TIME, PART_TIME)

    # relations
    schedules: Mapped[list["Schedule"]] = relationship(
        "Schedule", back_populates="study_form", lazy="selectin", cascade="all, delete-orphan"
    )  # One-to-many: schedules associated with this study form; select-in eager loading
    direction: Mapped["Direction"] = relationship(
        "Direction", back_populates="study_forms", lazy="selectin"
    )  # Many-to-one: this study form belongs to a single direction; select-in eager loading
    groups: Mapped[list["Group"]] = relationship(
        "Group", back_populates="study_form", lazy="selectin", cascade="all, delete-orphan"
    )  # One-to-many: groups organized under this study form; select-in eager loading
    workloads: Mapped[list["ProfessorWorkload"]] = relationship(
        "ProfessorWorkload", back_populates="study_form", lazy="selectin", cascade="all, delete-orphan"
    )  # One-to-many: professor workloads allocated for this study form
