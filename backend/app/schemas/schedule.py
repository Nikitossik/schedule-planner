from pydantic import BaseModel, ConfigDict, Field
from typing import Optional
from datetime import datetime
from .shared import BaseQueryParams
from .minis import (
    SemesterMiniOut,
    AcademicYearMiniOut,
    DirectionMiniOut,
    FacultyMiniOut,
)
from ..utils.enums import ExportFormat


class ScheduleBase(BaseModel):
    """Base schema for Schedule data shared by input/output models."""

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(
        ...,
        min_length=1,
        max_length=100,
        description="Human-readable schedule name.",
        examples=["CS Fall 2024"],
    )
    semester_id: int = Field(
        ...,
        description="Identifier of the semester this schedule belongs to.",
        examples=[2],
    )
    direction_id: int = Field(
        ...,
        description="Identifier of the direction/program this schedule is for.",
        examples=[3],
    )


class ScheduleIn(ScheduleBase):
    """Input schema for creating a Schedule."""

    pass


class ScheduleUpdate(BaseModel):
    """Partial update schema for Schedule; all fields are optional."""

    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = Field(
        None,
        min_length=1,
        max_length=100,
        description="Optional new schedule name.",
        examples=["CS Spring 2025"],
    )


class ScheduleOut(BaseModel):
    """Output schema for Schedule including related mini resources."""

    id: int = Field(
        ...,
        description="Unique identifier of the schedule.",
        examples=[5],
    )
    name: str = Field(
        ...,
        description="Schedule display name.",
        examples=["CS Fall 2024"],
    )

    academic_year: AcademicYearMiniOut = Field(
        ...,
        description="Mini representation of the academic year derived from the semester.",
        examples=[{"id": 1, "name": "2024-2025"}],
    )
    semester: SemesterMiniOut = Field(
        ...,
        description="Mini representation of the semester this schedule belongs to.",
        examples=[{"id": 2, "name": "Fall 2024"}],
    )
    faculty: FacultyMiniOut = Field(
        ...,
        description="Mini representation of the faculty derived from the direction.",
        examples=[{"id": 4, "name": "Engineering"}],
    )
    direction: DirectionMiniOut = Field(
        ...,
        description="Mini representation of the direction this schedule is for.",
        examples=[{"id": 3, "name": "Computer Science", "code": "CS-01"}],
    )


class ScheduleFilters(BaseModel):
    """Filtering parameters for schedules (reserved for future use)."""

    pass


class ScheduleQueryParams(BaseQueryParams, ScheduleFilters):
    """Query parameters combining pagination/sorting with schedule filters."""

    pass


class ScheduleExportParams(BaseModel):
    """Parameters for exporting a schedule to a file (Excel or PDF)."""

    format: ExportFormat = Field(
        default=ExportFormat.excel,
        description='Export format. One of: "excel", "pdf".',
        examples=["excel"],
    )
    group_ids: Optional[list[int]] = Field(
        default=None,
        description="IDs of groups to include in the export. If omitted, include all.",
        examples=[[10, 11, 15]],
    )
    filename: Optional[str] = Field(
        default=None,
        description="Output file name without extension.",
        min_length=1,
        max_length=100,
        examples=["cs_fall_2024_schedule"],
    )
