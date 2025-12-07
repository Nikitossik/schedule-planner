from __future__ import annotations
from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Date, ForeignKey, Enum
from sqlalchemy.ext.hybrid import hybrid_property

from datetime import date
from ..utils.enums import SemesterPeriodEnum

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .professor_contract import ProfessorContract
    from .schedule import Schedule
    from .group import Group
    from .academic_year import AcademicYear


class Semester(Base):
    """
    Represents a semester within an academic year.
    Defines its time window, naming, and period (e.g., Autumn/Spring) and links
    to groups, professor contracts, and schedules in that time frame.

    Fields overview:
    - id: numeric primary key.
    - name: human-readable label (e.g., "Fall 2024").
    - number: sequential semester number.
    - academic_year_id: FK to the parent AcademicYear.
    - period: enum indicating the semester period.
    - start_date/end_date: inclusive date bounds for the semester.
    - relationships: academic_year, groups, contracts, schedules.
    - computed: is_current mirrors AcademicYear.is_current.
    """

    __tablename__ = "semester"

    id: Mapped[int] = mapped_column(primary_key=True)  # Primary key
    name: Mapped[str] = mapped_column(String(50))  # Display label for the semester
    number: Mapped[int]  # Sequential number for ordering/identification
    academic_year_id: Mapped[int] = mapped_column(
        ForeignKey("academic_year.id")
    )  # FK to the owning academic year

    period: Mapped[SemesterPeriodEnum] = mapped_column(
        Enum(SemesterPeriodEnum, create_constraint=True, name="semester_period_enum"),
    )  # Enum describing the semester period (e.g., Autumn/Spring)

    start_date: Mapped[date] = mapped_column(Date)  # Semester start date (inclusive)
    end_date: Mapped[date] = mapped_column(Date)  # Semester end date (inclusive)

    # Relationships
    academic_year: Mapped["AcademicYear"] = relationship(
        "AcademicYear", back_populates="semesters", lazy="selectin"
    )  # Many-to-one: parent academic year
    groups: Mapped[list["Group"]] = relationship(
        "Group", back_populates="semester", cascade="all, delete-orphan"
    )  # One-to-many: student groups in this semester
    contracts: Mapped[list["ProfessorContract"]] = relationship(
        "ProfessorContract", back_populates="semester", cascade="all, delete-orphan"
    )  # One-to-many: professor contracts active this semester
    schedules: Mapped[list["Schedule"]] = relationship(
        "Schedule", back_populates="semester", cascade="all, delete-orphan"
    )  # One-to-many: schedules associated with this semester

    @hybrid_property
    def is_current(self) -> bool:
        # True if the parent academic year is currently active.
        return self.academic_year.is_current
