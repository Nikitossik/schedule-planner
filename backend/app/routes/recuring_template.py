from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session
from typing import Annotated

from ..dependencies import get_db, RoleChecker
from ..schemas.recurring_template import (
    RecurringLessonTemplateIn,
    RecurringLessonTemplateOut,
    RecurringLessonTemplateUpdate,
    RecurringLessonTemplateQueryParams,
)
from ..schemas.shared import PaginatedResponse
from ..services import RecurringLessonTemplateService
from ..utils.enums import UserRoleEnum

# Router: Professor workloads CRUD, listing, and local warnings
recurring_template_router = APIRouter(
    prefix="/api/recurring_template", tags=["Recurring Lesson Templates"]
)

admin_coordinator_only = RoleChecker([UserRoleEnum.admin, UserRoleEnum.coordinator])


@recurring_template_router.get(
    "/",
    response_model=PaginatedResponse[RecurringLessonTemplateOut],
    summary="List professor workloads",
    description=(
        "Return a paginated list of professor workloads. Supports pagination, sorting, and filters "
        "(faculty, direction, study forms, academic year, period, semester, q)."
    ),
)
async def get_recurring_templates(
    *,
    db: Session = Depends(get_db),
    query_params: Annotated[RecurringLessonTemplateQueryParams, Query()],
):
    """Retrieve professor workloads with pagination and filtering."""
    return RecurringLessonTemplateService(db).get_paginated(query_params)


@recurring_template_router.get(
    "/{recurring_template_id}",
    response_model=RecurringLessonTemplateOut,
    summary="Get professor workload by ID",
    description="Retrieve a single professor workload by its unique identifier.",
)
async def get_recurring_template_by_id(
    *, recurring_template_id: int, db: Session = Depends(get_db)
):
    """Get a professor workload by its ID."""
    return RecurringLessonTemplateService(db).get_by_id(recurring_template_id)


@recurring_template_router.post(
    "/",
    response_model=RecurringLessonTemplateOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Create a professor workload",
    description=(
        "Create a new professor workload (unique per contract and study form). "
        "Validates hour limits against the professor contract. Only Admin/Coordinator roles are allowed."
    ),
)
async def create_recurring_template(
    recurring_template: RecurringLessonTemplateIn, db: Session = Depends(get_db)
):
    """Create a new professor workload."""
    return RecurringLessonTemplateService(db).create(recurring_template)


@recurring_template_router.patch(
    "/{recurring_template_id}",
    response_model=RecurringLessonTemplateOut,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Partially update a professor workload",
    description=(
        "Apply a partial update to an existing professor workload by ID. "
        "Validates hour limits against the professor contract. Only Admin/Coordinator roles are allowed."
    ),
)
async def patch_recurring_template(
    recurring_template_id: int,
    recurring_template: RecurringLessonTemplateUpdate,
    db: Session = Depends(get_db),
):
    """Partially update a professor workload by its ID."""
    return RecurringLessonTemplateService(db).update(
        recurring_template_id, recurring_template
    )


@recurring_template_router.put(
    "/{recurring_template_id}",
    response_model=RecurringLessonTemplateOut,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Replace a professor workload",
    description=(
        "Replace all fields of an existing professor workload by ID. "
        "Validates hour limits against the professor contract. Only Admin/Coordinator roles are allowed."
    ),
)
async def update_recurring_template(
    recurring_template_id: int,
    recurring_template: RecurringLessonTemplateIn,
    db: Session = Depends(get_db),
):
    """Replace a professor workload by its ID."""
    return RecurringLessonTemplateService(db).update(
        recurring_template_id, recurring_template
    )


@recurring_template_router.delete(
    "/{recurring_template_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Delete a professor workload",
    description="Delete a professor workload by ID. Only Admin/Coordinator roles are allowed. Returns 204 No Content on success.",
)
async def delete_recurring_template(
    recurring_template_id: int, db: Session = Depends(get_db)
):
    """Delete a professor workload by its ID."""
    return RecurringLessonTemplateService(db).delete(recurring_template_id)
