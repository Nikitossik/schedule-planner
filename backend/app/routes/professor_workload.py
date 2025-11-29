from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Annotated

from ..dependencies import get_db, RoleChecker
from ..schemas.professor_workload import (
    ProfessorWorkloadIn,
    ProfessorWorkloadOut,
    ProfessorWorkloadUpdate,
    ProfessorWorkloadQueryParams,
    WorkloadSummaryOut,
    CombinedWarningsSummaryOut,
)
from ..schemas.shared import PaginatedResponse
from ..services import ProfessorWorkloadService
from ..utils.enums import UserRoleEnum

# Router: Professor workloads CRUD, listing, and local warnings
professor_workload_router = APIRouter(
    prefix="/api/professor_workload", tags=["Professor Workloads"]
)

admin_coordinator_only = RoleChecker([UserRoleEnum.admin, UserRoleEnum.coordinator])


@professor_workload_router.get(
    "/",
    response_model=PaginatedResponse[ProfessorWorkloadOut],
    summary="List professor workloads",
    description=(
        "Return a paginated list of professor workloads. Supports pagination, sorting, and filters "
        "(faculty, direction, study forms, academic year, period, semester, q)."
    ),
)
async def get_professor_workloads(
    *,
    db: Session = Depends(get_db),
    query_params: Annotated[ProfessorWorkloadQueryParams, Query()],
):
    """Retrieve professor workloads with pagination and filtering."""
    return ProfessorWorkloadService(db).get_paginated(query_params)


@professor_workload_router.get(
    "/{professor_workload_id}",
    response_model=ProfessorWorkloadOut,
    summary="Get professor workload by ID",
    description="Retrieve a single professor workload by its unique identifier.",
)
async def get_professor_workload_by_id(
    *, professor_workload_id: int, db: Session = Depends(get_db)
):
    """Get a professor workload by its ID."""
    return ProfessorWorkloadService(db).get_by_id(professor_workload_id)


@professor_workload_router.post(
    "/",
    response_model=ProfessorWorkloadOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Create a professor workload",
    description=(
        "Create a new professor workload (unique per contract and study form). "
        "Validates hour limits against the professor contract. Only Admin/Coordinator roles are allowed."
    ),
)
async def create_professor_workload(
    professor_workload: ProfessorWorkloadIn, db: Session = Depends(get_db)
):
    """Create a new professor workload."""
    return ProfessorWorkloadService(db).create(professor_workload)


@professor_workload_router.patch(
    "/{professor_workload_id}",
    response_model=ProfessorWorkloadOut,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Partially update a professor workload",
    description=(
        "Apply a partial update to an existing professor workload by ID. "
        "Validates hour limits against the professor contract. Only Admin/Coordinator roles are allowed."
    ),
)
async def patch_professor_workload(
    professor_workload_id: int,
    professor_workload: ProfessorWorkloadUpdate,
    db: Session = Depends(get_db),
):
    """Partially update a professor workload by its ID."""
    return ProfessorWorkloadService(db).update(
        professor_workload_id, professor_workload
    )


@professor_workload_router.put(
    "/{professor_workload_id}",
    response_model=ProfessorWorkloadOut,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Replace a professor workload",
    description=(
        "Replace all fields of an existing professor workload by ID. "
        "Validates hour limits against the professor contract. Only Admin/Coordinator roles are allowed."
    ),
)
async def update_professor_workload(
    professor_workload_id: int,
    professor_workload: ProfessorWorkloadIn,
    db: Session = Depends(get_db),
):
    """Replace a professor workload by its ID."""
    return ProfessorWorkloadService(db).update(
        professor_workload_id, professor_workload
    )


@professor_workload_router.delete(
    "/{professor_workload_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Delete a professor workload",
    description="Delete a professor workload by ID. Only Admin/Coordinator roles are allowed. Returns 204 No Content on success.",
)
async def delete_professor_workload(
    professor_workload_id: int, db: Session = Depends(get_db)
):
    """Delete a professor workload by its ID."""
    return ProfessorWorkloadService(db).delete(professor_workload_id)


@professor_workload_router.get(
    "/warnings/local/{schedule_id}",
    response_model=WorkloadSummaryOut,
    summary="Get local workload warnings for a schedule",
    description=(
        "Analyze a single schedule for subject assignments that exceeded allocated hours. "
        "Returns a list of warnings and a total count."
    ),
)
async def get_local_workload_warnings(schedule_id: int, db: Session = Depends(get_db)):
    """Get local warnings about exceeding allocated hours within a specific schedule."""
    return ProfessorWorkloadService(db).get_local_workload_warnings(schedule_id)


@professor_workload_router.get(
    "/warnings/combined/{schedule_id}",
    response_model=CombinedWarningsSummaryOut,
    summary="Get combined professor and subject warnings for a schedule",
    description=(
        "Analyze a single schedule for both professor workload and subject hours violations. "
        "Returns separate lists for professor assignment warnings and subject allocation warnings."
    ),
)
async def get_combined_warnings(schedule_id: int, db: Session = Depends(get_db)):
    """Get combined warnings for both professors and subjects in a specific schedule."""
    return ProfessorWorkloadService(db).get_combined_warnings(schedule_id)
