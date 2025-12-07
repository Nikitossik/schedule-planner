from __future__ import annotations

from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String
from sqlalchemy.ext.hybrid import hybrid_property

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .subject import Subject
    from .direction import Direction


class Faculty(Base):
    """
    Represents an academic faculty (e.g., a school or department).
    Acts as a container for multiple Directions (programs/tracks) and can be linked
    to subjects and groups (currently commented out).

    Fields overview:
    - id: numeric primary key.
    - name: unique faculty name.
    - directions: one-to-many relation to Direction; eager-loaded via select-in.
    - directions_count: hybrid property returning the number of associated directions.
    """

    __tablename__ = "faculty"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )  # Unique numeric identifier (primary key)
    name: Mapped[str] = mapped_column(String(100), unique=True)  # Unique faculty name

    # relations
    directions: Mapped[list["Direction"]] = relationship(
        "Direction", back_populates="faculty", lazy="selectin", cascade="all, delete-orphan"
    )  # One-to-many: directions/programs belonging to this faculty; select-in for efficient eager loading

    @hybrid_property
    def directions_count(self) -> int:
        # Returns the number of associated directions based on the loaded relationship.
        # Note: This counts in-memory items; for very large datasets consider a SQL COUNT query.
        return len(self.directions)
