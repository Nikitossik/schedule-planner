from __future__ import annotations
from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .lesson import Lesson


class Room(Base):
    """
    Represents a physical classroom/room resource.
    Used to allocate lessons to a location and check capacity/conflicts.

    Fields overview:
    - id: numeric primary key.
    - number: unique room identifier (e.g., "B-201"), indexed for fast lookup.
    - capacity: optional seating capacity; null if unknown.
    """

    __tablename__ = "room"

    id: Mapped[int] = mapped_column(primary_key=True)  # Unique identifier (primary key)
    number: Mapped[str] = mapped_column(
        String(100), unique=True, index=True
    )  # Unique room number/code with DB-level uniqueness and index
    capacity: Mapped[int] = mapped_column(
        Integer, nullable=True
    )  # Seating capacity; nullable when not specified
