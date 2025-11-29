from typing import Optional
from pydantic import BaseModel, ConfigDict, Field
from .shared import BaseQueryParams, BaseFilterParams
from .minis import (
    AcademicYearMiniOut,
    DirectionMiniOut,
    SemesterMiniOut,
    StudyFormMiniOut,
)
from ..utils.enums import SemesterPeriodEnum


class GroupBase(BaseModel):
    """
    Base schema for Group data shared by input/output models.
    Captures identity and links to semester and study form.
    """

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(
        max_length=100,
        description="Human-readable group name/identifier.",
        examples=["CS-101"],
    )
    student_count: int | None = Field(
        None,
        ge=0,
        description="Manual student count (for production mode without student accounts).",
        examples=[25],
    )
    semester_id: int = Field(
        gt=0,
        description="Identifier of the semester this group belongs to.",
        examples=[1],
    )
    study_form_id: int = Field(
        gt=0,
        description="Identifier of the study form this group belongs to.",
        examples=[2],
    )


class GroupIn(GroupBase):
    """Input schema for creating a Group."""

    pass


class GroupUpdate(BaseModel):
    """Partial update schema for Group; all fields are optional."""

    name: str | None = Field(
        None,
        max_length=100,
        description="Optional new group name/identifier.",
        examples=["CS-102"],
    )
    student_count: int | None = Field(
        None,
        ge=0,
        description="Optional manual student count.",
        examples=[30],
    )
    semester_id: int | None = Field(
        None,
        gt=0,
        description="Optional new semester identifier.",
        examples=[2],
    )
    study_form_id: int | None = Field(
        None,
        gt=0,
        description="Optional new study form identifier.",
        examples=[3],
    )


class GroupOut(BaseModel):
    """Output schema for Group including related mini resources and counters."""

    id: int = Field(
        ...,
        description="Unique identifier of the group.",
        examples=[10],
    )
    name: str = Field(
        ...,
        description="Group name/identifier.",
        examples=["CS-101"],
    )
    academic_year: Optional[AcademicYearMiniOut] = Field(
        default=None,
        description="Academic year inferred from the group's semester.",
        examples=[{"id": 1, "name": "2024-2025"}],
    )
    semester: Optional[SemesterMiniOut] = Field(
        default=None,
        description="Semester the group belongs to.",
        examples=[{"id": 1, "name": "Fall 2024"}],
    )
    study_form: Optional[StudyFormMiniOut] = Field(
        default=None,
        description="Study form of the group.",
        examples=[{"id": 2, "form": "FULL_TIME"}],
    )
    direction: Optional[DirectionMiniOut] = Field(
        default=None,
        description="Direction/program associated via the study form.",
        examples=[{"id": 3, "name": "Computer Science"}],
    )
    students_count_display: int = Field(
        ...,
        description="Display count: manual if set, otherwise actual.",
        examples=[28],
    )


class GroupFilters(BaseFilterParams):
    """Filtering parameters for listing groups."""

    faculty_ids: list[int] | None = Field(
        default=[],
        description="Filter by one or more faculty IDs.",
        examples=[[1, 2]],
    )
    direction_ids: list[int] | None = Field(
        default=[],
        description="Filter by one or more direction IDs.",
        examples=[[3, 4]],
    )
    study_forms: list[str] | None = Field(
        default=[],
        description="Filter by study form values (e.g., FULL_TIME, PART_TIME).",
        examples=[["FULL_TIME"]],
    )
    academic_year_ids: list[int] | None = Field(
        default=[],
        description="Filter by one or more academic year IDs.",
        examples=[[1]],
    )
    periods: list[SemesterPeriodEnum] | None = Field(
        default=[],
        description="Filter by semester periods.",
        examples=[["AUTUMN"]],
    )
    semester_ids: list[int] | None = Field(
        default=[],
        description="Filter by one or more semester IDs.",
        examples=[[1, 2]],
    )


class GroupQueryParams(BaseQueryParams, GroupFilters):
    """Query parameters combining pagination/sorting with group filters."""

    pass
