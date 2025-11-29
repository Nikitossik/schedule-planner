from pydantic import BaseModel, ConfigDict, Field, field_validator, field_serializer
from datetime import date as pdate, time, datetime
from typing import Optional, List
import json
from .shared import BaseQueryParams, BaseFilterParams
from .minis import (
    GroupMiniOut,
    SubjectAssignmentMiniOut,
    RoomMiniOut,
    ScheduleMiniOut,
)

from ..utils.enums import LessonTypeEnum


class RecurringLessonTemplateBase(BaseModel):
    """
    Base schema for RecurringLessonTemplate data used in create/update operations.
    Captures the recurring pattern, lesson parameters, and date range for generation.
    """

    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = Field(
        None,
        max_length=200,
        description="Optional human-readable name for the template. If not provided, will be auto-generated.",
        examples=["Advanced Mathematics - Group INF-1"],
    )

    schedule_id: int = Field(
        description="Identifier of the schedule this template belongs to.",
        examples=[5],
    )
    group_id: int = Field(
        description="Identifier of the group that will attend these lessons.",
        examples=[10],
    )
    subject_assignment_id: int = Field(
        description="Identifier of the subject assignment (subject + professor/workload).",
        examples=[42],
    )
    room_id: Optional[int] = Field(
        None,
        description="Identifier of the room if on-site; null for online lessons.",
        examples=[101],
    )

    lesson_type: LessonTypeEnum = Field(
        description="Type of lesson (lecture, practice, lab, seminar).",
        examples=["lecture"],
    )
    is_online: bool = Field(
        False,
        description="Whether the lessons are conducted online.",
        examples=[False],
    )

    days_of_week: str = Field(
        description="List of weekday numbers (0=Monday, 6=Sunday) when lessons occur.",
        examples=[[1, 3, 5]],
    )
    start_time: time = Field(
        description="Start time for each lesson occurrence (HH:MM:SS).",
        examples=["08:00:00"],
    )
    end_time: time = Field(
        description="End time for each lesson occurrence (HH:MM:SS).",
        examples=["09:30:00"],
    )

    start_date: pdate = Field(
        description="First date to start generating lessons from (YYYY-MM-DD).",
        examples=["2025-09-01"],
    )
    end_date: Optional[pdate] = Field(
        None,
        description="Last date to generate lessons until (YYYY-MM-DD). If null, generates until semester end.",
        examples=["2026-01-31"],
    )


class RecurringLessonTemplateIn(RecurringLessonTemplateBase):
    """Input schema for creating a RecurringLessonTemplate."""

    pass


class RecurringLessonTemplateUpdate(BaseModel):
    """Schema for updating a RecurringLessonTemplate (partial updates allowed)."""

    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = Field(
        None,
        max_length=200,
        description="Optional name for the template.",
    )
    room_id: Optional[int] = Field(
        None,
        description="Room identifier (can be set to null for online lessons).",
    )
    lesson_type: Optional[str] = Field(
        None,
        max_length=50,
        description="Type of lesson.",
    )
    is_online: Optional[bool] = Field(
        None,
        description="Whether lessons are conducted online.",
    )
    days_of_week: str | None = Field(
        None,
        description="List of weekday numbers.",
    )
    start_time: Optional[time] = Field(
        None,
        description="Start time for lessons.",
    )
    end_time: Optional[time] = Field(
        None,
        description="End time for lessons.",
    )
    start_date: Optional[pdate] = Field(
        None,
        description="First date to generate lessons from.",
    )
    end_date: Optional[pdate] = Field(
        None,
        description="Last date to generate lessons until.",
    )


class RecurringLessonTemplateOut(RecurringLessonTemplateBase):
    """Output schema for RecurringLessonTemplate with relationships and computed fields."""

    id: int = Field(
        description="Unique identifier for the recurring lesson template.",
        examples=[123],
    )

    # Relationships

    group: GroupMiniOut = Field(
        description="Group that attends these lessons.",
    )
    subject_assignment: SubjectAssignmentMiniOut = Field(
        description="Subject assignment (subject + professor + workload).",
    )
    room: Optional[RoomMiniOut] = Field(
        None,
        description="Room where lessons take place (null for online).",
    )


class RecurringLessonTemplateFilterParams(BaseModel):
    """Advanced filtering parameters for recurring lesson templates."""

    schedule_ids: Optional[List[int]] = Field(
        None,
        description="Filter by multiple schedule IDs.",
        examples=[[1, 2, 3]],
    )
    start_date_from: Optional[pdate] = Field(
        None,
        description="Filter templates starting from this date.",
        examples=["2025-09-01"],
    )
    start_date_to: Optional[pdate] = Field(
        None,
        description="Filter templates starting until this date.",
        examples=["2025-12-31"],
    )


class RecurringLessonTemplateQueryParams(
    BaseQueryParams, RecurringLessonTemplateFilterParams
):
    """Query parameters for filtering recurring lesson templates."""

    pass
