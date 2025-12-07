from sqlalchemy.orm import Session
from sqlalchemy import or_
from fastapi import HTTPException

from ..repositories import ProfessorContractRepository
from ..models import ProfessorContract, ProfessorProfile, User, Semester
from ..schemas.professor_contract import ProfessorContractIn
from ..schemas.minis import ProfessorMiniOut
from .base import BaseService


class ProfessorContractService(BaseService[ProfessorContract, ProfessorContractIn]):
    """
    Service layer for ProfessorContract domain logic.

    Responsibilities:
    - List and filter professor contracts by professor identity and semester context.
    - Delegate CRUD operations to ProfessorContractRepository via BaseService.
    """

    def __init__(self, db: Session):
        """
        Initialize the ProfessorContract service.

        Args:
            db (Session): Active SQLAlchemy session.
        """
        super().__init__(db, ProfessorContract, ProfessorContractRepository(db))

    def apply_filters(self, query, params):
        """
        Apply filters to the professor contracts query.

        Supported filters:
        - q: free-text search by professor email, name, or surname (case-insensitive).
        - academic_year_ids: filter by academic year IDs (via semester).
        - periods: filter by semester periods (enum values).
        - semester_ids: filter by specific semester IDs.

        Args:
            query: SQLAlchemy query object for ProfessorContract.
            params: Combined query/filter params carrying fields above.

        Returns:
            The filtered SQLAlchemy query.
        """
        # Add JOINs to access related data for filtering
        query = (
            query.join(ProfessorContract.professor_profile)
            .join(ProfessorProfile.user)
            .join(ProfessorContract.semester)
        )

        if params.q:
            query_string = params.q.strip()
            query = query.filter(
                or_(
                    User.email.ilike(f"%{query_string}%"),
                    User.name.ilike(f"%{query_string}%"),
                    User.surname.ilike(f"%{query_string}%"),
                )
            )

        if params.academic_year_ids:
            query = query.filter(
                Semester.academic_year_id.in_(params.academic_year_ids)
            )
        if params.periods:
            query = query.filter(Semester.period.in_(params.periods))

        if params.semester_ids:
            query = query.filter(Semester.id.in_(params.semester_ids))
        return super().apply_filters(query, params)

    def find_by_professor_and_semester(
        self, professor_profile_id: int, semester_id: int
    ) -> ProfessorContract | None:
        """
        Find a contract by professor profile ID and semester ID.

        Args:
            professor_profile_id (int): The professor profile ID.
            semester_id (int): The semester ID.

        Returns:
            ProfessorContract | None: The contract if found, None otherwise.
        """
        return (
            self.db.query(ProfessorContract)
            .filter(
                ProfessorContract.professor_profile_id == professor_profile_id,
                ProfessorContract.semester_id == semester_id,
            )
            .first()
        )

    def create(self, entity_data: ProfessorContractIn) -> ProfessorContract:
        """
        Create a new professor contract with uniqueness validation.

        Args:
            entity_data (ProfessorContractIn): Contract data to create.

        Returns:
            ProfessorContract: The created contract.

        Raises:
            HTTPException: If a contract already exists for the professor and semester.
        """
        # Check if contract already exists
        existing_contract = self.find_by_professor_and_semester(
            entity_data.professor_profile_id, entity_data.semester_id
        )
        
        if existing_contract:
            raise HTTPException(
                status_code=400,
                detail="A contract for this professor and semester already exists"
            )
        
        # Create the contract if no duplicate found
        return super().create(entity_data)
