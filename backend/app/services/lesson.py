from typing import List, Optional, Dict
from sqlalchemy.orm import Session, selectinload
from datetime import date

from app.repositories.lesson import LessonRepository
from app.models import (
    Lesson,
    Group,
    SubjectAssignment,
    ProfessorWorkload,
    ProfessorContract,
    ProfessorProfile,
)
from ..schemas.lesson import (
    LessonIn,
    LessonOut,
    LessonQueryParams,
    CalendarLessonsResponse,
)
from ..schemas.lesson_conflict import (
    ConflictOut,
    ConflictQueryParams,
    ConflictsSummaryOut,
    ConflictGroupOut,
)
from .base import BaseService


class LessonService(BaseService[Lesson, LessonIn]):
    """
    Service layer for lesson management.

    Responsibilities:
    - List/filter lessons (by schedule and date range).
    - Provide calendar-oriented listing without pagination with eager loading.
    - Detect and summarize scheduling conflicts (room, professor, group).
    - Offer utility helpers for conflict analysis and transformations.
    """

    def __init__(self, db: Session):
        """
        Initialize the Lesson service.

        Args:
            db (Session): Active SQLAlchemy session.
        """
        super().__init__(db, Lesson, LessonRepository(db))

    def create(self, data: LessonIn) -> Lesson:
        """Переопределенный метод создания - создаем урок и привязываем группы"""

        lesson_data = data.model_dump(exclude={"group_ids"})
        group_ids = data.group_ids

        # Создаем урок
        lesson = super().create(lesson_data)

        # Привязываем группы к уроку
        if group_ids:
            self._assign_groups_to_lesson(lesson, group_ids)

        return lesson

    def update(self, id: int, data) -> Lesson:
        """Переопределенный метод обновления - обновляем урок и группы"""

        # Исключаем group_ids из основных данных
        lesson_data = (
            data.model_dump(exclude_unset=True, exclude={"group_ids"})
            if hasattr(data, "model_dump")
            else {k: v for k, v in data.items() if k != "group_ids"}
        )

        # Обновляем урок
        lesson = super().update(id, lesson_data)

        # Обновляем группы если они переданы
        if hasattr(data, "group_ids") and data.group_ids is not None:
            self._assign_groups_to_lesson(lesson, data.group_ids)
        elif isinstance(data, dict) and "group_ids" in data:
            self._assign_groups_to_lesson(lesson, data["group_ids"])

        return lesson

    def _assign_groups_to_lesson(self, lesson: Lesson, group_ids: List[int]) -> None:
        """Привязываем группы к уроку"""
        from ..models.group import Group

        # Получаем группы по их ID
        groups = self.db.query(Group).filter(Group.id.in_(group_ids)).all()

        # Привязываем группы к уроку
        lesson.groups = groups

        # Сохраняем изменения
        self.db.commit()

    def apply_filters(self, query, params):
        """
        Apply common filters to the lessons query.

        Supported:
        - schedule_id: filter by owning schedule.
        - date_from/date_to: inclusive date window.

        Args:
            query: SQLAlchemy query object for Lesson.
            params (LessonQueryParams): Query/filter parameters.

        Returns:
            The filtered SQLAlchemy query.
        """
        if params.schedule_id:
            query = query.filter(Lesson.schedule_id == params.schedule_id)

        # Apply inclusive date range filters when provided
        if hasattr(params, "date_from") and params.date_from:
            query = query.filter(Lesson.date >= params.date_from)
        if hasattr(params, "date_to") and params.date_to:
            query = query.filter(Lesson.date <= params.date_to)

        return super().apply_filters(query, params)

    def get_calendar_lessons(
        self, params: LessonQueryParams
    ) -> CalendarLessonsResponse:
        """
        Get lessons for the calendar view without pagination, filtered by dates.

        Eager-loads related entities for efficient serialization in the calendar UI.

        Args:
            params (LessonQueryParams): Filtering parameters including schedule_id and optional date range.

        Returns:
            CalendarLessonsResponse: Items, count, and the requested date bounds.
        """
        query = (
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
            .filter(Lesson.schedule_id == params.schedule_id)
        )

        # Apply date filters if provided
        if params.date_from:
            query = query.filter(Lesson.date >= params.date_from)
        if params.date_to:
            query = query.filter(Lesson.date <= params.date_to)

        lessons = query.order_by(Lesson.date, Lesson.start_time).all()

        return CalendarLessonsResponse(
            items=[LessonOut.model_validate(lesson) for lesson in lessons],
            count=len(lessons),
            date_from=params.date_from,
            date_to=params.date_to,
        )

    def get_conflicts_summary(self, params: ConflictQueryParams) -> ConflictsSummaryOut:
        """
        Compute a summary of all detected conflicts.

        Notes:
        - Does NOT filter by schedule_id when collecting lessons to detect shared conflicts
          between different schedules; schedule_id is applied later when grouping.
        - Applies only date range filters (if provided) prior to conflict detection.

        Args:
            params (ConflictQueryParams): Filtering parameters (date range, optional conflict types, optional schedule filter for grouping).

        Returns:
            ConflictsSummaryOut: Groups of conflicts by scope (single/shared) and type with totals.
        """
        # Load all lessons with necessary relationships to analyze conflicts
        query = self.db.query(Lesson).options(
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

        # Apply date-only filters (no schedule_id filter here by design)
        if hasattr(params, "date_from") and params.date_from:
            query = query.filter(Lesson.date >= params.date_from)
        if hasattr(params, "date_to") and params.date_to:
            query = query.filter(Lesson.date <= params.date_to)

        # Получаем ВСЕ уроки для анализа конфликтов
        all_lessons = query.order_by(Lesson.date, Lesson.start_time).all()

        # Находим все конфликты без ограничений
        all_conflicts = self._find_all_conflicts(all_lessons, params.conflict_types)

        # Группируем конфликты с фильтрацией по schedule_id
        result = self._group_conflicts_by_scope_and_type(
            all_conflicts, params.schedule_id
        )

        return result

    def _find_all_conflicts(
        self, lessons: List[Lesson], conflict_types: Optional[List[str]] = None
    ) -> List[Dict]:
        """
        Find conflicts of the requested types across provided lessons.

        Strategy:
        - Bucket lessons by date to reduce comparisons.
        - For each date, detect room/professor/group conflicts based on time overlaps.

        Args:
            lessons (List[Lesson]): Collection of lessons to analyze.
            conflict_types (Optional[List[str]]): Subset of types to check ("room", "professor", "group").
                If None, all types are checked.

        Returns:
            List[Dict]: Raw conflict dicts used downstream for grouping and serialization.
        """
        conflicts = []

        # Группируем уроки по дням для оптимизации
        lessons_by_date: Dict[date, List[Lesson]] = {}
        for lesson in lessons:
            if lesson.date not in lessons_by_date:
                lessons_by_date[lesson.date] = []
            lessons_by_date[lesson.date].append(lesson)

        # Находим конфликты по дням
        for date_lessons in lessons_by_date.values():
            if not conflict_types or "room" in conflict_types:
                conflicts.extend(self._find_room_conflicts_in_day(date_lessons))
            if not conflict_types or "professor" in conflict_types:
                conflicts.extend(self._find_professor_conflicts_in_day(date_lessons))
            if not conflict_types or "group" in conflict_types:
                conflicts.extend(self._find_group_conflicts_in_day(date_lessons))
        return conflicts

    def _group_conflicts_by_scope_and_type(
        self, conflicts: List[Dict], schedule_id: Optional[int]
    ) -> ConflictsSummaryOut:
        """
        Group conflicts by scope ("single" for one schedule, "shared" for multiple schedules) and by type.

        Optionally filters out conflicts that do not involve the provided schedule_id.

        Args:
            conflicts (List[Dict]): Raw conflict records from _find_all_conflicts.
            schedule_id (Optional[int]): If provided, only include conflicts that touch this schedule.

        Returns:
            ConflictsSummaryOut: Grouped conflicts with counts and totals.
        """
        single_conflicts: Dict[str, List[ConflictOut]] = {
            "room": [],
            "professor": [],
            "group": [],
        }
        shared_conflicts: Dict[str, List[ConflictOut]] = {
            "room": [],
            "professor": [],
            "group": [],
        }

        for conflict in conflicts:
            # Определяем область действия конфликта
            schedule_ids = set()
            for lesson in conflict["lessons"]:
                if hasattr(lesson, "schedule_id"):
                    schedule_ids.add(lesson.schedule_id)
                elif hasattr(lesson, "schedule") and lesson.schedule:
                    schedule_ids.add(lesson.schedule.id)

            # Если указан schedule_id, показываем только конфликты, которые затрагивают это расписание
            if schedule_id and schedule_id not in schedule_ids:
                continue

            conflict_schema = self._conflict_to_schema(conflict)

            # Определяем тип конфликта: single (один schedule) или shared (несколько)
            if len(schedule_ids) == 1:
                # Проверяем, что single конфликт относится к нужному расписанию
                if not schedule_id or schedule_id in schedule_ids:
                    single_conflicts[conflict["type"]].append(conflict_schema)
            else:
                # Shared конфликт - показываем только если затрагивает наше расписание
                if not schedule_id or schedule_id in schedule_ids:
                    shared_conflicts[conflict["type"]].append(conflict_schema)

        # Формируем группы
        single_groups = []
        shared_groups = []

        # Создаем группы для single конфликтов
        for conflict_type, type_conflicts in single_conflicts.items():
            if type_conflicts:
                single_groups.append(
                    ConflictGroupOut(
                        type=conflict_type,
                        conflict_scope="single",
                        conflicts=type_conflicts,
                        count=len(type_conflicts),
                    )
                )

        # Создаем группы для shared конфликтов
        for conflict_type, type_conflicts in shared_conflicts.items():
            if type_conflicts:
                shared_groups.append(
                    ConflictGroupOut(
                        type=conflict_type,
                        conflict_scope="shared",
                        conflicts=type_conflicts,
                        count=len(type_conflicts),
                    )
                )

        # Подсчитываем общие числа
        total_single = sum(group.count for group in single_groups)
        total_shared = sum(group.count for group in shared_groups)

        return ConflictsSummaryOut(
            single=single_groups,
            shared=shared_groups,
            total_single=total_single,
            total_shared=total_shared,
            total_conflicts=total_single + total_shared,
        )

    def _find_room_conflicts_in_day(self, lessons: List[Lesson]) -> List[Dict]:
        """
        Detect room conflicts for a single day.

        Logic:
        - Group lessons by room (excluding online lessons).
        - For each room, find overlapping time groups.
        - If overlapping lessons are taught by different professors, it is a conflict;
          if the same professor teaches all overlapping lessons in the same room, treat as multi-group, not a conflict.

        Args:
            lessons (List[Lesson]): Lessons occurring on the same date.

        Returns:
            List[Dict]: Room conflict entries.
        """
        conflicts = []
        room_lessons: Dict[int, List[Lesson]] = {}

        for lesson in lessons:
            if lesson.room_id and not lesson.is_online:
                if lesson.room_id not in room_lessons:
                    room_lessons[lesson.room_id] = []
                room_lessons[lesson.room_id].append(lesson)

        for room_id, room_lesson_list in room_lessons.items():
            overlapping_groups = self._find_time_overlaps(room_lesson_list)
            for overlap_group in overlapping_groups:
                if len(overlap_group) > 1:
                    # Получаем расписания для отладки
                    schedules = set()
                    professors = set()
                    for lesson in overlap_group:
                        schedules.add(lesson.schedule_id)
                        professor_id = self._get_professor_id(lesson)
                        if professor_id:
                            professors.add(professor_id)

                    # Межрасписанийный конфликт комнат - всегда конфликт
                    if len(schedules) > 1:
                        room_name = (
                            overlap_group[0].room.number
                            if overlap_group[0].room
                            else f"Room {room_id}"
                        )
                        conflicts.append({
                            "type": "room",
                            "message": f"Room '{room_name}' is double-booked across schedules at {overlap_group[0].start_time}-{overlap_group[0].end_time}",
                            "severity": "error",
                            "lessons": overlap_group,
                        })
                    else:
                        # Внутрирасписанийный конфликт - применяем логику с преподавателями
                        # Если один преподаватель ведет все уроки в одной комнате - это многогрупповое занятие, не конфликт
                        if len(professors) == 1:
                            continue

                        # Если разные преподаватели в одной комнате - это конфликт
                        room_name = (
                            overlap_group[0].room.number
                            if overlap_group[0].room
                            else f"Room {room_id}"
                        )
                        conflicts.append({
                            "type": "room",
                            "message": f"Room '{room_name}' is double-booked by different professors at {overlap_group[0].start_time}-{overlap_group[0].end_time}",
                            "severity": "error",
                            "lessons": overlap_group,
                        })
        return conflicts

    def _find_professor_conflicts_in_day(self, lessons: List[Lesson]) -> List[Dict]:
        """
        Detect professor conflicts for a single day.

        Logic:
        - Group lessons by professor.
        - For each professor, find overlapping time groups.
        - If overlapping lessons occur in multiple rooms (or mix online/rooms), it is a conflict;
          if all overlapping lessons are in the same room or all online, treat as multi-group, not a conflict.

        Args:
            lessons (List[Lesson]): Lessons occurring on the same date.

        Returns:
            List[Dict]: Professor conflict entries.
        """
        conflicts = []
        professor_lessons: Dict[int, List[Lesson]] = {}

        for lesson in lessons:
            professor_id = self._get_professor_id(lesson)
            if professor_id:
                if professor_id not in professor_lessons:
                    professor_lessons[professor_id] = []
                professor_lessons[professor_id].append(lesson)

        for professor_id, prof_lesson_list in professor_lessons.items():
            overlapping_groups = self._find_time_overlaps(prof_lesson_list)
            
            for overlap_group in overlapping_groups:
                if len(overlap_group) > 1:
                    # Получаем расписания для определения типа конфликта
                    schedules = set()
                    for lesson in overlap_group:
                        schedules.add(lesson.schedule_id)
                    
                    # Проверяем, в одной ли комнате все уроки преподавателя
                    rooms = set()
                    online_lessons = 0

                    for lesson in overlap_group:
                        if lesson.is_online:
                            online_lessons += 1
                        elif lesson.room_id:
                            rooms.add(lesson.room_id)

                    # ИСПРАВЛЕНИЕ: Убираем строгую проверку комнат для межрасписанийных конфликтов
                    # Если уроки из разных расписаний - это всегда конфликт независимо от комнаты
                    if len(schedules) > 1:
                        # Межрасписанийный конфликт - всегда является конфликтом
                        first_lesson = overlap_group[0]
                        professor = self._get_professor_object(first_lesson)

                        if professor and professor.user:
                            professor_name = f"{professor.user.name} {professor.user.surname}"
                            conflicts.append({
                                "type": "professor",
                                "message": f"Professor {professor_name} has conflicting lessons across schedules at {overlap_group[0].start_time}-{overlap_group[0].end_time}",
                                "severity": "error",
                                "lessons": overlap_group,
                            })
                    else:
                        # Внутрирасписанийный конфликт - применяем логику с комнатами
                        # Если все уроки в одной комнате ИЛИ все онлайн - это многогрупповое занятие, не конфликт
                        if len(rooms) <= 1 and (len(rooms) == 0 or online_lessons == 0):
                            continue

                        # Если преподаватель в разных комнатах одновременно - это конфликт
                        first_lesson = overlap_group[0]
                        professor = self._get_professor_object(first_lesson)

                        if professor and professor.user:
                            professor_name = f"{professor.user.name} {professor.user.surname}"
                            conflicts.append({
                                "type": "professor",
                                "message": f"Professor {professor_name} teaching in multiple locations simultaneously at {overlap_group[0].start_time}-{overlap_group[0].end_time}",
                                "severity": "error",
                                "lessons": overlap_group,
                            })
        return conflicts

    def _find_group_conflicts_in_day(self, lessons: List[Lesson]) -> List[Dict]:
        """
        Detect group conflicts for a single day.

        Logic:
        - Group lessons by group (through many-to-many relationship).
        - For each group, find overlapping time groups and mark conflicts.

        Args:
            lessons (List[Lesson]): Lessons occurring on the same date.

        Returns:
            List[Dict]: Group conflict entries.
        """
        conflicts = []
        group_lessons: Dict[int, List[Lesson]] = {}

        # Собираем уроки по группам через many-to-many связь
        for lesson in lessons:
            for group in lesson.groups:
                if group.id not in group_lessons:
                    group_lessons[group.id] = []
                group_lessons[group.id].append(lesson)

        for group_id, group_lesson_list in group_lessons.items():
            overlapping_groups = self._find_time_overlaps(group_lesson_list)
            for overlap_group in overlapping_groups:
                if len(overlap_group) > 1:
                    # Получаем расписания для определения типа конфликта
                    schedules = set()
                    for lesson in overlap_group:
                        schedules.add(lesson.schedule_id)

                    # Находим группу для отображения имени
                    group_name = f"Group {group_id}"
                    for lesson in overlap_group:
                        for group in lesson.groups:
                            if group.id == group_id:
                                group_name = group.name
                                break
                        if group_name != f"Group {group_id}":
                            break

                    # Формируем сообщение в зависимости от типа конфликта
                    if len(schedules) > 1:
                        message = f"Group '{group_name}' has conflicting lessons across schedules at {overlap_group[0].start_time}-{overlap_group[0].end_time}"
                    else:
                        message = f"Group '{group_name}' has multiple lessons at {overlap_group[0].start_time}-{overlap_group[0].end_time}"

                    conflicts.append({
                        "type": "group",
                        "message": message,
                        "severity": "error",
                        "lessons": overlap_group,
                    })
        return conflicts

    def _find_time_overlaps(self, lessons: List[Lesson]) -> List[List[Lesson]]:
        """
        Identify sets of lessons with overlapping times (on the same date).

        Algorithm:
        - Iterate each lesson and compare with subsequent lessons.
        - Two lessons overlap if start_time < other.end_time and end_time > other.start_time.
        - Build groups of overlapping lessons and return only groups with size > 1.

        Args:
            lessons (List[Lesson]): Lessons to check (assumed same date by callers).

        Returns:
            List[List[Lesson]]: List of overlapping groups (each group is >= 2 lessons).
        """
        overlapping_groups = []
        processed = set()

        for i, lesson1 in enumerate(lessons):
            if lesson1.id in processed:
                continue

            overlap_group = [lesson1]
            processed.add(lesson1.id)

            for j, lesson2 in enumerate(lessons[i + 1 :], i + 1):
                if lesson2.id in processed:
                    continue

                # Проверяем пересечение времени И даты
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

    def _get_professor_id(self, lesson: Lesson) -> Optional[int]:
        """
        Extract the professor (user) ID from a lesson via nested relationships.

        Follows: lesson.subject_assignment -> workload -> contract -> professor_profile.user_id

        Args:
            lesson (Lesson): Lesson to inspect.

        Returns:
            Optional[int]: Professor user ID if resolvable, otherwise None.
        """
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
        """
        Extract the ProfessorProfile object from a lesson via nested relationships.

        Follows: lesson.subject_assignment -> workload -> contract -> professor_profile

        Args:
            lesson (Lesson): Lesson to inspect.

        Returns:
            ProfessorProfile | None: The professor profile if resolvable, otherwise None.
        """
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

    def _conflict_to_schema(self, conflict_data: Dict) -> ConflictOut:
        """
        Convert a raw conflict dict to a typed ConflictOut schema.

        Args:
            conflict_data (Dict): Raw conflict entry with keys: type, message, severity, lessons.

        Returns:
            ConflictOut: Typed conflict model ready for response serialization.
        """
        lesson_schemas = []
        for lesson in conflict_data["lessons"]:
            lesson_out = LessonOut.model_validate(lesson)
            lesson_schemas.append(lesson_out)

        return ConflictOut(
            type=conflict_data["type"],
            message=conflict_data["message"],
            severity=conflict_data["severity"],
            lessons=lesson_schemas,
        )

    def get_schedule_groups(self, schedule_id: int):
        """
        Get unique groups involved in a schedule (for filters/summary).

        Args:
            schedule_id (int): Identifier of the schedule to inspect.

        Returns:
            list[dict]: Each item contains id, name, and a nested study_form mini object (if available).
        """
        from ..models.lesson import lesson_groups

        groups_query = (
            self.db.query(Group)
            .join(lesson_groups)
            .join(Lesson)
            .filter(Lesson.schedule_id == schedule_id)
            .distinct()
            .order_by(Group.name)
        )

        return [
            {
                "id": group.id,
                "name": group.name,
                "study_form": {
                    "id": group.study_form.id,
                    "form": group.study_form.form,
                }
                if group.study_form
                else None,
            }
            for group in groups_query.all()
        ]
