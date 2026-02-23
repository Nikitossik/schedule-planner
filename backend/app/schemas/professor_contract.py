from pydantic import BaseModel, ConfigDict, Field
from .shared import BaseQueryParams, BaseFilterParams
from .minis import (
    AcademicYearMiniOut,
    ProfessorMiniOut,
    SemesterMiniOut,
    ProfessorWorkloadMiniOut,
)
from ..utils.enums import SemesterPeriodEnum


class ProfessorContractBase(BaseModel):
    """
    Base schema for ProfessorContract data shared by input/output models.
    Captures links to professor profile and semester plus total contracted hours.
    """

    model_config = ConfigDict(from_attributes=True)

    professor_profile_id: int = Field(
        gt=0,
        description="Identifier of the professor profile that owns this contract.",
        examples=[21],
    )
    semester_id: int = Field(
        gt=0,
        description="Identifier of the semester this contract applies to.",
        examples=[2],
    )
    total_hours: int = Field(
        gt=0,
        description="Total contracted teaching hours for the semester.",
        examples=[300],
    )


class ProfessorContractIn(ProfessorContractBase):
    """Input schema for creating a ProfessorContract."""

    pass


class ProfessorContractUpdate(BaseModel):
    """Partial update schema for ProfessorContract; all fields are optional."""

    professor_profile_id: int | None = Field(
        None,
        gt=0,
        description="Optional new professor profile identifier.",
        examples=[22],
    )
    semester_id: int | None = Field(
        None,
        gt=0,
        description="Optional new semester identifier.",
        examples=[3],
    )
    total_hours: int | None = Field(
        None,
        gt=0,
        description="Optional new total contracted hours.",
        examples=[320],
    )


class ProfessorContractOut(BaseModel):
    """Output schema for ProfessorContract including aggregates and related mini resources."""

    id: int = Field(
        ...,
        description="Unique identifier of the professor contract.",
        examples=[9],
    )
    total_hours: int = Field(
        ...,
        description="Total contracted teaching hours for the semester.",
        examples=[300],
    )
    total_workload_hours: int = Field(
        ...,
        description="Sum of hours assigned across all workloads in this contract.",
        examples=[180],
    )
    remaining_hours: int = Field(
        ...,
        description="Remaining hours (total_hours - total_workload_hours).",
        examples=[120],
    )
    professor: ProfessorMiniOut = Field(
        ...,
        description="Mini representation of the professor (user) associated with this contract.",
        examples=[
            {"id": 55, "email": "ada@example.com", "name": "Ada", "surname": "Lovelace"}
        ],
    )
    academic_year: AcademicYearMiniOut = Field(
        ...,
        description="Mini representation of the academic year derived from the semester.",
        examples=[
            {
                "id": 1,
                "name": "2024-2025",
                "start_date": "2024-09-01",
                "end_date": "2025-06-30",
                "is_current": True,
            }
        ],
    )
    semester: SemesterMiniOut = Field(
        ...,
        description="Mini representation of the semester for this contract.",
        examples=[
            {
                "id": 2,
                "name": "Winter 2024",
                "number": 1,
                "period": "winter",
                "start_date": "2024-09-01",
                "end_date": "2024-12-31",
            }
        ],
    )
    workloads: list[ProfessorWorkloadMiniOut] = Field(
        ...,
        description="List of workloads allocated under this contract.",
        examples=[[{"id": 11, "assigned_hours": 120}]],
    )


class ProfessorContractFilterParams(BaseFilterParams):
    """Filtering parameters for listing professor contracts."""

    academic_year_ids: list[int] = Field(
        default=[],
        description="Filter by one or more academic year IDs.",
        examples=[[1, 2]],
    )
    periods: list[SemesterPeriodEnum] = Field(
        default=[],
        description="Filter by semester periods.",
        examples=[["winter", "summer"]],
    )
    semester_ids: list[int] = Field(
        default=[],
        description="Filter by one or more semester IDs.",
        examples=[[2, 3]],
    )


class ProfessorContractQueryParams(BaseQueryParams, ProfessorContractFilterParams):
    """Query parameters combining pagination/sorting with professor contract filters."""

    pass
