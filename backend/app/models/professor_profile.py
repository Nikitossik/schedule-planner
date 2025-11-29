from __future__ import annotations
from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Text

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .user import User
    from .professor_contract import ProfessorContract
    from .professor_workload import ProfessorWorkload
    from .subject_assignment import SubjectAssignment


class ProfessorProfile(Base):
    """
    Represents professor-specific data linked one-to-one with a User.
    Acts as the parent for semester contracts and (optionally) workloads and subject assignments.

    Fields overview:
    - user_id: primary key and FK to User; enforces a one-to-one mapping with User.
    - user: one-to-one relationship back to the User entity.
    - contracts: one-to-many collection of ProfessorContract items with cascading delete.
    - workloads/subject_assignments: optional relations (currently commented out).
    """

    __tablename__ = "professor_profile"

    user_id: Mapped[int] = mapped_column(
        ForeignKey("user.id"), primary_key=True
    )  # One-to-one PK/FK to the owning User

    # relations
    user: Mapped["User"] = relationship(
        "User", back_populates="professor_profile", lazy="selectin"
    )  # One-to-one: reverse link from User.professor_profile
    contracts: Mapped[list["ProfessorContract"]] = relationship(
        "ProfessorContract",
        back_populates="professor_profile",
        cascade="all, delete-orphan",
    )
    notes: Mapped[str] = mapped_column(Text, nullable=True)

    # One-to-many: contracts per semester; cascades on profile deletion
    # workloads: Mapped[list["ProfessorWorkload"]] = relationship(
    #     "ProfessorWorkload", back_populates="professor_profile"
    # )  # One-to-many: workload items (currently disabled)
    # subject_assignments: Mapped[list["SubjectAssignment"]] = relationship("SubjectAssignment", back_populates="professor_profile")  # One-to-many: subject assignments (currently disabled)
