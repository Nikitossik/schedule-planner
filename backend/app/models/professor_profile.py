from __future__ import annotations
from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Text, String
from sqlalchemy.ext.hybrid import hybrid_property


from typing import TYPE_CHECKING

from ..utils.colors import get_contrast_text_color

if TYPE_CHECKING:
    from .user import User
    from .professor_contract import ProfessorContract


class ProfessorProfile(Base):
    """
    Represents professor-specific data linked one-to-one with a User.
    Acts as the parent for semester contracts and (optionally) workloads and subject assignments.

    Fields overview:
    - user_id: primary key and FK to User; enforces a one-to-one mapping with User.
    - niotes: optional text field for arbitrary professor notes.
    - unavailable_days: optional string (e.g., JSON array) listing professor's unavailable weekdays
    - academic_title: required string for the professor's academic title (e.g., "Dr.", "Prof.").
    - color: hex color code for UI display of the professor's lessons.
    - user: one-to-one relationship back to the User entity.
    - contracts: one-to-many collection of ProfessorContract items with cascading delete.
    """

    __tablename__ = "professor_profile"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.id"), primary_key=True
    )  # One-to-one PK/FK to the owning User
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    unavailable_days: Mapped[str] = mapped_column(String(20), nullable=True)
    academic_title: Mapped[str] = mapped_column(String(50), nullable=False)
    color: Mapped[str] = mapped_column(
        String(7), default="#000000"
    )  # Hex color code for UI labels
    # relations
    user: Mapped["User"] = relationship(
        "User", back_populates="professor_profile", lazy="selectin"
    )  # One-to-one: reverse link from User.professor_profile
    contracts: Mapped[list["ProfessorContract"]] = relationship(
        "ProfessorContract",
        back_populates="professor_profile",
        cascade="all, delete-orphan",
    )

    @hybrid_property
    def text_color(self):
        return get_contrast_text_color(self.color)
