from __future__ import annotations
from typing import TYPE_CHECKING


from sqlalchemy import Boolean, String, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date
from ..database import Base

if TYPE_CHECKING:
    from .semester import Semester


class AcademicYear(Base):
    """
    Represents an academic year (e.g., 2024–2025).
    Defines the global time window used to organize semesters and planning data.
    The is_current flag indicates which year is active in the system.

    Fields overview:
    - id: numeric primary key.
    - name: human-readable label like "2024-2025".
    - start_date/end_date: inclusive date bounds for the academic year.
    - is_current: marks the active year; typically only one should be True.
    - semesters: one-to-many relation to Semester instances within this year.
    """

    __tablename__ = "academic_year"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )  # Unique numeric identifier (primary key)
    name: Mapped[str] = mapped_column(String(50))  # Display label, e.g., "2024-2025"

    start_date: Mapped[date] = mapped_column(
        Date
    )  # Start of the academic year (inclusive), e.g., 2024-09-01
    end_date: Mapped[date] = mapped_column(
        Date
    )  # End of the academic year (inclusive), e.g., 2025-06-30

    is_current: Mapped[bool] = mapped_column(
        Boolean, default=False
    )  # Indicates the currently active academic year

    semesters: Mapped[list["Semester"]] = relationship(
        "Semester", back_populates="academic_year", cascade="all, delete-orphan"
    )  # One-to-many: all semesters associated with this academic year
