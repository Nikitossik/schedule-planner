from fastapi import Depends, status, APIRouter, Query
from sqlalchemy.orm import Session

from ..dependencies import get_db, RoleChecker
from ..schemas.shared import PaginatedResponse
from ..schemas.university_holiday import (
    UniversityHolidayIn,
    UniversityHolidayUpdate,
    UniversityHolidayOut,
    UniversityHolidayQueryParams,
)
from ..services import UniversityHolidayService
from ..utils.enums import UserRoleEnum
from typing import Annotated

# Router: UniversityHolidays CRUD and listing
university_holiday_router = APIRouter(
    prefix="/api/university_holiday", tags=["UniversityHolidays"]
)

admin_coordinator_only = RoleChecker([UserRoleEnum.admin, UserRoleEnum.coordinator])


@university_holiday_router.get(
    "/",
    response_model=PaginatedResponse[UniversityHolidayOut],
    summary="List university_holidays",
    description="Return a paginated list of university_holidays. Supports pagination, sorting, and filters (academic year, period, semester, faculty, direction, q).",
)
async def get_university_holidays(
    *,
    db: Session = Depends(get_db),
    query_params: Annotated[UniversityHolidayQueryParams, Query()],
):
    return UniversityHolidayService(db).get_paginated(query_params)


@university_holiday_router.get(
    "/{university_holiday_id}",
    response_model=UniversityHolidayOut,
    summary="Get university_holiday by ID",
    description="Retrieve a single university_holiday by its unique identifier, including related mini resources.",
)
async def get_university_holiday_by_id(
    *, university_holiday_id: int, db: Session = Depends(get_db)
):
    return UniversityHolidayService(db).get_by_id(university_holiday_id)


@university_holiday_router.post(
    "/",
    response_model=UniversityHolidayOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Create a university_holiday",
    description="Create a new university_holiday under a specific direction and semester. Only Admin/Coordinator roles are allowed.",
)
async def create_university_holiday(
    university_holiday: UniversityHolidayIn, db: Session = Depends(get_db)
):
    return UniversityHolidayService(db).create(university_holiday)


@university_holiday_router.put(
    "/{university_holiday_id}",
    response_model=UniversityHolidayOut,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Replace a university_holiday",
    description="Replace all fields of an existing university_holiday by ID. Only Admin/Coordinator roles are allowed.",
)
async def update_university_holiday(
    university_holiday_id: int,
    university_holiday: UniversityHolidayIn,
    db: Session = Depends(get_db),
):
    return UniversityHolidayService(db).update(
        university_holiday_id, university_holiday
    )


@university_holiday_router.patch(
    "/{university_holiday_id}",
    response_model=UniversityHolidayOut,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Partially update a university_holiday",
    description="Apply a partial update to an existing university_holiday by ID. Only Admin/Coordinator roles are allowed.",
)
async def patch_university_holiday(
    university_holiday_id: int,
    university_holiday: UniversityHolidayUpdate,
    db: Session = Depends(get_db),
):
    return UniversityHolidayService(db).update(
        university_holiday_id, university_holiday
    )


@university_holiday_router.delete(
    "/{university_holiday_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Delete a university_holiday",
    description="Delete a university_holiday by ID. Only Admin/Coordinator roles are allowed. Returns 204 No Content on success.",
)
async def delete_university_holiday(
    university_holiday_id: int, db: Session = Depends(get_db)
):
    return UniversityHolidayService(db).delete(university_holiday_id)
