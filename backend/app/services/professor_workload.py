from fastapi import HTTPException, status

from sqlalchemy.orm import Session, selectinload
from sqlalchemy import or_
from datetime import datetime, timedelta

from ..models.direction import Direction
from ..models.study_form import StudyForm
from ..repositories import ProfessorWorkloadRepository
from ..models import (
    ProfessorWorkload,
    ProfessorContract,
    ProfessorProfile,
    User,
    Semester,
    SubjectAssignment,
    Lesson,
    Subject,
)
from ..schemas.professor_workload import (
    ProfessorWorkloadIn,
    ProfessorWorkloadUpdate,
    LocalWorkloadWarningOut,
    WorkloadSummaryOut,
    SubjectHoursWarningOut,
    CombinedWarningsSummaryOut,
)
from ..schemas.lesson import LessonOut
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

    def get_local_workload_warnings(self, schedule_id: int) -> WorkloadSummaryOut:
        """
        Analyze a single schedule for subject assignments that exceeded allocated hours.

        Strategy:
        - Load subject assignments that have lessons in the given schedule (with eager loading).
        - For each assignment, compute scheduled hours from lessons of this schedule only.
        - Produce LocalWorkloadWarningOut entries when scheduled > allowed (hours_per_subject).

        Args:
            schedule_id (int): Target schedule ID to analyze.

        Returns:
            WorkloadSummaryOut: List of local warnings and total count scoped to the schedule.
        """
        # Получаем все subject_assignments для данного расписания с уроками
        assignments = (
            self.db.query(SubjectAssignment)
            .options(
                selectinload(SubjectAssignment.subject),
                selectinload(SubjectAssignment.workload)
                .selectinload(ProfessorWorkload.contract)
                .selectinload(ProfessorContract.professor_profile)
                .selectinload(ProfessorProfile.user),
                selectinload(SubjectAssignment.lessons),
            )
            .join(Lesson)
            .filter(Lesson.schedule_id == schedule_id)
            .distinct()
            .all()
        )

        warnings = []

        for assignment in assignments:
            # Фильтруем уроки только для данного расписания
            schedule_lessons = [
                lesson
                for lesson in assignment.lessons
                if lesson.schedule_id == schedule_id
            ]

            if not schedule_lessons:
                continue

            # Считаем часы
            scheduled_hours = self._calculate_lesson_hours(schedule_lessons)

            # Проверяем превышение
            if scheduled_hours > assignment.hours_per_subject:
                warnings.append(
                    self._create_local_warning(
                        assignment, schedule_lessons, scheduled_hours
                    )
                )

        return WorkloadSummaryOut(
            warnings=warnings, total_warnings=len(warnings), schedule_id=schedule_id
        )

    def _calculate_lesson_hours(self, lessons) -> float:
        """
        Calculate total scheduled hours from a list of lessons.

        Each lesson contributes the duration between start_time and end_time.
        If end time is past midnight relative to start time, adjust by adding a day.

        Args:
            lessons (Iterable[Lesson]): Lessons to include in the calculation.

        Returns:
            float: Total hours computed as the sum of durations.
        """
        total_minutes = 0

        for lesson in lessons:
            # Парсим время начала и конца
            start_time = lesson.start_time
            end_time = lesson.end_time

            # Конвертируем в datetime для расчета
            start_dt = datetime.combine(datetime.today(), start_time)
            end_dt = datetime.combine(datetime.today(), end_time)

            # Если урок переходит через полночь
            if end_dt < start_dt:
                end_dt += timedelta(days=1)

            duration = end_dt - start_dt
            lesson_minutes = duration.total_seconds() / 60
            total_minutes += lesson_minutes

        total_hours = total_minutes / 60
        return total_hours

    def _create_local_warning(
        self, assignment, lessons, scheduled_hours: float
    ) -> LocalWorkloadWarningOut:
        """
        Build a LocalWorkloadWarningOut instance for an assignment with excess hours.

        Args:
            assignment (SubjectAssignment): Assignment with allowed hours limit.
            lessons (list[Lesson]): Lessons from the target schedule contributing to overage.
            scheduled_hours (float): Computed scheduled hours for these lessons.

        Returns:
            LocalWorkloadWarningOut: Warning payload suitable for API response.
        """
        professor = assignment.workload.contract.professor_profile.user

        return LocalWorkloadWarningOut(
            type="assignment_exceeded",
            subject_assignment_id=assignment.id,
            subject_name=assignment.subject.name,
            professor_id=professor.id,
            professor_name=f"{professor.name} {professor.surname}".strip(),
            scheduled_hours=scheduled_hours,
            allowed_hours=assignment.hours_per_subject,
            excess_hours=scheduled_hours - assignment.hours_per_subject,
            lessons=[LessonOut.model_validate(lesson) for lesson in lessons],
        )

    def get_combined_warnings(self, schedule_id: int) -> CombinedWarningsSummaryOut:
        """
        Get both professor workload and subject hours warnings for a schedule.

        Args:
            schedule_id (int): Target schedule ID to analyze.

        Returns:
            CombinedWarningsSummaryOut: Combined warnings for professors and subjects.
        """
        # Get professor workload warnings
        professor_summary = self.get_local_workload_warnings(schedule_id)

        # Get subject hours warnings
        subject_warnings = self._get_subject_hours_warnings(schedule_id)

        return CombinedWarningsSummaryOut(
            professor_warnings=professor_summary.warnings,
            subject_warnings=subject_warnings,
            total_professor_warnings=professor_summary.total_warnings,
            total_subject_warnings=len(subject_warnings),
            schedule_id=schedule_id,
        )

    def _get_subject_hours_warnings(
        self, schedule_id: int
    ) -> list[SubjectHoursWarningOut]:
        """
        Analyze subjects in a schedule for hours exceeding allocated_hours.

        Strategy:
        - Load all subjects that have lessons in the given schedule.
        - For each subject, compute total scheduled hours across all its assignments/lessons.
        - Produce SubjectHoursWarningOut entries when scheduled > allocated_hours.

        Args:
            schedule_id (int): Target schedule ID to analyze.

        Returns:
            list[SubjectHoursWarningOut]: List of subject warnings.
        """
        # Get all subjects with lessons in this schedule
        subjects = (
            self.db.query(Subject)
            .join(SubjectAssignment)
            .join(Lesson)
            .filter(Lesson.schedule_id == schedule_id)
            .options(
                selectinload(Subject.subject_assignments).selectinload(
                    SubjectAssignment.lessons
                )
            )
            .distinct()
            .all()
        )

        warnings = []

        for subject in subjects:
            # Collect all lessons for this subject in this schedule
            all_lessons = []
            for assignment in subject.subject_assignments:
                schedule_lessons = [
                    lesson
                    for lesson in assignment.lessons
                    if lesson.schedule_id == schedule_id
                ]
                all_lessons.extend(schedule_lessons)

            if not all_lessons:
                continue

            # Calculate total scheduled hours
            scheduled_hours = self._calculate_lesson_hours(all_lessons)

            # Check if exceeds allocated hours
            if (
                subject.allocated_hours > 0
                and scheduled_hours > subject.allocated_hours
            ):
                warnings.append(
                    SubjectHoursWarningOut(
                        type="subject_exceeded",
                        subject_id=subject.id,
                        subject_name=subject.name,
                        subject_code=subject.code,
                        scheduled_hours=scheduled_hours,
                        allocated_hours=float(subject.allocated_hours),
                        excess_hours=scheduled_hours - subject.allocated_hours,
                        lessons=[
                            LessonOut.model_validate(lesson) for lesson in all_lessons
                        ],
                    )
                )

        return warnings
