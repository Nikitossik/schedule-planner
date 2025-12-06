from typing import Annotated
from fastapi import Depends, status, APIRouter, Query
from sqlalchemy.orm import Session
from ..dependencies import get_db, RoleChecker
from ..schemas.lesson import (
    LessonIn,
    LessonOut,
    LessonUpdate,
    LessonQueryParams,
    CalendarLessonsResponse,
)
from ..services import LessonService
from ..utils.enums import UserRoleEnum

# Router: Lesson sessions CRUD, calendar listing, and conflict summary
lesson_router = APIRouter(prefix="/api/lesson", tags=["Lessons"])

admin_coordinator_only = RoleChecker([UserRoleEnum.admin, UserRoleEnum.coordinator])


@lesson_router.get(
    "/calendar",
    response_model=CalendarLessonsResponse,
    summary="List calendar lessons (no pagination)",
    description="Return lessons for calendar view filtered by date range and schedule, without pagination.",
)
async def get_calendar_lessons(
    *,
    db: Session = Depends(get_db),
    query_params: Annotated[LessonQueryParams, Query()],
):
    """Get lessons for the calendar with date filtering and no pagination."""
    return LessonService(db).get_calendar_lessons(query_params)


@lesson_router.get(
    "/{lesson_id}",
    response_model=LessonOut,
    summary="Get lesson by ID",
    description="Retrieve a single lesson by its unique identifier.",
)
async def get_lesson_by_id(*, lesson_id: int, db: Session = Depends(get_db)):
    return LessonService(db).get_by_id(lesson_id)


@lesson_router.post(
    "/",
    response_model=LessonOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Create lessons",
    description="Create new lessons. Only Admin/Coordinator roles are allowed.",
)
async def create_lessons(lesson: LessonIn, db: Session = Depends(get_db)):
    return LessonService(db).create(lesson)


@lesson_router.put(
    "/{lesson_id}",
    response_model=LessonOut,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Replace a lesson",
    description="Replace all fields of an existing lesson by ID. Only Admin/Coordinator roles are allowed.",
)
async def update_lesson(
    lesson_id: int, lesson: LessonIn, db: Session = Depends(get_db)
):
    return LessonService(db).update(lesson_id, lesson)


@lesson_router.patch(
    "/{lesson_id}",
    response_model=LessonOut,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Partially update a lesson",
    description="Apply a partial update to an existing lesson by ID. Only Admin/Coordinator roles are allowed.",
)
async def patch_lesson(
    lesson_id: int, lesson: LessonUpdate, db: Session = Depends(get_db)
):
    return LessonService(db).update(lesson_id, lesson)


@lesson_router.delete(
    "/{lesson_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(admin_coordinator_only)],
    summary="Delete a lesson",
    description="Delete a lesson by ID. Only Admin/Coordinator roles are allowed. Returns 204 No Content on success.",
)
async def delete_lesson(lesson_id: int, db: Session = Depends(get_db)):
    return LessonService(db).delete(lesson_id)
