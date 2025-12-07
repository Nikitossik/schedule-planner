from pydantic import BaseModel, ConfigDict, Field
from .shared import BaseQueryParams, BaseFilterParams
from datetime import date, time
from typing import Optional


class RoomBase(BaseModel):
    """
    Base schema for Room data shared by input/output models.
    Captures the room identifier and seating capacity.
    """

    model_config = ConfigDict(from_attributes=True)
    number: str = Field(
        max_length=4,
        description="Unique room number/code.",
        examples=["A101"],
    )
    capacity: int | None = Field(
        gt=0,
        description="Seating capacity of the room.",
        examples=[30],
    )


class RoomIn(RoomBase):
    """Input schema for creating a Room."""

    pass


class RoomUpdate(BaseModel):
    """Partial update schema for Room; all fields are optional."""

    number: str | None = Field(
        None,
        max_length=4,
        description="Optional new room number/code.",
        examples=["B102"],
    )
    capacity: int | None = Field(
        None,
        gt=0,
        description="Optional new seating capacity.",
        examples=[40],
    )


class RoomOut(RoomBase):
    """Output schema for Room including the identifier."""

    id: int = Field(
        ...,
        description="Unique identifier of the room.",
        examples=[101],
    )
    capacity: int | None = Field(
        None,
        gt=0,
        description="Optional new seating capacity.",
        examples=[40],
    )


class RoomFilters(BaseFilterParams):
    """Filtering parameters for listing rooms and checking availability."""

    # Search by room number/code
    q: Optional[str] = Field(
        default=None,
        description="Free-text search by room number/code.",
        examples=["A10"],
    )

    # Availability filters
    available_date: Optional[date] = Field(
        default=None,
        description="Check availability for a specific date (YYYY-MM-DD).",
        examples=["2024-10-15"],
    )
    available_start_time: Optional[time] = Field(
        default=None,
        description="Desired start time for availability (HH:MM:SS).",
        examples=["10:00:00"],
    )
    available_end_time: Optional[time] = Field(
        default=None,
        description="Desired end time for availability (HH:MM:SS).",
        examples=["11:30:00"],
    )
    exclude_lesson_id: Optional[int] = Field(
        default=None,
        description="Exclude a specific lesson when checking availability (useful during edits).",
        examples=[123],
    )


class RoomQueryParams(BaseQueryParams, RoomFilters):
    """Query parameters combining pagination/sorting with room filters."""

    pass
