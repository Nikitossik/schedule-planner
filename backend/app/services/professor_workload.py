from fastapi import HTTPException, status

from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..models.direction import Direction
from ..models.study_form import StudyForm
from ..repositories import ProfessorWorkloadRepository
from ..models import (
    ProfessorWorkload,
    ProfessorContract,
    ProfessorProfile,
    User,
    Semester,
)
from ..schemas.professor_workload import ProfessorWorkloadIn, ProfessorWorkloadUpdate
from .base import BaseService


class ProfessorWorkloadService(BaseService[ProfessorWorkload, ProfessorWorkloadIn]):
    """
    Service layer for ProfessorWorkload domain logic.

    Responsibilities:
    - Create/update professor workloads with validation of hour limits and uniqueness.
    - Provide filtered listings across related entities (faculty, direction, semester, etc.).
    - Analyze local workload excess per schedule and produce warning summaries.
    """

    def __init__(self, db: Session):
        """
        Initialize the ProfessorWorkload service.

        Args:
            db (Session): Active SQLAlchemy session.
        """
        super().__init__(db, ProfessorWorkload, ProfessorWorkloadRepository(db))

    def check_workload_hours(
        self,
        workload: ProfessorWorkloadIn | ProfessorWorkloadUpdate,
        workload_id: int | None = None,
    ) -> None:
        """
        Validate that assigned_hours does not exceed the contract's remaining capacity.

        When updating, remaining capacity is computed as:
        contract.total_hours - (contract.total_workload_hours - current_workload.assigned_hours)

        Args:
            workload (ProfessorWorkloadIn | ProfessorWorkloadUpdate): Incoming payload containing assigned_hours.
            workload_id (int | None): Existing workload ID (for updates) to adjust remaining calculation.

        Raises:
            HTTPException: 400 if assigned_hours would exceed the contract's total hours.
        """

        contract = None
        total_assigned_hours = None

        if workload_id:
            found_workload = self.repo.get(workload_id)
            contract = found_workload.contract
            total_assigned_hours = (
                contract.total_workload_hours - found_workload.assigned_hours
            )
        else:
            contract = (
                self.db.query(ProfessorContract)
                .filter(ProfessorContract.id == workload.contract_id)
                .first()
            )
            total_assigned_hours = contract.total_workload_hours

        if (
            contract
            and contract.total_hours < total_assigned_hours + workload.assigned_hours
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned hours exceed the total hours allowed by the contract.",
            )

    def create(self, workload: ProfessorWorkloadIn) -> ProfessorWorkload:
        """
        Create a new professor workload after validation.

        Validations:
        - Enforce uniqueness per (study_form_id, contract_id).
        - Ensure assigned_hours fits within the professor contract total capacity.

        Args:
            workload (ProfessorWorkloadIn): Input data for the new workload.

        Returns:
            ProfessorWorkload: Newly created workload instance.

        Raises:
            HTTPException: 400 if a duplicate workload exists or hours exceed contract capacity.
        """
        # Validate and process the input data before creating a new workload
        # This can include checks for existing workloads, semester conflicts, etc.

        found_workload = (
            self.db.query(ProfessorWorkload)
            .filter(
                ProfessorWorkload.study_form_id == workload.study_form_id,
                ProfessorWorkload.contract_id == workload.contract_id,
            )
            .first()
        )

        if found_workload:
            # If a workload already exists, raise an exception
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Workload for this professor, semester, study form, and contract already exists.",
            )

        # Validate assigned hours vs contract capacity
        self.check_workload_hours(workload)

        return super().create(workload)

    def update(
        self, workload_id: int, workload: ProfessorWorkloadIn | ProfessorWorkloadUpdate
    ) -> ProfessorWorkload:
        """
        Update an existing professor workload after validation.

        Args:
            workload_id (int): Identifier of the workload to update.
            workload (ProfessorWorkloadIn | ProfessorWorkloadUpdate): New values to apply.

        Returns:
            ProfessorWorkload: The updated workload instance.

        Raises:
            HTTPException: 400 if assigned hours would exceed contract capacity.
        """
        # Validate assigned hours vs contract capacity for update
        self.check_workload_hours(workload, workload_id)

        return super().update(workload_id, workload)

    def apply_filters(self, query, params):
        """
        Apply filters to workloads with necessary JOINs to related entities.

        Supported filters:
        - q: free-text search by professor email, name, or surname (case-insensitive).
        - faculty_ids, direction_ids, study_forms
        - academic_year_ids, periods, semester_ids

        Args:
            query: SQLAlchemy query for ProfessorWorkload.
            params: Combined query/filter params carrying the fields above.

        Returns:
            The filtered SQLAlchemy query.
        """
        # Add JOINs to access related fields for filtering and avoid N+1
        query = (
            query.join(ProfessorWorkload.contract)
            .join(ProfessorContract.professor_profile)
            .join(ProfessorProfile.user)
            .join(ProfessorContract.semester)
            .join(ProfessorWorkload.study_form)
            .join(StudyForm.direction)
            .join(Direction.faculty)
            .distinct()
        )

        # Apply free-text and structured filters
        if params.q:
            query_string = params.q.strip()
            query = query.filter(
                or_(
                    User.email.ilike(f"%{query_string}%"),
                    User.name.ilike(f"%{query_string}%"),
                    User.surname.ilike(f"%{query_string}%"),
                )
            )

        if params.faculty_ids:
            query = query.filter(Direction.faculty_id.in_(params.faculty_ids))
        if params.direction_ids:
            query = query.filter(Direction.id.in_(params.direction_ids))
        if params.study_forms:
            query = query.filter(StudyForm.form.in_(params.study_forms))
        if params.academic_year_ids:
            query = query.filter(
                Semester.academic_year_id.in_(params.academic_year_ids)
            )
        if params.periods:
            query = query.filter(Semester.period.in_(params.periods))
        if params.semester_ids:
            query = query.filter(Semester.id.in_(params.semester_ids))

        return super().apply_filters(query, params)
