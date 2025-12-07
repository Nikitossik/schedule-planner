from __future__ import annotations
from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import Integer, ForeignKey
from sqlalchemy.ext.hybrid import hybrid_property

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from .professor_profile import ProfessorProfile
    from .semester import Semester
    from .professor_workload import ProfessorWorkload


class ProfessorContract(Base):
    """
    Represents a professor’s teaching contract within a specific semester.
    Captures the total contractual hours and aggregates assigned workloads.
    Provides convenient access to the professor entity and the academic year.

    Fields overview:
    - id: numeric primary key.
    - professor_profile_id: FK to ProfessorProfile that owns this contract.
    - semester_id: FK to Semester the contract applies to.
    - total_hours: total contracted hours for the semester.
    - relationships: professor_profile, semester, workloads (cascading).
    - properties: academic_year, total_workload_hours, remaining_hours, professor.
    """

    __tablename__ = "professor_contract"

    id: Mapped[int] = mapped_column(primary_key=True)  # Unique identifier (primary key)
    professor_profile_id: Mapped[int] = mapped_column(
        ForeignKey("professor_profile.user_id")
    )  # FK referencing the owning professor profile
    semester_id: Mapped[int] = mapped_column(
        ForeignKey("semester.id")
    )  # FK to the target semester
    total_hours: Mapped[int] = mapped_column(
        Integer
    )  # Total contracted hours for the semester

    # relations
    professor_profile: Mapped["ProfessorProfile"] = relationship(
        "ProfessorProfile", back_populates="contracts", lazy="selectin"
    )  # Many-to-one: contract belongs to one professor profile
    semester: Mapped["Semester"] = relationship(
        "Semester", back_populates="contracts", lazy="selectin"
    )  # Many-to-one: contract is defined for one semester
    workloads: Mapped[list["ProfessorWorkload"]] = relationship(
        "ProfessorWorkload",
        back_populates="contract",
        lazy="selectin",
        cascade="all, delete-orphan",
    )  # One-to-many: workload items under this contract; cascade on delete

    @property
    def academic_year(self):
        # Convenience: academic year derived from the associated semester.
        return self.semester.academic_year

    @hybrid_property
    def total_workload_hours(self) -> int:
        """Calculate total workload hours for this contract."""
        return sum(workload.assigned_hours for workload in self.workloads)

    @hybrid_property
    def remaining_hours(self) -> int:
        """Calculate remaining hours for this contract."""
        return self.total_hours - self.total_workload_hours

    @property
    def professor(self):
        # Convenience: returns the User associated with this professor profile.
        return self.professor_profile.user
