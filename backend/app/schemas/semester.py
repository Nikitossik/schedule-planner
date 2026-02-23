from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from datetime import date

from .shared import BaseQueryParams
from .minis import AcademicYearMiniOut
from ..utils.enums import SemesterPeriodEnum


class SemesterBase(BaseModel):
    """
    Base schema for Semester data shared by input/output models.
    Captures identity, academic year linkage, period, numbering, and date bounds.
    """

    model_config = ConfigDict(from_attributes=True)
    name: str = Field(
        max_length=50,
        description="Human-readable semester label.",
        examples=["Fall 2024"],
    )
    academic_year_id: int = Field(
        ...,
        description="Identifier of the academic year this semester belongs to.",
        examples=[1],
    )
    period: SemesterPeriodEnum = Field(
        ...,
        description="Semester period enum value.",
        examples=["winter"],
    )
    number: int = Field(
        gt=0,
        description="Sequential semester number used for ordering/identification.",
        examples=[1],
    )
    start_date: date = Field(
        ...,
        description="Start date of the semester (inclusive).",
        examples=["2024-09-01"],
    )
    end_date: date = Field(
        ...,
        description="End date of the semester (inclusive).",
        examples=["2024-12-31"],
    )


class SemesterIn(SemesterBase):
    """Input schema for creating a Semester."""

    pass


class SemesterUpdate(BaseModel):
    """Partial update schema for Semester; all fields are optional."""

    name: str | None = Field(
        None,
        max_length=50,
        description="Optional new semester label.",
        examples=["Spring 2025"],
    )
    number: int | None = Field(
        None,
        gt=0,
        description="Optional new sequential semester number.",
        examples=[2],
    )
    start_date: date | None = Field(
        None,
        description="Optional new start date (inclusive).",
        examples=["2025-02-01"],
    )
    end_date: date | None = Field(
        None,
        description="Optional new end date (inclusive).",
        examples=["2025-06-30"],
    )


class SemesterOut(SemesterBase):
    """Output schema for Semester including the identifier and related academic year."""

    id: int = Field(
        ...,
        description="Unique identifier of the semester.",
        examples=[2],
    )
    academic_year: Optional[AcademicYearMiniOut] = Field(
        default=None,
        description="Mini representation of the academic year for this semester.",
        examples=[{"id": 1, "name": "2024-2025"}],
    )


class SemesterFilters(BaseModel):
    """Filtering parameters for listing semesters."""

    academic_year_ids: Optional[list[int]] = Field(
        default=[],
        description="Filter by one or more academic year IDs.",
        examples=[[1, 2]],
    )
    periods: Optional[list[SemesterPeriodEnum]] = Field(
        default=[],
        description="Filter by one or more semester periods.",
        examples=[["winter", "summer"]],
    )
    numbers: Optional[list[int]] = Field(
        default=[],
        description="Filter by one or more semester numbers.",
        examples=[[1, 2]],
    )
    is_current: Optional[bool] = Field(
        default=None,
        description="Filter by whether the parent academic year is current.",
        examples=[True],
    )


class SemesterQueryParams(BaseQueryParams, SemesterFilters):
    """Query parameters combining pagination/sorting with semester filters."""

    pass
