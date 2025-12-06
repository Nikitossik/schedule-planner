from typing import Annotated
from fastapi import Depends, status, APIRouter, Query
from sqlalchemy.orm import Session

from ..dependencies import get_db, RoleChecker
from ..schemas.schedule import (
    ScheduleIn,
    ScheduleOut,
    ScheduleUpdate,
    ScheduleQueryParams,
    ScheduleExportParams,
)
from ..schemas.schedule_analysis import ScheduleAnalysisOut
from ..schemas.shared import PaginatedResponse
from ..services import ScheduleService
from ..services.schedule_analysis import ScheduleAnalysisService
from ..utils.enums import UserRoleEnum


# Router: Schedules (timetables) CRUD and export
schedule_router = APIRouter(prefix="/api/schedule", tags=["Schedules"])

admin_coordinator_only = RoleChecker([UserRoleEnum.admin, UserRoleEnum.coordinator])


@schedule_router.get(
    "/",
    response_model=PaginatedResponse[ScheduleOut],
    summary="List schedules",
    description="Return a paginated list of schedules. Supports pagination/sorting and reserved filters.",
)
async def get_schedule(
    *,
    db: Session = Depends(get_db),
    query_params: Annotated[ScheduleQueryParams, Query()],
):
    """Retrieve a paginated list of schedules."""
    return ScheduleService(db).get_paginated(query_params)


@schedule_router.get(
    "/{schedule_id}",
    response_model=ScheduleOut,
    summary="Get schedule by ID",
    description="Retrieve a single schedule by its unique identifier.",
)
async def get_schedule_by_id(*, schedule_id: int, db: Session = Depends(get_db)):
    """Retrieve a schedule by its ID."""
    return ScheduleService(db).get_by_id(schedule_id)


@schedule_router.post(
    "/",
    response_model=ScheduleOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Create a schedule",
    description="Create a new schedule for a specific semester and direction. Only Admin/Coordinator roles are allowed.",
)
async def create_schedule(schedule: ScheduleIn, db: Session = Depends(get_db)):
    """Create a new schedule."""
    return ScheduleService(db).create(schedule)


@schedule_router.put(
    "/{schedule_id}",
    response_model=ScheduleOut,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Replace a schedule",
    description="Replace all fields of an existing schedule by ID. Only Admin/Coordinator roles are allowed.",
)
async def update_schedule(
    schedule_id: int, schedule: ScheduleIn, db: Session = Depends(get_db)
):
    """Replace a schedule by its ID."""
    return ScheduleService(db).update(schedule_id, schedule)


@schedule_router.patch(
    "/{schedule_id}",
    response_model=ScheduleOut,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Partially update a schedule",
    description="Apply a partial update to an existing schedule by ID. Only Admin/Coordinator roles are allowed.",
)
async def patch_schedule(
    schedule_id: int, schedule: ScheduleUpdate, db: Session = Depends(get_db)
):
    """Partially update a schedule by its ID."""
    return ScheduleService(db).update(schedule_id, schedule)


@schedule_router.delete(
    "/{schedule_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Delete a schedule",
    description="Delete a schedule by ID. Only Admin/Coordinator roles are allowed. Returns 204 No Content on success.",
)
async def delete_schedule(schedule_id: int, db: Session = Depends(get_db)):
    """Delete a schedule by its ID."""
    return ScheduleService(db).delete(schedule_id)


@schedule_router.get(
    "/{schedule_id}/export",
    summary="Export schedule (Excel or PDF)",
    description="Export a schedule to Excel or PDF. Control format, optional group filtering, and filename via query parameters.",
)
def export_schedule(
    schedule_id: int,
    export_params: Annotated[ScheduleExportParams, Query()],
    db: Session = Depends(get_db),
):
    """Export a schedule to the requested format (Excel or PDF)."""
    return ScheduleService(db).export(
        schedule_id=schedule_id, export_params=export_params
    )


@schedule_router.get(
    "/{schedule_id}/analysis",
    response_model=ScheduleAnalysisOut,
    summary="Get complete schedule analysis",
    description="Get comprehensive schedule analysis including all conflicts and workload warnings for a specific schedule.",
)
def get_schedule_analysis(schedule_id: int, db=Depends(get_db)):
    """Get complete schedule analysis including conflicts and workload warnings"""
    service = ScheduleAnalysisService(db)
    return service.analyze_complete_schedule(schedule_id)
