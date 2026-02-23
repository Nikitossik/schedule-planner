from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from datetime import date
from .shared import BaseQueryParams, BaseFilterParams
from .minis import SemesterMiniOut


class AcademicYearBase(BaseModel):
    """
    Base schema for AcademicYear data used across create/read operations.
    Captures the year label, date bounds, and the active-year flag.
    """

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(
        max_length=50,
        description="Display label for the academic year in the format YYYY-YYYY.",
        examples=["2024-2025"],
    )
    start_date: date = Field(
        description="Start date of the academic year (inclusive).",
        examples=["2024-09-01"],
    )
    end_date: date = Field(
        description="End date of the academic year (inclusive).",
        examples=["2025-06-30"],
    )
    is_current: bool = Field(
        default=False,
        description="Marks the currently active academic year. Typically only one is active.",
        examples=[True],
    )


class AcademicYearIn(AcademicYearBase):
    """Input schema for creating an AcademicYear."""

    pass


class AcademicYearUpdate(BaseModel):
    """Partial update schema for AcademicYear; all fields are optional."""

    name: str | None = Field(
        None,
        max_length=100,
        description="Optional new display label for the academic year.",
        examples=["2025-2026"],
    )
    start_date: date | None = Field(
        None,
        description="Optional new start date (inclusive).",
        examples=["2025-09-01"],
    )
    end_date: date | None = Field(
        None,
        description="Optional new end date (inclusive).",
        examples=["2026-06-30"],
    )
    is_current: bool | None = Field(
        None,
        description="Optional flag to set this academic year as active.",
        examples=[False],
    )


class AcademicYearOut(AcademicYearBase):
    """Output schema for AcademicYear including identifier and related semesters."""

    id: int = Field(
        ...,
        description="Unique identifier of the academic year.",
        examples=[1],
    )
    semesters: Optional[list[SemesterMiniOut]] = Field(
        default=None,
        description="List of semesters that belong to this academic year.",
        examples=[[{"id": 1, "name": "Winter 2024"}]],
    )


class AcademicYearParams(BaseFilterParams):
    """Filtering parameters targeting AcademicYear records."""

    academic_year_id: int | None = Field(
        default=None,
        description="Filter by a specific academic year ID.",
        examples=[1],
    )


class AcademicYearQueryParams(BaseQueryParams, AcademicYearParams):
    """Query parameters combining pagination/sorting with AcademicYear filters."""

    pass
