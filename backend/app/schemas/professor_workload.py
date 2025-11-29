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
                    "subject": {
                        "id": 7,
                        "name": "Algebra",
                        "code": "MATH101",
                        "color": "#0000FF",
                    },
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


# Workload Warning Schemas
class LocalWorkloadWarningOut(BaseModel):
    """
    Local warning indicating that a subject assignment exceeded allocated hours.
    """

    model_config = ConfigDict(from_attributes=True)

    type: Literal["assignment_exceeded"] = Field(
        ...,
        description='Warning type code. Always "assignment_exceeded".',
        examples=["assignment_exceeded"],
    )
    subject_assignment_id: int = Field(
        ...,
        description="Identifier of the subject assignment causing the warning.",
        examples=[42],
    )
    subject_name: str = Field(
        ...,
        description="Human-readable subject name.",
        examples=["Linear Algebra"],
    )
    professor_id: int = Field(
        ...,
        description="Identifier of the professor (user).",
        examples=[55],
    )
    professor_name: str = Field(
        ...,
        description="Professor display name (e.g., concatenated).",
        examples=["Ada Lovelace"],
    )
    scheduled_hours: float = Field(
        ...,
        description="Total scheduled hours already planned.",
        examples=[40.0],
    )
    allowed_hours: float = Field(
        ...,
        description="Maximum allowed hours from the assignment/workload.",
        examples=[36.0],
    )
    excess_hours: float = Field(
        ...,
        description="Computed excess hours (scheduled_hours - allowed_hours).",
        examples=[4.0],
    )
    lessons: List[LessonOut] = Field(
        ...,
        description="List of lessons contributing to the excess.",
        examples=[[{"id": 1, "lesson_type": "LECTURE"}]],
    )


class WorkloadSummaryOut(BaseModel):
    """
    Summary of workload-related warnings for a given context (e.g., schedule).
    """

    model_config = ConfigDict(from_attributes=True)

    warnings: List[LocalWorkloadWarningOut] = Field(
        ...,
        description="List of local workload warnings.",
        examples=[
            [
                {
                    "type": "assignment_exceeded",
                    "subject_assignment_id": 42,
                    "subject_name": "Linear Algebra",
                    "professor_id": 55,
                    "professor_name": "Ada Lovelace",
                    "scheduled_hours": 40.0,
                    "allowed_hours": 36.0,
                    "excess_hours": 4.0,
                    "lessons": [],
                }
            ]
        ],
    )
    total_warnings: int = Field(
        ...,
        description="Total number of warnings in the list.",
        examples=[1],
    )
    schedule_id: Optional[int] = Field(
        default=None,
        description="Optional schedule identifier used for scoping the summary.",
        examples=[5],
    )


class SubjectHoursWarningOut(BaseModel):
    """
    Warning for a subject that has exceeded its allocated hours in a schedule.
    Represents excess across all assignments of the subject.
    """

    model_config = ConfigDict(from_attributes=True)

    type: Literal["subject_exceeded"] = Field(
        ...,
        description='Warning type code. Always "subject_exceeded".',
        examples=["subject_exceeded"],
    )
    subject_id: int = Field(
        ...,
        description="Identifier of the subject causing the warning.",
        examples=[12],
    )
    subject_name: str = Field(
        ...,
        description="Human-readable subject name.",
        examples=["Calculus II"],
    )
    subject_code: str = Field(
        ...,
        description="Subject code.",
        examples=["MATH202"],
    )
    scheduled_hours: float = Field(
        ...,
        description="Total scheduled hours for this subject across all assignments.",
        examples=[50.0],
    )
    allocated_hours: float = Field(
        ...,
        description="Maximum allocated hours for this subject.",
        examples=[45.0],
    )
    excess_hours: float = Field(
        ...,
        description="Computed excess hours (scheduled_hours - allocated_hours).",
        examples=[5.0],
    )
    lessons: List[LessonOut] = Field(
        ...,
        description="List of all lessons for this subject in the schedule.",
        examples=[[{"id": 1, "lesson_type": "LECTURE"}]],
    )


class CombinedWarningsSummaryOut(BaseModel):
    """
    Combined summary of both professor workload and subject hours warnings.
    """

    model_config = ConfigDict(from_attributes=True)

    professor_warnings: List[LocalWorkloadWarningOut] = Field(
        default=[],
        description="List of professor workload warnings.",
    )
    subject_warnings: List[SubjectHoursWarningOut] = Field(
        default=[],
        description="List of subject hours warnings.",
    )
    total_professor_warnings: int = Field(
        ...,
        description="Total number of professor warnings.",
        examples=[2],
    )
    total_subject_warnings: int = Field(
        ...,
        description="Total number of subject warnings.",
        examples=[1],
    )
    schedule_id: Optional[int] = Field(
        default=None,
        description="Optional schedule identifier used for scoping the summary.",
        examples=[5],
    )
