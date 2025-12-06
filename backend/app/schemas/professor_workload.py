from typing import Optional, List, Literal

from pydantic import BaseModel, ConfigDict, Field

from ..utils.enums import SemesterPeriodEnum
from .shared import BaseFilterParams, BaseQueryParams
from .minis import (
    AcademicYearMiniOut,
    FacultyMiniOut,
    ProfessorMiniOut,
    SemesterMiniOut,
    StudyFormMiniOut,
    ProfessorContractMiniOut,
    DirectionMiniOut,
    SubjectAssignmentMiniOut,
)
from .lesson import LessonOut


class ProfessorWorkloadBase(BaseModel):
    """
    Base schema for ProfessorWorkload data shared by input/output models.
    Captures linkage to study form and contract, and the allocated hours.
    """

    model_config = ConfigDict(from_attributes=True)

    study_form_id: int = Field(
        gt=0,
        description="Identifier of the study form this workload applies to.",
        examples=[2],
    )
    contract_id: int = Field(
        gt=0,
        description="Identifier of the professor contract (semester-bound).",
        examples=[9],
    )
    assigned_hours: float = Field(
        gt=0,
        description="Total hours allocated for this workload within the contract.",
        examples=[120.0],
    )


class ProfessorWorkloadIn(ProfessorWorkloadBase):
    """Input schema for creating a ProfessorWorkload."""

    pass


class ProfessorWorkloadUpdate(BaseModel):
    """Partial update schema for ProfessorWorkload; all fields are optional."""

    study_form_id: int | None = Field(
        None,
        gt=0,
        description="Optional new study form identifier.",
        examples=[3],
    )
    contract_id: int | None = Field(
        None,
        gt=0,
        description="Optional new contract identifier.",
        examples=[10],
    )
    assigned_hours: float | None = Field(
        None,
        gt=0,
        description="Optional new total allocated hours.",
        examples=[140.0],
    )


class ProfessorWorkloadOut(ProfessorWorkloadBase):
    """
    Output schema for ProfessorWorkload including aggregates and related mini resources.
    """

    id: int = Field(
        ...,
        description="Unique identifier of the professor workload.",
        examples=[11],
    )
    total_assignment_hours: float = Field(
        ...,
        description="Sum of hours across all subject assignments.",
        examples=[96.0],
    )
    remaining_hours: float = Field(
        ...,
        description="Remaining hours (assigned_hours - total_assignment_hours).",
        examples=[24.0],
    )
    professor: Optional[ProfessorMiniOut] = Field(
        default=None,
        description="Mini representation of the professor (user) for this workload.",
        examples=[
            {"id": 55, "email": "ada@example.com", "name": "Ada", "surname": "Lovelace"}
        ],
    )
    faculty: Optional[FacultyMiniOut] = Field(
        default=None,
        description="Mini representation of the faculty derived from the direction.",
        examples=[{"id": 5, "name": "Engineering"}],
    )
    direction: Optional[DirectionMiniOut] = Field(
        default=None,
        description="Mini representation of the direction for this workload.",
        examples=[{"id": 3, "name": "Computer Science", "code": "CS-01"}],
    )
    academic_year: Optional[AcademicYearMiniOut] = Field(
        default=None,
        description="Mini representation of the academic year (via semester).",
        examples=[{"id": 1, "name": "2024-2025"}],
    )
    semester: Optional[SemesterMiniOut] = Field(
        default=None,
        description="Mini representation of the semester (via contract).",
        examples=[{"id": 2, "name": "Fall 2024"}],
    )
    study_form: Optional[StudyFormMiniOut] = Field(
        default=None,
        description="Mini representation of the study form for this workload.",
        examples=[{"id": 2, "form": "FULL_TIME"}],
    )
    contract: Optional[ProfessorContractMiniOut] = Field(
        default=None,
        description="Mini representation of the professor contract.",
        examples=[{"id": 9, "total_hours": 300, "total_workload_hours": 180}],
    )
    subject_assignments: Optional[list[SubjectAssignmentMiniOut]] = Field(
        default=None,
        description="List of subject assignments associated with this workload.",
        examples=[
            [
                {
                    "id": 42,
                    "hours_per_subject": 36,
                    "subject": {"id": 7, "name": "Algebra"},
                }
            ]
        ],
    )


class ProfessorWorkloadFilters(BaseFilterParams):
    """Filtering parameters for listing professor workloads."""

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
        examples=[["AUTUMN", "SPRING"]],
    )
    semester_ids: list[int] | None = Field(
        default=[],
        description="Filter by one or more semester IDs.",
        examples=[[2, 3]],
    )


class ProfessorWorkloadQueryParams(BaseQueryParams, ProfessorWorkloadFilters):
    """Query parameters combining pagination/sorting with workload filters."""

    pass
