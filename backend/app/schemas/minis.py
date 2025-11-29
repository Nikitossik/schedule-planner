"""Mini (compact) schemas intended for embedding as nested objects inside larger API responses."""

from pydantic import BaseModel, ConfigDict, Field, field_serializer
from datetime import date
from ..utils.enums import SemesterPeriodEnum
from datetime import time
from typing import Optional, List
import json


class FacultyMiniOut(BaseModel):
    """Mini output model for Faculty used in nested responses."""

    model_config = ConfigDict(from_attributes=True)
    id: int = Field(..., description="Unique identifier of the faculty.", examples=[5])
    name: str = Field(
        ..., description="Faculty name.", examples=["Faculty of Engineering"]
    )


class SubjectMiniOut(BaseModel):
    """Mini output model for Subject used in nested responses."""

    model_config = ConfigDict(from_attributes=True)
    id: int = Field(..., description="Unique identifier of the subject.", examples=[7])
    name: str = Field(..., description="Subject display name.", examples=["Algebra"])
    code: str = Field(..., description="Unique subject code.", examples=["CS101"])
    color: str = Field(
        ...,
        description='Hex color for UI tagging (e.g., "#RRGGBB").',
        examples=["#FF0000"],
    )
    allocated_hours: int = Field(
        ..., description="Allocated hours for the subject.", examples=[40]
    )


class GroupMiniOut(BaseModel):
    """Mini output model for Group used in nested responses."""

    model_config = ConfigDict(from_attributes=True)
    id: int = Field(..., description="Unique identifier of the group.", examples=[10])
    name: str = Field(..., description="Group name/identifier.", examples=["CS-101"])


class ProfessorMiniOut(BaseModel):
    """Mini output model for Professor (User) used in nested responses."""

    model_config = ConfigDict(from_attributes=True)
    id: int = Field(
        ..., description="Unique identifier of the professor (user).", examples=[55]
    )
    email: str = Field(
        ..., description="Professor email address.", examples=["ada@example.com"]
    )
    name: str = Field(..., description="Professor first name.", examples=["Ada"])
    surname: str = Field(..., description="Professor last name.", examples=["Lovelace"])


class SemesterMiniOut(BaseModel):
    """Mini output model for Semester used in nested responses."""

    model_config = ConfigDict(from_attributes=True)
    id: int = Field(..., description="Unique identifier of the semester.", examples=[1])
    name: str = Field(..., description="Semester display name.", examples=["Fall 2024"])
    number: int = Field(..., description="Sequential semester number.", examples=[1])
    period: SemesterPeriodEnum = Field(
        ..., description="Semester period enum value.", examples=["AUTUMN"]
    )
    start_date: date = Field(
        ..., description="Semester start date (inclusive).", examples=["2024-09-01"]
    )
    end_date: date = Field(
        ..., description="Semester end date (inclusive).", examples=["2024-12-31"]
    )


class AcademicYearMiniOut(BaseModel):
    """Mini output model for AcademicYear used in nested responses."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(
        ..., description="Unique identifier of the academic year.", examples=[1]
    )
    name: str = Field(
        ...,
        description='Academic year label in format "YYYY-YYYY".',
        examples=["2024-2025"],
    )
    start_date: date = Field(
        ..., description="Year start date (inclusive).", examples=["2024-09-01"]
    )
    end_date: date = Field(
        ..., description="Year end date (inclusive).", examples=["2025-06-30"]
    )
    is_current: bool = Field(
        ..., description="Whether this academic year is active.", examples=[True]
    )


class StudyFormMiniOut(BaseModel):
    """Mini output model for StudyForm used in nested responses."""

    model_config = ConfigDict(from_attributes=True)
    id: int = Field(
        ..., description="Unique identifier of the study form.", examples=[2]
    )
    form: str = Field(
        ...,
        description="Study form (e.g., FULL_TIME, PART_TIME).",
        examples=["FULL_TIME"],
    )


class DirectionMiniOut(BaseModel):
    """Mini output model for Direction used in nested responses."""

    model_config = ConfigDict(from_attributes=True)
    id: int = Field(
        ..., description="Unique identifier of the direction.", examples=[3]
    )
    name: str = Field(
        ..., description="Direction/program name.", examples=["Computer Science"]
    )
    code: str = Field(..., description="Direction/program code.", examples=["CS-01"])


class ProfessorContractMiniOut(BaseModel):
    """Mini output model for ProfessorContract used in nested responses."""

    model_config = ConfigDict(from_attributes=True)
    id: int = Field(..., description="Unique identifier of the contract.", examples=[9])
    total_hours: int = Field(
        ..., description="Total contracted hours for the semester.", examples=[300]
    )
    total_workload_hours: int = Field(
        ..., description="Sum of assigned workload hours.", examples=[180]
    )


class ProfessorWorkloadMiniOut(BaseModel):
    """Mini output model for ProfessorWorkload used in nested responses."""

    model_config = ConfigDict(from_attributes=True)
    id: int = Field(
        ..., description="Unique identifier of the workload.", examples=[11]
    )
    assigned_hours: int = Field(
        ..., description="Total hours allocated in the workload.", examples=[120]
    )


class ScheduleMiniOut(BaseModel):
    """Mini output model for Schedule used in nested responses."""

    model_config = ConfigDict(from_attributes=True)
    id: int = Field(..., description="Unique identifier of the schedule.", examples=[5])
    name: str = Field(
        ..., description="Schedule display name.", examples=["CS Fall 2024"]
    )


class SubjectAssignmentMiniOut(BaseModel):
    """Mini output model for SubjectAssignment used in nested responses."""

    model_config = ConfigDict(from_attributes=True)
    id: int = Field(
        ..., description="Unique identifier of the subject assignment.", examples=[42]
    )
    subject: "SubjectMiniOut" = Field(
        ...,
        description="Nested subject mini representation.",
        examples=[{"id": 7, "name": "Algebra", "code": "MATH101", "color": "#0000FF"}],
    )
    hours_per_subject: int = Field(
        ...,
        description="Allocated hours for the subject within the workload.",
        examples=[36],
    )


class RoomMiniOut(BaseModel):
    """Mini output model for Room used in nested responses."""

    model_config = ConfigDict(from_attributes=True)
    id: int = Field(..., description="Unique identifier of the room.", examples=[101])
    number: str = Field(..., description="Room number/code.", examples=["B-201"])
    capacity: int = Field(
        ..., description="Seating capacity of the room.", examples=[30]
    )


class RecurringLessonTemplateMiniOut(BaseModel):
    """Minimal output schema for RecurringLessonTemplate used in relationships."""

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(description="Template identifier.")
    name: Optional[str] = Field(description="Template name.")
    days_of_week: List[int] = Field(description="Days of week.")
    start_time: time = Field(description="Start time.")
    end_time: time = Field(description="End time.")

    @field_serializer("days_of_week")
    def serialize_days_of_week(self, value):
        """Convert JSON string to list of integers for API response"""
        if isinstance(value, str):
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return []
        return value if isinstance(value, list) else []
