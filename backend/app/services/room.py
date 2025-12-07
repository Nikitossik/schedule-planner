from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, not_
from datetime import date, time
from typing import Optional
from ..repositories import RoomRepository
from ..models import Room, Lesson
from ..schemas.room import RoomIn
from ..utils.exceptions import AlreadyExistsException
from .base import BaseService


class RoomService(BaseService[Room, RoomIn]):
    """
    Service layer for Room management.

    Responsibilities:
    - Provide listing with free-text search, capacity filter, and availability checks.
    - Delegate CRUD operations to RoomRepository via BaseService.
    """

    def __init__(self, db: Session):
        """
        Initialize the Room service.

        Args:
            db (Session): Active SQLAlchemy session.
        """
        super().__init__(db, Room, RoomRepository(db))

    def find_by_number(self, number: str) -> Optional[Room]:
        """
        Find a room by its number.

        Args:
            number (str): The room number to search for.

        Returns:
            Optional[Room]: The room if found, None otherwise.
        """
        return self.db.query(Room).filter(Room.number == number).first()

    def apply_filters(self, query, params):
        """
        Apply filters to the rooms query.

        Supported filters:
        - q: free-text search by room number/code (case-insensitive).
        - min_capacity: minimum seating capacity.
        - availability (available_date, available_start_time, available_end_time, exclude_lesson_id):
          return only rooms that are free in the specified time window.

        Args:
            query: SQLAlchemy query object for Room.
            params: Query/filter params carrying the fields above.

        Returns:
            The filtered SQLAlchemy query.
        """
        # Search by room number/code
        if params.q:
            query_string = params.q.strip()
            query = query.filter(Room.number.ilike(f"%{query_string}%"))

        # Availability filter for a specific date and time window
        if (
            params.available_date
            and params.available_start_time
            and params.available_end_time
        ):
            query = self._filter_available_rooms(
                query,
                params.available_date,
                params.available_start_time,
                params.available_end_time,
                params.exclude_lesson_id,
            )

        return super().apply_filters(query, params)

    def _filter_available_rooms(
        self,
        query,
        target_date: date,
        start_time: time,
        end_time: time,
        exclude_lesson_id: Optional[int] = None,
    ):
        """
        Filter rooms that are free for the given date and time window.

        Excludes rooms that have lessons overlapping the requested interval.
        Optionally excludes a specific lesson (useful during edits).

        Args:
            query: Base SQLAlchemy query for Room.
            target_date (date): Date to check.
            start_time (time): Desired start time (inclusive).
            end_time (time): Desired end time (inclusive).
            exclude_lesson_id (Optional[int]): Lesson ID to exclude from conflict checks.

        Returns:
            Query: A SQLAlchemy query filtered to only available rooms.
        """
        # Subquery that finds occupied rooms at the given time window
        occupied_rooms_subquery = self.db.query(Lesson.room_id).filter(
            and_(
                # Lesson on the requested date
                Lesson.date == target_date,
                # Exclude online lessons (they may have NULL room_id)
                Lesson.room_id.isnot(None),
                not_(Lesson.is_online),
                # Time interval overlap check:
                # Intervals [A_start, A_end) and [B_start, B_end) overlap if:
                # - A_start is within B, or
                # - A_end is within B, or
                # - A fully contains B, or
                # - B fully contains A
                or_(
                    # New lesson starts during an existing one
                    and_(Lesson.start_time <= start_time, Lesson.end_time > start_time),
                    # New lesson ends during an existing one
                    and_(Lesson.start_time < end_time, Lesson.end_time >= end_time),
                    # New lesson fully covers an existing one
                    and_(start_time <= Lesson.start_time, end_time >= Lesson.end_time),
                    # Existing lesson fully covers the new one
                    and_(Lesson.start_time <= start_time, Lesson.end_time >= end_time),
                ),
            )
        )

        # Exclude the current lesson when editing to avoid self-conflict
        if exclude_lesson_id:
            occupied_rooms_subquery = occupied_rooms_subquery.filter(
                Lesson.id != exclude_lesson_id
            )

        # Return only rooms that are NOT in the occupied subquery
        query = query.filter(not_(Room.id.in_(occupied_rooms_subquery)))

        return query

    def create(self, data: RoomIn) -> Room:
        """
        Create a new room with uniqueness validation.

        Args:
            data (RoomIn): Room data for creation.

        Returns:
            Room: The created room.

        Raises:
            AlreadyExistsException: If a room with the same number already exists.
        """
        existing_room = self.find_by_number(data.number)
        if existing_room:
            raise AlreadyExistsException("Room", "number", data.number)
        
        return super().create(data)

    def update(self, room_id: int, data: RoomIn) -> Room:
        """
        Update a room with uniqueness validation.

        Args:
            room_id (int): ID of the room to update.
            data (RoomIn): Updated room data.

        Returns:
            Room: The updated room.

        Raises:
            AlreadyExistsException: If a room with the same number already exists (excluding current room).
        """
        existing_room = self.find_by_number(data.number)
        if existing_room and existing_room.id != room_id:
            raise AlreadyExistsException("Room", "number", data.number)
        
        return super().update(room_id, data)
