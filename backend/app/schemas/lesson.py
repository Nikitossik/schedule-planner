from pydantic import BaseModel, ConfigDict, Field
from datetime import date as pdate, time
from typing import Optional, List
from .shared import BaseQueryParams, BaseFilterParams
from .minis import (
    GroupMiniOut,
    SubjectMiniOut,
    RoomMiniOut,
    ProfessorMiniOut,
    ScheduleMiniOut,
    ProfessorWorkloadMiniOut,
)

from ..utils.enums import LessonTypeEnum


class LessonBase(BaseModel):
    """
    Base schema for Lesson data used in create/update operations.
    Captures ownership, participants, timing, delivery, and type metadata.
    """

    model_config = ConfigDict(from_attributes=True)

    schedule_id: int = Field(
        description="Identifier of the schedule this lesson belongs to.",
        examples=[5],
    )
    group_id: int = Field(
        description="Identifier of the attending group.",
        examples=[10],
    )
    subject_assignment_id: int = Field(
        description="Identifier of the subject assignment (subject + professor/workload).",
        examples=[42],
    )
    room_id: int | None = Field(
        default=None,
        description="Identifier of the room if on-site; null for online or TBA.",
        examples=[101],
    )
    is_online: bool = Field(
        default=False,
        description="Whether the lesson is conducted online.",
        examples=[False],
    )

    date: pdate = Field(
        description="Calendar date of the lesson (YYYY-MM-DD).",
        examples=["2024-10-15"],
    )
    start_time: time = Field(
        description="Start time (HH:MM:SS).",
        examples=["10:00:00"],
    )
    end_time: time = Field(
        description="End time (HH:MM:SS).",
        examples=["11:30:00"],
    )
    lesson_type: LessonTypeEnum = Field(
        description="Lesson type (e.g., LECTURE, SEMINAR, LAB).",
        examples=["LECTURE"],
    )


class LessonIn(LessonBase):
    """Input schema for creating a Lesson."""

    pass


class LessonUpdate(BaseModel):
    """
    Partial update schema for Lesson; all fields are optional.
    """

    model_config = ConfigDict(from_attributes=True)

    schedule_id: Optional[int] = Field(
        default=None,
        description="Optional new schedule identifier.",
        examples=[6],
    )
    group_id: Optional[int] = Field(
        default=None,
        description="Optional new group identifier.",
        examples=[11],
    )
    subject_assignment_id: Optional[int] = Field(
        default=None,
        description="Optional new subject assignment identifier.",
        examples=[43],
    )
    room_id: Optional[int] = Field(
        default=None,
        description="Optional new room identifier; null for online or TBA.",
        examples=[102],
    )
    is_online: bool | None = Field(
        default=None,
        description="Optional flag to mark the lesson as online.",
        examples=[True],
    )

    date: pdate | None = Field(
        default=None,
        description="Optional new date (YYYY-MM-DD).",
        examples=["2024-10-22"],
    )
    start_time: time | None = Field(
        default=None,
        description="Optional new start time (HH:MM:SS).",
        examples=["09:00:00"],
    )
    end_time: time | None = Field(
        default=None,
        description="Optional new end time (HH:MM:SS).",
        examples=["10:30:00"],
    )
    lesson_type: str | None = Field(
        None,
        max_length=50,
        description="Optional new lesson type.",
        examples=["SEMINAR"],
    )


class LessonOut(BaseModel):
    """
    Output schema for Lesson including related mini resources for UI display.
    """

    model_config = ConfigDict(from_attributes=True)

    id: int = Field(
        ...,
        description="Unique identifier of the lesson.",
        examples=[123],
    )
    subject_assignment_id: int = Field(
        ...,
        description="Identifier of the subject assignment (subject + professor/workload).",
        examples=[42],
    )
    date: pdate = Field(
        ...,
        description="Calendar date of the lesson (YYYY-MM-DD).",
        examples=["2024-10-15"],
    )
    start_time: time = Field(
        ...,
        description="Start time (HH:MM:SS).",
        examples=["10:00:00"],
    )
    end_time: time = Field(
        ...,
        description="End time (HH:MM:SS).",
        examples=["11:30:00"],
    )
    lesson_type: str = Field(
        ...,
        description="Lesson type (e.g., LECTURE, SEMINAR, LAB).",
        examples=["LECTURE"],
    )
    is_online: bool = Field(
        ...,
        description="Whether the lesson is conducted online.",
        examples=[False],
    )

    # Related objects for presentation
    subject: Optional[SubjectMiniOut] = Field(
        default=None,
        description="Subject mini representation associated with this lesson.",
        examples=[{"id": 7, "name": "Algebra"}],
    )
    group: Optional[GroupMiniOut] = Field(
        default=None,
        description="Group mini representation attending this lesson.",
        examples=[{"id": 10, "name": "CS-101"}],
    )
    room: Optional[RoomMiniOut] = Field(
        default=None,
        description="Room mini representation where the lesson is held.",
        examples=[{"id": 101, "number": "B-201"}],
    )
    professor: Optional[ProfessorMiniOut] = Field(
        default=None,
        description="Professor mini representation teaching this lesson.",
        examples=[{"id": 55, "name": "Ada", "surname": "Lovelace"}],
    )
    workload: Optional[ProfessorWorkloadMiniOut] = Field(
        default=None,
        description="Professor workload mini representation for this lesson.",
        examples=[{"id": 9, "assigned_hours": 120}],
    )
    schedule: Optional[ScheduleMiniOut] = Field(
        default=None,
        description="Schedule mini representation owning this lesson.",
        examples=[{"id": 5, "name": "CS Fall 2024"}],
    )


class LessonFilterParams(BaseFilterParams):
    """
    Filtering parameters for listing lessons.
    Combine different filters to narrow down results.
    """

    schedule_id: Optional[int] = Field(
        default=None,
        description="Filter by schedule identifier.",
        examples=[5],
    )
    group_id: Optional[int] = Field(
        default=None,
        description="Filter by group identifier.",
        examples=[10],
    )
    professor_id: Optional[int] = Field(
        default=None,
        description="Filter by professor (user) identifier.",
        examples=[55],
    )
    room_id: Optional[int] = Field(
        default=None,
        description="Filter by room identifier.",
        examples=[101],
    )
    direction_id: Optional[int] = Field(
        default=None,
        description="Filter by direction identifier.",
        examples=[3],
    )
    study_form_id: Optional[int] = Field(
        default=None,
        description="Filter by study form identifier.",
        examples=[2],
    )
    date_from: Optional[pdate] = Field(
        default=None,
        description="Inclusive start date (YYYY-MM-DD) for filtering.",
        examples=["2024-10-01"],
    )
    date_to: Optional[pdate] = Field(
        default=None,
        description="Inclusive end date (YYYY-MM-DD) for filtering.",
        examples=["2024-10-31"],
    )
    lesson_type: Optional[str] = Field(
        default=None,
        description="Filter by lesson type (e.g., LECTURE, LAB).",
        examples=["LECTURE"],
    )
    is_online: Optional[bool] = Field(
        default=None,
        description="Filter by lesson delivery mode (online/offline).",
        examples=[False],
    )


class LessonQueryParams(LessonFilterParams):
    """Query parameters combining pagination/sorting with lesson filters."""

    pass


class CalendarLessonsResponse(BaseModel):
    """
    Response schema for calendar view containing lessons within a date range.
    """

    model_config = ConfigDict(from_attributes=True)

    items: List[LessonOut] = Field(
        ...,
        description="List of lessons in the requested period.",
        examples=[[{"id": 1, "lesson_type": "LECTURE"}]],
    )
    count: int = Field(
        ...,
        description="Total number of lessons returned.",
        examples=[25],
    )
    date_from: Optional[pdate] = Field(
        default=None,
        description="Inclusive start date of the requested period (YYYY-MM-DD).",
        examples=["2024-10-01"],
    )
    date_to: Optional[pdate] = Field(
        default=None,
        description="Inclusive end date of the requested period (YYYY-MM-DD).",
        examples=["2024-10-31"],
    )
