from pydantic import BaseModel, ConfigDict, Field
from .shared import BaseQueryParams, BaseFilterParams
from .minis import (
    AcademicYearMiniOut,
    DirectionMiniOut,
    FacultyMiniOut,
    SemesterMiniOut,
)
from ..utils.enums import SemesterPeriodEnum


class SubjectBase(BaseModel):
    """
    Base schema for Subject data shared by input/output models.
    Describes the subject identity and optional UI color tag.
    """

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(
        max_length=100,
        description="Human-readable subject name.",
        examples=["Linear Algebra"],
    )
    code: str = Field(
        max_length=10,
        description="Unique short code for the subject.",
        examples=["MATH101"],
    )
    color: str | None = Field(
        None,
        max_length=7,
        description='Optional hex color for UI tagging (e.g., "#RRGGBB").',
        examples=["#1E90FF"],
    )
    allocated_hours: int = Field(
        0,
        description="Allocated hours for the subject.",
        examples=[40],
    )


class SubjectIn(SubjectBase):
    """Input schema for creating a Subject."""

    semester_id: int = Field(
        ...,
        description="Identifier of the semester when this subject is offered.",
        examples=[2],
    )
    direction_id: int = Field(
        ...,
        description="Identifier of the direction/program that owns this subject.",
        examples=[3],
    )


class SubjectUpdate(BaseModel):
    """Partial update schema for Subject; all fields are optional."""

    name: str | None = Field(
        None,
        max_length=100,
        description="Optional new subject name.",
        examples=["Advanced Algebra"],
    )
    code: str | None = Field(
        None,
        max_length=10,
        description="Optional new subject code.",
        examples=["MATH201"],
    )
    color: str | None = Field(
        None,
        max_length=7,
        description='Optional new UI color (hex, e.g., "#RRGGBB").',
        examples=["#FF8C00"],
    )
    allocated_hours: int | None = Field(
        None,
        description="Optional new allocated hours for the subject.",
        examples=[40],
    )


class SubjectOut(SubjectBase):
    """Output schema for Subject including identifiers and related mini resources."""

    id: int = Field(
        ...,
        description="Unique identifier of the subject.",
        examples=[7],
    )
    faculty: FacultyMiniOut = Field(
        ...,
        description="Mini representation of the faculty derived from the direction.",
        examples=[{"id": 4, "name": "Engineering"}],
    )
    direction: DirectionMiniOut = Field(
        ...,
        description="Mini representation of the direction that owns this subject.",
        examples=[{"id": 3, "name": "Computer Science", "code": "CS-01"}],
    )
    academic_year: AcademicYearMiniOut = Field(
        ...,
        description="Mini representation of the academic year derived from the semester.",
        examples=[{"id": 1, "name": "2024-2025"}],
    )
    semester: SemesterMiniOut = Field(
        ...,
        description="Mini representation of the semester when the subject is offered.",
        examples=[{"id": 2, "name": "Fall 2024"}],
    )


class SubjectFilters(BaseFilterParams):
    """Filtering parameters for listing subjects."""

    academic_year_ids: list[int] | None = Field(
        default=[],
        description="Filter by one or more academic year IDs.",
        examples=[[1, 2]],
    )
    periods: list[SemesterPeriodEnum] | None = Field(
        default=[],
        description="Filter by one or more semester periods.",
        examples=[["AUTUMN", "SPRING"]],
    )
    semester_ids: list[int] | None = Field(
        default=[],
        description="Filter by one or more semester IDs.",
        examples=[[2, 3]],
    )
    faculty_ids: list[int] | None = Field(
        default=[],
        description="Filter by one or more faculty IDs.",
        examples=[[4]],
    )
    direction_ids: list[int] | None = Field(
        default=[],
        description="Filter by one or more direction IDs.",
        examples=[[3, 5]],
    )


class SubjectQueryParams(BaseQueryParams, SubjectFilters):
    """Query parameters combining pagination/sorting with subject filters and free-text search."""

    q: str | None = Field(
        default=None,
        description="Free-text search by subject name or code.",
        examples=["algebra"],
    )
