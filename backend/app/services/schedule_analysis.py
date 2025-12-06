from typing import List, Optional, Dict
from sqlalchemy.orm import Session, selectinload
from datetime import date
from collections import defaultdict

from ..models import (
    Lesson,
    Group,
    SubjectAssignment,
    ProfessorWorkload,
    ProfessorContract,
    ProfessorProfile,
    Subject,
    Schedule,
)
from ..schemas.schedule_analysis import (
    ScheduleAnalysisOut,
    TimeConflictsSummary,
    WorkloadIssuesSummary,
    TimeConflictIssue,
    WorkloadIssue,
    ConflictTypeScope,
    LessonPreview,
)


class ScheduleAnalysisService:
    """
    Centralized service for schedule analysis: conflicts detection and workload warnings.

    Responsibilities:
    - Detect all types of scheduling conflicts (room, professor, group)
    - Analyze workload violations (professor overload, subject hour mismatches)
    - Provide unified analysis interface with consistent data loading
    """

    def __init__(self, db: Session):
        self.db = db

    def analyze_complete_schedule(
        self, schedule_id: int
    ) -> Optional[ScheduleAnalysisOut]:
        """Get complete analysis for a specific schedule - conflicts + workload warnings."""

        # Check if schedule exists
        schedule_exists = (
            self.db.query(Schedule).filter(Schedule.id == schedule_id).first()
        )
        if not schedule_exists:
            return None

        # Get all conflicts (both single and cross schedule scope)
        time_conflicts = self._analyze_time_conflicts(schedule_id)

        # Get all workload warnings
        workload_issues = self._analyze_workload_issues(schedule_id)

        # Calculate total issues
        total_issues = (
            time_conflicts.total_conflicts + workload_issues.total_workload_issues
        )

        return ScheduleAnalysisOut(
            time_conflicts=time_conflicts,
            workload_issues=workload_issues,
            total_issues=total_issues,
        )

    def _analyze_time_conflicts(self, schedule_id: int) -> TimeConflictsSummary:
        """Analyze all time-based conflicts for a schedule."""

        # Load all lessons with necessary relationships for conflict analysis
        all_lessons = self._load_lessons_for_conflicts()

        # Find all conflicts across all lessons
        all_conflicts = self._find_all_conflicts(all_lessons)

        # Group conflicts by type and scope, filter by schedule_id
        return self._group_conflicts_by_type_and_scope(all_conflicts, schedule_id)

    def _analyze_workload_issues(self, schedule_id: int) -> WorkloadIssuesSummary:
        """Analyze workload violations for a schedule."""

        # Get professor overload issues
        professor_overloads = self._find_professor_overloads(schedule_id)

        # Get subject overallocation issues
        subject_overallocations = self._find_subject_overallocations(schedule_id)

        return WorkloadIssuesSummary(
            professor_overloads=professor_overloads,
            subject_overallocations=subject_overallocations,
            total_professor_overloads=len(professor_overloads),
            total_subject_overallocations=len(subject_overallocations),
            total_workload_issues=len(professor_overloads)
            + len(subject_overallocations),
        )

    def _load_lessons_for_conflicts(self) -> List[Lesson]:
        """Load all lessons with optimized eager loading for conflict analysis."""
        return (
            self.db.query(Lesson)
            .options(
                selectinload(Lesson.groups).selectinload(Group.semester),
                selectinload(Lesson.room),
                selectinload(Lesson.schedule),
                selectinload(Lesson.subject_assignment).selectinload(
                    SubjectAssignment.subject
                ),
                selectinload(Lesson.subject_assignment)
                .selectinload(SubjectAssignment.workload)
                .selectinload(ProfessorWorkload.contract)
                .selectinload(ProfessorContract.professor_profile)
                .selectinload(ProfessorProfile.user),
            )
            .order_by(Lesson.date, Lesson.start_time)
            .all()
        )

    def _find_all_conflicts(self, lessons: List[Lesson]) -> List[Dict]:
        """Find all types of conflicts across provided lessons."""
        conflicts = []

        # Group lessons by date for optimization
        lessons_by_date: Dict[date, List[Lesson]] = defaultdict(list)
        for lesson in lessons:
            lessons_by_date[lesson.date].append(lesson)

        # Find conflicts by day
        for date_lessons in lessons_by_date.values():
            conflicts.extend(self._find_room_conflicts_in_day(date_lessons))
            conflicts.extend(self._find_professor_conflicts_in_day(date_lessons))
            conflicts.extend(self._find_group_conflicts_in_day(date_lessons))

        return conflicts

    def _find_room_conflicts_in_day(self, lessons: List[Lesson]) -> List[Dict]:
        """Detect room conflicts for a single day."""
        conflicts = []
        room_lessons: Dict[int, List[Lesson]] = defaultdict(list)

        # Group lessons by room (exclude online lessons)
        for lesson in lessons:
            if lesson.room_id and not lesson.is_online:
                room_lessons[lesson.room_id].append(lesson)

        for room_id, room_lesson_list in room_lessons.items():
            overlapping_groups = self._find_time_overlaps(room_lesson_list)

            for overlap_group in overlapping_groups:
                if len(overlap_group) > 1:
                    schedules = {lesson.schedule_id for lesson in overlap_group}
                    professors = {
                        self._get_professor_id(lesson)
                        for lesson in overlap_group
                        if self._get_professor_id(lesson)
                    }

                    # Cross-schedule conflicts are always conflicts
                    if len(schedules) > 1:
                        room_name = (
                            overlap_group[0].room.number
                            if overlap_group[0].room
                            else f"Room {room_id}"
                        )
                        conflicts.append(
                            {
                                "type": "room",
                                "lessons": overlap_group,
                            }
                        )
                    else:
                        # Same schedule: if different professors in same room = conflict
                        if len(professors) > 1:
                            room_name = (
                                overlap_group[0].room.number
                                if overlap_group[0].room
                                else f"Room {room_id}"
                            )
                            conflicts.append(
                                {
                                    "type": "room",
                                    "lessons": overlap_group,
                                }
                            )

        return conflicts

    def _find_professor_conflicts_in_day(self, lessons: List[Lesson]) -> List[Dict]:
        """Detect professor conflicts for a single day."""
        conflicts = []
        professor_lessons: Dict[int, List[Lesson]] = defaultdict(list)

        # Group lessons by professor
        for lesson in lessons:
            professor_id = self._get_professor_id(lesson)
            if professor_id:
                professor_lessons[professor_id].append(lesson)

        for professor_id, prof_lesson_list in professor_lessons.items():
            overlapping_groups = self._find_time_overlaps(prof_lesson_list)

            for overlap_group in overlapping_groups:
                if len(overlap_group) > 1:
                    schedules = {lesson.schedule_id for lesson in overlap_group}

                    # Check room distribution
                    rooms = set()
                    online_lessons = 0

                    for lesson in overlap_group:
                        if lesson.is_online:
                            online_lessons += 1
                        elif lesson.room_id:
                            rooms.add(lesson.room_id)

                    # Cross-schedule conflicts are always conflicts
                    if len(schedules) > 1:
                        first_lesson = overlap_group[0]
                        professor = self._get_professor_object(first_lesson)

                        if professor and professor.user:
                            conflicts.append(
                                {
                                    "type": "professor",
                                    "lessons": overlap_group,
                                }
                            )
                    else:
                        # Same schedule: if professor in multiple rooms simultaneously = conflict
                        if len(rooms) > 1 or (len(rooms) >= 1 and online_lessons > 0):
                            first_lesson = overlap_group[0]
                            professor = self._get_professor_object(first_lesson)

                            if professor and professor.user:
                                conflicts.append(
                                    {
                                        "type": "professor",
                                        "lessons": overlap_group,
                                    }
                                )

        return conflicts

    def _find_group_conflicts_in_day(self, lessons: List[Lesson]) -> List[Dict]:
        """Detect group conflicts for a single day."""
        conflicts = []
        group_lessons: Dict[int, List[Lesson]] = defaultdict(list)

        # Group lessons by group (many-to-many relationship)
        for lesson in lessons:
            for group in lesson.groups:
                group_lessons[group.id].append(lesson)

        for group_id, group_lesson_list in group_lessons.items():
            overlapping_groups = self._find_time_overlaps(group_lesson_list)

            for overlap_group in overlapping_groups:
                if len(overlap_group) > 1:
                    schedules = {lesson.schedule_id for lesson in overlap_group}

                    # Find the group name for this specific conflict
                    conflicting_group_name = f"Group {group_id}"
                    for lesson in overlap_group:
                        for group in lesson.groups:
                            if group.id == group_id:
                                conflicting_group_name = group.name
                                break
                        if conflicting_group_name != f"Group {group_id}":
                            break

                    conflicts.append(
                        {
                            "type": "group",
                            "lessons": overlap_group,
                            "group_id": group_id,
                            "group_name": conflicting_group_name,
                        }
                    )

        return conflicts

    def _find_time_overlaps(self, lessons: List[Lesson]) -> List[List[Lesson]]:
        """Find sets of lessons with overlapping times."""
        overlapping_groups = []
        processed = set()

        for i, lesson1 in enumerate(lessons):
            if lesson1.id in processed:
                continue

            overlap_group = [lesson1]
            processed.add(lesson1.id)

            for lesson2 in lessons[i + 1 :]:
                if lesson2.id in processed:
                    continue

                # Check time overlap on same date
                if (
                    lesson1.date == lesson2.date
                    and lesson1.start_time < lesson2.end_time
                    and lesson1.end_time > lesson2.start_time
                ):
                    overlap_group.append(lesson2)
                    processed.add(lesson2.id)

            if len(overlap_group) > 1:
                overlapping_groups.append(overlap_group)

        return overlapping_groups

    def _group_conflicts_by_type_and_scope(
        self, conflicts: List[Dict], schedule_id: int
    ) -> TimeConflictsSummary:
        """Group conflicts by type and scope, filtering by schedule_id."""

        # Separate conflicts by type and scope
        room_single, room_cross = [], []
        professor_single, professor_cross = [], []
        group_single, group_cross = [], []

        for conflict in conflicts:
            # Get schedule IDs for this conflict
            schedule_ids = {lesson.schedule_id for lesson in conflict["lessons"]}

            # Only include conflicts that involve our target schedule
            if schedule_id not in schedule_ids:
                continue

            # Convert to TimeConflictIssue
            conflict_issue = self._conflict_to_time_issue(conflict)

            # Determine scope
            is_cross_schedule = len(schedule_ids) > 1

            # Group by type and scope
            if conflict["type"] == "room":
                if is_cross_schedule:
                    room_cross.append(conflict_issue)
                else:
                    room_single.append(conflict_issue)
            elif conflict["type"] == "professor":
                if is_cross_schedule:
                    professor_cross.append(conflict_issue)
                else:
                    professor_single.append(conflict_issue)
            elif conflict["type"] == "group":
                if is_cross_schedule:
                    group_cross.append(conflict_issue)
                else:
                    group_single.append(conflict_issue)

        return TimeConflictsSummary(
            room_conflicts=ConflictTypeScope(
                single_schedule=room_single,
                cross_schedule=room_cross,
                total_single=len(room_single),
                total_cross=len(room_cross),
                total=len(room_single) + len(room_cross),
            ),
            professor_conflicts=ConflictTypeScope(
                single_schedule=professor_single,
                cross_schedule=professor_cross,
                total_single=len(professor_single),
                total_cross=len(professor_cross),
                total=len(professor_single) + len(professor_cross),
            ),
            group_conflicts=ConflictTypeScope(
                single_schedule=group_single,
                cross_schedule=group_cross,
                total_single=len(group_single),
                total_cross=len(group_cross),
                total=len(group_single) + len(group_cross),
            ),
            total_room_conflicts=len(room_single) + len(room_cross),
            total_professor_conflicts=len(professor_single) + len(professor_cross),
            total_group_conflicts=len(group_single) + len(group_cross),
            total_single_schedule=len(room_single)
            + len(professor_single)
            + len(group_single),
            total_cross_schedule=len(room_cross)
            + len(professor_cross)
            + len(group_cross),
            total_conflicts=len(room_single)
            + len(room_cross)
            + len(professor_single)
            + len(professor_cross)
            + len(group_single)
            + len(group_cross),
        )

    def _find_professor_overloads(self, schedule_id: int) -> List[WorkloadIssue]:
        """Find professor workload overloads for a specific schedule."""

        # Get subject assignments with lessons in this schedule
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

        overloads = []

        for assignment in assignments:
            # Filter lessons for this schedule only
            schedule_lessons = [
                lesson
                for lesson in assignment.lessons
                if lesson.schedule_id == schedule_id
            ]

            if not schedule_lessons:
                continue

            # Calculate scheduled hours
            scheduled_hours = self._calculate_lesson_hours(schedule_lessons)

            # Check for excess
            if scheduled_hours > assignment.hours_per_subject:
                excess_hours = scheduled_hours - assignment.hours_per_subject
                percentage_over = (excess_hours / assignment.hours_per_subject) * 100

                professor = assignment.workload.contract.professor_profile.user
                professor_name = f"{professor.name} {professor.surname}".strip()

                overloads.append(
                    WorkloadIssue(
                        type="professor_overload",
                        resource_id=professor.id,
                        resource_name=professor_name,
                        allocated_hours=float(assignment.hours_per_subject),
                        scheduled_hours=scheduled_hours,
                        excess_hours=excess_hours,
                        percentage_over=percentage_over,
                        lessons=[
                            self._create_lesson_preview(lesson)
                            for lesson in schedule_lessons
                        ],
                    )
                )

        return overloads

    def _find_subject_overallocations(self, schedule_id: int) -> List[WorkloadIssue]:
        """Find subject hour overallocations for a specific schedule."""

        # Get subjects with lessons in this schedule
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

        overallocations = []

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
                excess_hours = scheduled_hours - subject.allocated_hours
                percentage_over = (excess_hours / subject.allocated_hours) * 100

                overallocations.append(
                    WorkloadIssue(
                        type="subject_hours_exceeded",
                        resource_id=subject.id,
                        resource_name=subject.name,
                        allocated_hours=float(subject.allocated_hours),
                        scheduled_hours=scheduled_hours,
                        excess_hours=excess_hours,
                        percentage_over=percentage_over,
                        lessons=[
                            self._create_lesson_preview(lesson)
                            for lesson in all_lessons
                        ],
                    )
                )

        return overallocations

    def _calculate_lesson_hours(self, lessons: List[Lesson]) -> float:
        """Calculate total academic hours from lessons."""
        return sum(lesson.academic_hours for lesson in lessons)

    def _get_professor_id(self, lesson: Lesson) -> Optional[int]:
        """Extract professor ID from lesson."""
        try:
            if (
                lesson.subject_assignment
                and lesson.subject_assignment.workload
                and lesson.subject_assignment.workload.contract
                and lesson.subject_assignment.workload.contract.professor_profile
            ):
                return lesson.subject_assignment.workload.contract.professor_profile.user_id
        except (AttributeError, TypeError):
            pass
        return None

    def _get_professor_object(self, lesson: Lesson):
        """Extract ProfessorProfile object from lesson."""
        try:
            if (
                lesson.subject_assignment
                and lesson.subject_assignment.workload
                and lesson.subject_assignment.workload.contract
                and lesson.subject_assignment.workload.contract.professor_profile
            ):
                return lesson.subject_assignment.workload.contract.professor_profile
        except (AttributeError, TypeError):
            pass
        return None

    def _create_lesson_preview(
        self, lesson: Lesson, group_name: Optional[str] = None
    ) -> LessonPreview:
        """Create LessonPreview from Lesson with specific group name if provided"""
        return LessonPreview(
            id=lesson.id,
            date=lesson.date,
            start_time=lesson.start_time,
            end_time=lesson.end_time,
            professor_full_name=lesson.professor_full_name,
            group_name=group_name or (lesson.groups[0].name if lesson.groups else None),
            room_number=lesson.room_display,
            schedule_name=lesson.schedule_name or "Unknown Schedule",
            subject_name=lesson.subject_name,
            is_online=lesson.is_online,
            academic_hours=lesson.academic_hours,
        )

    def _conflict_to_time_issue(self, conflict_data: Dict) -> TimeConflictIssue:
        """Convert conflict dict to TimeConflictIssue schema."""
        lessons = conflict_data["lessons"]
        first_lesson = lessons[0]
        schedules_involved = list({lesson.schedule_id for lesson in lessons})

        # Map conflict types
        type_mapping = {
            "room": "room_double_booking",
            "professor": "professor_time_conflict",
            "group": "group_schedule_conflict",
        }

        # Get resource info based on conflict type
        if conflict_data["type"] == "room":
            resource_id = first_lesson.room_id or 0
            resource_name = (
                first_lesson.room.number if first_lesson.room else f"Room {resource_id}"
            )
            # Create lesson previews without specific group name
            lesson_previews = [
                self._create_lesson_preview(lesson) for lesson in lessons
            ]

        elif conflict_data["type"] == "professor":
            resource_id = self._get_professor_id(first_lesson) or 0
            professor = self._get_professor_object(first_lesson)
            resource_name = (
                f"{professor.user.name} {professor.user.surname}"
                if professor and professor.user
                else "Unknown Professor"
            )
            # Create lesson previews without specific group name
            lesson_previews = [
                self._create_lesson_preview(lesson) for lesson in lessons
            ]

        else:  # group
            resource_id = conflict_data.get("group_id", 0)
            resource_name = conflict_data.get("group_name", f"Group {resource_id}")

            # For group conflicts, use the specific conflicting group name
            lesson_previews = [
                self._create_lesson_preview(lesson, group_name=resource_name)
                for lesson in lessons
            ]

        return TimeConflictIssue(
            type=type_mapping[conflict_data["type"]],
            resource_id=resource_id,
            resource_name=resource_name,
            conflict_time=f"{first_lesson.start_time}-{first_lesson.end_time}",
            conflict_date=str(first_lesson.date),
            schedules_involved=schedules_involved,
            lessons=lesson_previews,
        )
