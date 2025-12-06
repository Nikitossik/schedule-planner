from pydantic import BaseModel, Field, ConfigDict
from typing import List, Literal, Optional
from datetime import date, time


class LessonPreview(BaseModel):
    """Compact lesson preview for conflict analysis"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    date: date
    start_time: time
    end_time: time

    # Computed fields from relationships
    professor_full_name: Optional[str] = Field(
        None, description="Full professor name with title"
    )
    group_name: Optional[str] = Field(
        None, description="Group name for this specific conflict"
    )
    room_number: Optional[str] = Field(None, description="Room number or 'Online'")
    schedule_name: str = Field(
        ..., description="Schedule name where this lesson belongs"
    )
    subject_name: Optional[str] = Field(None, description="Subject name")

    # Keep original lesson data for compatibility
    is_online: bool = Field(default=False)
    academic_hours: float = Field(default=0.0)


class ScheduleIssue(BaseModel):
    """Base class for all schedule issues"""

    model_config = ConfigDict(from_attributes=True)

    type: str = Field(..., description="Type of issue")
    lessons: List[LessonPreview] = Field(default=[], description="Related lessons")


class TimeConflictIssue(ScheduleIssue):
    """Time-based scheduling conflict (room/professor/group overlap)"""

    type: Literal[
        "room_double_booking", "professor_time_conflict", "group_schedule_conflict"
    ]
    resource_id: int = Field(..., description="ID of conflicting resource")
    resource_name: str = Field(..., description="Name of conflicting resource")
    conflict_time: str = Field(..., description="Time when conflict occurs")
    conflict_date: str = Field(..., description="Date when conflict occurs")
    schedules_involved: List[int] = Field(..., description="Schedule IDs involved")


class WorkloadIssue(ScheduleIssue):
    """Hour allocation violation (professor overload or subject excess)"""

    type: Literal["professor_overload", "subject_hours_exceeded"]
    resource_id: int = Field(..., description="Professor or Subject ID")
    resource_name: str = Field(..., description="Professor or Subject name")
    allocated_hours: float = Field(..., description="Originally allocated hours")
    scheduled_hours: float = Field(..., description="Currently scheduled hours")
    excess_hours: float = Field(..., description="Hours over allocation")
    percentage_over: float = Field(..., description="Percentage over allocation")


class ConflictTypeScope(BaseModel):
    """Conflicts of one type divided by scope"""

    model_config = ConfigDict(from_attributes=True)

    single_schedule: List[TimeConflictIssue] = Field(
        default=[], description="Conflicts within current schedule only"
    )
    cross_schedule: List[TimeConflictIssue] = Field(
        default=[], description="Conflicts involving multiple schedules"
    )

    total_single: int = Field(default=0)
    total_cross: int = Field(default=0)
    total: int = Field(default=0)


class TimeConflictsSummary(BaseModel):
    """Summary of all time-based conflicts divided by type and scope"""

    model_config = ConfigDict(from_attributes=True)

    room_conflicts: ConflictTypeScope = Field(default_factory=ConflictTypeScope)
    professor_conflicts: ConflictTypeScope = Field(default_factory=ConflictTypeScope)
    group_conflicts: ConflictTypeScope = Field(default_factory=ConflictTypeScope)

    # Totals by type
    total_room_conflicts: int = Field(default=0)
    total_professor_conflicts: int = Field(default=0)
    total_group_conflicts: int = Field(default=0)

    # Totals by scope
    total_single_schedule: int = Field(
        default=0, description="All conflicts within current schedule"
    )
    total_cross_schedule: int = Field(
        default=0, description="All conflicts involving multiple schedules"
    )

    # Grand total
    total_conflicts: int = Field(default=0)


class WorkloadIssuesSummary(BaseModel):
    """Summary of workload-related issues"""

    model_config = ConfigDict(from_attributes=True)

    professor_overloads: List[WorkloadIssue] = Field(default=[])
    subject_overallocations: List[WorkloadIssue] = Field(default=[])

    total_professor_overloads: int = Field(default=0)
    total_subject_overallocations: int = Field(default=0)
    total_workload_issues: int = Field(default=0)


class ScheduleAnalysisOut(BaseModel):
    """Complete schedule analysis response"""

    model_config = ConfigDict(from_attributes=True)

    # Main analysis sections
    time_conflicts: TimeConflictsSummary = Field(default_factory=TimeConflictsSummary)
    workload_issues: WorkloadIssuesSummary = Field(
        default_factory=WorkloadIssuesSummary
    )

    # Overall summary
    total_issues: int = Field(
        default=0, description="Total conflicts + workload issues"
    )
