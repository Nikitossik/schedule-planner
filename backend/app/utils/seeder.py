from faker import Faker
import random

import app.services as services
import app.repositories as repos
import app.schemas as sch
from ..database import Base, engine
from .enums import UserRoleEnum, StudyFormEnum, SemesterPeriodEnum
from ..config import setting
from .security import get_password_hash
from datetime import timedelta, time, date

fake = Faker()


def seed_first_admin(db):
    user_repo = repos.UserRepository(db)
    admin_users = user_repo.get_by_role(UserRoleEnum.admin)

    if len(admin_users) == 0:
        user_repo.create(
            {
                "email": setting.INITIAL_ADMIN_EMAIL,
                "name": "admin",
                "surname": "admin",
                "role": "admin",
                "password_hash": get_password_hash(setting.INITIAL_ADMIN_PASSWORD),
            }
        )


def seed_faculties(db):
    repo = repos.FacultyRepository(db)
    repo.create({"name": "Computer Science"})


def seed_directions_and_study_forms(db):
    directions_repo = repos.DirectionRepository(db)
    study_form_repo = repos.StudyFormRepository(db)

    # 3 направления в Computer Science
    directions = [
        {"name": "Game Programming", "code": "PKG", "faculty_id": 1},
        {
            "name": "Mobile Applications and Internet Platforms",
            "code": "AMIPI",
            "faculty_id": 1,
        },
        {"name": "Computer Science", "code": "INF", "faculty_id": 1},
    ]

    for direction in directions:
        directions_repo.create(direction)

    # Для каждого направления создаем очную и заочную формы
    for direction in directions_repo.get_multiple():
        study_form_repo.create(
            {"form": StudyFormEnum.full_time, "direction_id": direction.id}
        )
        study_form_repo.create(
            {"form": StudyFormEnum.part_time, "direction_id": direction.id}
        )


def seed_semesters_and_academic_year(db):
    semester_repo = repos.SemesterRepository(db)
    academic_year_repo = repos.AcademicYearRepository(db)

    # Академический год 2025/2026
    academic_year = {
        "name": "2025/2026",
        "start_date": date(2025, 9, 1),
        "end_date": date(2026, 6, 30),
        "is_current": True,
    }
    academic_year_repo.create(academic_year)

    # 2 семестра: 3-й и 5-й зимние
    semesters = [
        {
            "name": "Semester 3 Winter 2025-2026",
            "academic_year_id": 1,
            "number": 3,
            "period": SemesterPeriodEnum.winter,
            "start_date": date(2025, 9, 1),
            "end_date": date(2026, 1, 31),
        },
        {
            "name": "Semester 5 Winter 2025-2026",
            "academic_year_id": 1,
            "number": 5,
            "period": SemesterPeriodEnum.winter,
            "start_date": date(2025, 9, 1),
            "end_date": date(2026, 1, 31),
        },
    ]

    for semester in semesters:
        semester_repo.create(semester)


def seed_groups(db):
    group_repo = repos.GroupRepository(db)
    study_form_repo = repos.StudyFormRepository(db)

    study_forms = study_form_repo.get_multiple()

    for study_form in study_forms:
        # INF - только 3 семестр
        if study_form.direction.code == "INF":
            semester_id = 1  # 3-й семестр
        # AMIPI и PKG - только 5 семестр
        else:
            semester_id = 2  # 5-й семестр

        group_name = f"{study_form.direction.code}-{study_form.form}"
        group_repo.create(
            {
                "name": group_name,
                "study_form_id": study_form.id,
                "semester_id": semester_id,
                "student_count": random.randint(10, 20)
                if setting.DISABLE_STUDENT_ACCOUNTS
                else None,
            }
        )


def seed_subjects(db):
    repo = repos.SubjectRepository(db)

    # По 3 предмета на каждое направление и семестр
    subjects = [
        # INF - 3 семестр (semester_id=1, direction_id=3)
        {
            "name": "Data Structures",
            "direction_id": 3,
            "semester_id": 1,
            "allocated_hours": 200,
        },
        {
            "name": "Computer Networks",
            "direction_id": 3,
            "semester_id": 1,
            "allocated_hours": 200,
        },
        {
            "name": "Database Systems",
            "direction_id": 3,
            "semester_id": 1,
            "allocated_hours": 200,
        },
        # AMIPI - 5 семестр (semester_id=2, direction_id=2)
        {
            "name": "Mobile Development",
            "direction_id": 2,
            "semester_id": 2,
            "allocated_hours": 200,
        },
        {
            "name": "Web Technologies",
            "direction_id": 2,
            "semester_id": 2,
            "allocated_hours": 200,
        },
        {
            "name": "Cloud Computing",
            "direction_id": 2,
            "semester_id": 2,
            "allocated_hours": 200,
        },
        # PKG - 5 семестр (semester_id=2, direction_id=1)
        {
            "name": "Game Engine Development",
            "direction_id": 1,
            "semester_id": 2,
            "allocated_hours": 200,
        },
        {
            "name": "3D Graphics Programming",
            "direction_id": 1,
            "semester_id": 2,
            "allocated_hours": 200,
        },
        {
            "name": "Game AI",
            "direction_id": 1,
            "semester_id": 2,
            "allocated_hours": 200,
        },
    ]

    for subject in subjects:
        repo.create(subject)


def seed_rooms(db):
    repo = repos.RoomRepository(db)

    # Комнаты A-C, номера 100-110
    rooms = []
    for building in ["A", "B", "C"]:
        for room_num in range(100, 111):  # 100-110
            rooms.append(
                {"number": f"{building}{room_num}", "capacity": random.randint(20, 40)}
            )

    for room in rooms:
        repo.create(room)


def seed_university_holidays(db):
    """Создаем университетские праздники (выходные дни)"""
    repo = repos.UniversityHolidayRepository(db)

    # Ежегодные праздники (annual=True)
    annual_holidays = [
        {"name": "Nowy Rok", "is_annual": True, "date": date(2025, 1, 1)},
        {"name": "Trzech Króli", "is_annual": True, "date": date(2025, 1, 6)},
        {"name": "Święto Pracy", "is_annual": True, "date": date(2025, 5, 1)},
        {"name": "Święto Konstytucji", "is_annual": True, "date": date(2025, 5, 3)},
        {"name": "Wszystkich Świętych", "is_annual": True, "date": date(2025, 11, 1)},
        {
            "name": "Święto Niepodległości",
            "is_annual": True,
            "date": date(2025, 11, 11),
        },
        {
            "name": "Wigilia Bożego Narodzenia",
            "is_annual": True,
            "date": date(2025, 12, 24),
        },
        {
            "name": "Boże Narodzenie",
            "is_annual": True,
            "date": date(2025, 12, 25),
        },
        {
            "name": "Boże Narodzenie",
            "is_annual": True,
            "date": date(2025, 12, 26),
        },
    ]

    # Одноразовые праздники (annual=False)
    specific_holidays = [
        {"name": None, "is_annual": False, "date": date(2025, 10, 25)},
        {"name": None, "is_annual": False, "date": date(2025, 10, 26)},
    ]

    print(f"Creating {len(annual_holidays)} annual holidays...")
    for holiday in annual_holidays:
        try:
            repo.create(holiday)
            print(
                f"✅ Created annual holiday: {holiday['name']} - {holiday['date'].strftime('%d.%m')}"
            )
        except Exception as e:
            print(f"❌ Failed to create annual holiday {holiday['name']}: {e}")
            db.rollback()
            continue

    print(f"Creating {len(specific_holidays)} specific holidays...")
    for holiday in specific_holidays:
        try:
            repo.create(holiday)
            name_display = holiday["name"]
            print(
                f"✅ Created specific holiday: {name_display} - {holiday['date'].strftime('%d.%m.%Y')}"
            )
        except Exception as e:
            print(f"❌ Failed to create specific holiday {holiday['date']}: {e}")
            db.rollback()
            continue


def seed_users(db):
    service = services.UserService(db)
    groups = repos.GroupRepository(db).get_multiple()

    if not setting.DISABLE_STUDENT_ACCOUNTS:
        for group in groups:
            for i in range(10, 15):
                name = fake.first_name()
                student_data = {
                    "email": fake.email(),
                    "name": name,
                    "surname": fake.last_name(),
                    "password": name.lower(),
                    "role": "user",
                    "user_type": "student",
                    "student_profile": {
                        "group_id": group.id,
                    },
                }
                student = sch.user.UserIn(**student_data)
                service.create(student)

    # 3 преподавателя
    professors = [
        ("John", "Smith"),
        ("Sarah", "Johnson"),
        ("Michael", "Brown"),
    ]

    for name, surname in professors:
        professor_data = {
            "email": f"{name.lower().replace('dr. ', '')}.{surname.lower()}@university.edu",
            "name": name,
            "surname": surname,
            "password": name.lower().replace("dr. ", ""),
            "role": "user",
            "user_type": "professor",
            "professor_profile": {
                "academic_title": "dr.",
            },
        }
        professor = sch.user.UserIn(**professor_data)
        service.create(professor)


def seed_professor_contracts(db):
    professor_service = services.UserService(db)
    contract_repo = repos.ProfessorContractRepository(db)

    professors = professor_service.get_by_user_type("professor")

    # Каждый преподаватель получает по 2 контракта (на 3-й и 5-й семестры)
    for professor in professors:
        # Контракт на 3-й семестр
        contract_repo.create(
            {
                "professor_profile_id": professor.id,
                "semester_id": 1,  # 3-й семестр
                "total_hours": 300,  # Общие часы контракта
            }
        )

        # Контракт на 5-й семестр
        contract_repo.create(
            {
                "professor_profile_id": professor.id,
                "semester_id": 2,  # 5-й семестр
                "total_hours": 300,  # Общие часы контракта
            }
        )


def seed_professor_workloads(db):
    contract_repo = repos.ProfessorContractRepository(db)
    study_form_repo = repos.StudyFormRepository(db)
    workload_repo = repos.ProfessorWorkloadRepository(db)

    contracts = contract_repo.get_multiple()
    study_forms = study_form_repo.get_multiple()

    for contract in contracts:
        semester_id = contract.semester_id

        # Находим формы обучения для данного семестра
        relevant_study_forms = []
        for study_form in study_forms:
            if semester_id == 1 and study_form.direction.code == "INF":
                relevant_study_forms.append(study_form)
            elif semester_id == 2 and study_form.direction.code in ["AMIPI", "PKG"]:
                relevant_study_forms.append(study_form)

        # Распределяем часы с учетом количества направлений
        total_hours = contract.total_hours

        if semester_id == 1:  # INF - одно направление
            full_time_hours = int(total_hours * 0.6)  # 180 часов
            part_time_hours = int(total_hours * 0.4)  # 120 часов
        else:  # 5-й семестр - два направления (AMIPI, PKG), делим пополам
            full_time_hours = int(
                total_hours * 0.6 / 2
            )  # 90 часов на каждое направление
            part_time_hours = int(
                total_hours * 0.4 / 2
            )  # 60 часов на каждое направление

        for study_form in relevant_study_forms:
            if study_form.form == StudyFormEnum.full_time:
                assigned_hours = full_time_hours
            else:
                assigned_hours = part_time_hours

            workload_repo.create(
                {
                    "study_form_id": study_form.id,
                    "contract_id": contract.id,
                    "assigned_hours": assigned_hours,
                }
            )


def seed_subject_assignments(db):
    """
    Распределяем 9 предметов между 3 преподавателями:
    - Препод 1: DS-3 (INF), MD-5 (AMIPI), GED-5 (PKG)
    - Препод 2: CN-3 (INF), WT-5 (AMIPI), 3DGP-5 (PKG)
    - Препод 3: DBS-3 (INF), CC-5 (AMIPI), GAI-5 (PKG)
    """
    workload_repo = repos.ProfessorWorkloadRepository(db)
    subject_repo = repos.SubjectRepository(db)
    assignment_repo = repos.SubjectAssignmentRepository(db)

    workloads = workload_repo.get_multiple()
    subjects = subject_repo.get_multiple()

    print(f"Found {len(workloads)} workloads and {len(subjects)} subjects")

    # Создаем мапинг предметов по имени
    subjects_by_name = {subject.name: subject for subject in subjects}

    # Группируем workload по преподавателям
    workloads_by_professor = {}
    for workload in workloads:
        prof_id = workload.contract.professor_profile_id
        if prof_id not in workloads_by_professor:
            workloads_by_professor[prof_id] = []
        workloads_by_professor[prof_id].append(workload)

    print(
        f"Workloads by professor: {[(k, len(v)) for k, v in workloads_by_professor.items()]}"
    )

    # Получаем актуальные ID преподавателей
    actual_prof_ids = list(workloads_by_professor.keys())

    # Распределение предметов по преподавателям (используем актуальные ID)
    professor_subjects = {}
    subject_names = [
        [
            "Data Structures",
            "Mobile Development",
            "Game Engine Development",
        ],  # Первый преподаватель
        [
            "Computer Networks",
            "Web Technologies",
            "3D Graphics Programming",
        ],  # Второй преподаватель
        ["Database Systems", "Cloud Computing", "Game AI"],  # Третий преподаватель
    ]

    for i, prof_id in enumerate(actual_prof_ids[:3]):  # Берем первых 3 преподавателей
        professor_subjects[prof_id] = subject_names[i]

    for prof_id, assigned_subjects in professor_subjects.items():
        prof_workloads = workloads_by_professor.get(prof_id, [])
        print(
            f"\nProfessor {prof_id} has {len(prof_workloads)} workloads, assigned subjects: {assigned_subjects}"
        )

        for subject_name in assigned_subjects:
            subject = subjects_by_name.get(subject_name)
            if not subject:
                print(f"❌ Subject {subject_name} not found")
                continue

            print(
                f"Processing subject {subject_name} (direction_id={subject.direction_id}, semester_id={subject.semester_id})"
            )

            # Находим соответствующие workload для этого предмета
            found_workload = False
            for workload in prof_workloads:
                print(
                    f"  Checking workload: direction_id={workload.study_form.direction_id}, semester_id={workload.contract.semester_id}"
                )
                # Проверяем соответствие семестра и направления
                if (
                    workload.contract.semester_id == subject.semester_id
                    and workload.study_form.direction_id == subject.direction_id
                ):
                    # Рассчитываем часы (делим поровну между предметами преподавателя)
                    # У каждого преподавателя 3 предмета, поэтому делим workload на 3
                    hours_per_subject = workload.assigned_hours // 3

                    # Создаем превышение для некоторых предметов (мало часов)
                    if subject_name in [
                        "Data Structures",
                        "Web Technologies",
                        "Game AI",
                    ]:  # По одному от каждого препода
                        hours_per_subject = 10  # Очень мало часов - создаст превышение

                    print(
                        f"Creating assignment: {subject_name} - {workload.assigned_hours}h total, {hours_per_subject}h per subject"
                    )

                    try:
                        assignment_repo.create(
                            {
                                "workload_id": workload.id,
                                "subject_id": subject.id,
                                "hours_per_subject": hours_per_subject,
                            }
                        )
                        found_workload = True
                        print(f"✅ Created assignment for {subject_name}")
                    except Exception as e:
                        print(
                            f"❌ Failed to create assignment {subject_name} for professor {prof_id}: {e}"
                        )
                        db.rollback()
                        continue

            if not found_workload:
                print(f"❌ No matching workload found for {subject_name}")


def seed_schedules_and_lessons(db):
    """Создаем 3 расписания и уроки с 5 конфликтами и превышениями часов"""
    schedule_repo = repos.ScheduleRepository(db)
    lesson_repo = repos.LessonRepository(db)
    assignment_repo = repos.SubjectAssignmentRepository(db)
    group_repo = repos.GroupRepository(db)
    room_repo = repos.RoomRepository(db)

    # Создаем 3 расписания
    schedules_data = [
        {
            "name": "Schedule Computer Science INF",
            "semester_id": 1,
            "direction_id": 3,
        },  # INF
        {
            "name": "Schedule Mobile Applications AMIPI",
            "semester_id": 2,
            "direction_id": 2,
        },  # AMIPI
        {
            "name": "Schedule Game Programming PKG",
            "semester_id": 2,
            "direction_id": 1,
        },  # PKG
    ]

    for schedule_data in schedules_data:
        schedule_repo.create(schedule_data)

    schedules = schedule_repo.get_multiple()
    groups = group_repo.get_multiple()
    rooms = room_repo.get_multiple()
    assignments = assignment_repo.get_multiple()

    # Текущая неделя для расписания
    base_date = date(2025, 10, 6)  # Понедельник

    # Временные слоты
    time_slots = [
        (time(8, 0), time(9, 30)),  # 1 пара
        (time(9, 45), time(11, 15)),  # 2 пара
        (time(11, 30), time(13, 0)),  # 3 пара
        (time(13, 15), time(14, 45)),  # 4 пара
        (time(15, 0), time(16, 30)),  # 5 пара
        (time(16, 45), time(18, 15)),  # 6 пара
    ]

    # Счетчик созданных конфликтов
    conflicts_created = 0
    target_conflicts = 5

    # Специальные объекты для создания конфликтов
    conflict_room = rooms[0]  # A100 - будем использовать для конфликтов комнат
    conflict_assignments = []  # Будем собирать assignments от одного преподавателя

    # Находим assignments от одного преподавателя для конфликта преподавателя
    for assignment in assignments:
        prof_id = assignment.workload.contract.professor_profile_id
        if prof_id == 1:  # Первый преподаватель
            conflict_assignments.append(assignment)

    created_lessons = []  # Для отслеживания созданных уроков

    for schedule in schedules:
        print(f"\n=== Creating lessons for {schedule.name} ===")

        # Находим группы для этого расписания
        schedule_groups = [
            g
            for g in groups
            if g.study_form.direction_id == schedule.direction_id
            and g.semester_id == schedule.semester_id
        ]

        # Находим assignments для этого расписания
        schedule_assignments = [
            a
            for a in assignments
            if a.subject.direction_id == schedule.direction_id
            and a.subject.semester_id == schedule.semester_id
        ]

        print(f"Groups: {[g.name for g in schedule_groups]}")
        print(
            f"Assignments: {[f'{a.subject.name}-{a.workload.contract.professor_profile.user.name}' for a in schedule_assignments]}"
        )

        for group in schedule_groups:
            # Определяем дни для очной/заочной формы
            if group.study_form.form == StudyFormEnum.full_time:
                days = [0, 1, 2, 3, 4]  # Пн-Пт
                lessons_per_day = 3
            else:
                days = [5, 6]  # Сб-Вс
                lessons_per_day = 4

            for day_offset in days:
                lesson_date = base_date + timedelta(days=day_offset)

                # Выбираем случайные assignments для этого дня
                daily_assignments = random.sample(
                    schedule_assignments,
                    min(lessons_per_day, len(schedule_assignments)),
                )

                for i, assignment in enumerate(daily_assignments):
                    if i >= len(time_slots):
                        break

                    start_time, end_time = time_slots[i]
                    room = random.choice(rooms)

                    # КОНФЛИКТ 1: Комната (два урока в одной комнате одновременно)
                    if (
                        conflicts_created < target_conflicts
                        and day_offset == 0
                        and i == 0
                    ):
                        room = conflict_room
                        print(
                            f"🔥 CONFLICT 1 (Room): Using room {room.number} for conflict"
                        )
                        conflicts_created += 1

                    # КОНФЛИКТ 2: Комната (второй урок в той же комнате)
                    elif (
                        conflicts_created < target_conflicts
                        and day_offset == 0
                        and i == 1
                    ):
                        room = conflict_room  # Та же комната что и предыдущий урок
                        print(
                            f"🔥 CONFLICT 2 (Room): Using room {room.number} for conflict"
                        )
                        conflicts_created += 1

                    lesson_data = {
                        "schedule_id": schedule.id,
                        "group_id": group.id,
                        "subject_assignment_id": assignment.id,
                        "room_id": room.id,
                        "is_online": random.choice([True, False])
                        if random.random() < 0.1
                        else False,
                        "date": lesson_date,
                        "start_time": start_time,
                        "end_time": end_time,
                        "lesson_type": random.choice(["lecture", "practice", "lab"]),
                    }

                    try:
                        lesson = lesson_repo.create(lesson_data)
                        created_lessons.append(lesson)
                        print(
                            f"✅ Created lesson: {assignment.subject.name} - {group.name} - {room.number} - {start_time}"
                        )

                    except Exception as e:
                        print(f"❌ Failed to create lesson: {e}")
                        db.rollback()
                        continue

    # КОНФЛИКТ 3: Преподаватель (создаем урок для того же преподавателя одновременно)
    if conflicts_created < target_conflicts and len(conflict_assignments) >= 2:
        # Берем два разных assignment от одного преподавателя
        assignment1 = conflict_assignments[0]  # DS-3 (INF)
        assignment2 = conflict_assignments[1]  # MD-5 (AMIPI)

        # Находим соответствующие группы
        group1 = next(g for g in groups if g.study_form.direction_id == 3)  # INF группа
        group2 = next(
            g for g in groups if g.study_form.direction_id == 2
        )  # AMIPI группа

        conflict_date = base_date + timedelta(days=1)  # Вторник
        conflict_time = time_slots[2]  # 3 пара

        # Создаем два урока одновременно для одного преподавателя
        for assignment, group, schedule_id in [
            (assignment1, group1, 1),
            (assignment2, group2, 2),
        ]:
            lesson_data = {
                "schedule_id": schedule_id,
                "group_id": group.id,
                "subject_assignment_id": assignment.id,
                "room_id": random.choice(rooms).id,
                "is_online": False,
                "date": conflict_date,
                "start_time": conflict_time[0],
                "end_time": conflict_time[1],
                "lesson_type": "lecture",
            }

            try:
                lesson = lesson_repo.create(lesson_data)
                created_lessons.append(lesson)
                print(
                    f"🔥 CONFLICT 3 (Professor): {assignment.subject.name} - {group.name}"
                )
                conflicts_created += 1
            except Exception as e:
                print(f"❌ Failed to create professor conflict: {e}")
                db.rollback()

    # КОНФЛИКТ 4 и 5: Группа (две пары одновременно для одной группы)
    if conflicts_created < target_conflicts:
        # Выбираем первую группу INF
        target_group = next(
            g
            for g in groups
            if g.study_form.direction_id == 3
            and g.study_form.form == StudyFormEnum.full_time
        )
        relevant_assignments = [a for a in assignments if a.subject.direction_id == 3]

        if len(relevant_assignments) >= 2:
            conflict_date = base_date + timedelta(days=2)  # Среда
            conflict_time = time_slots[1]  # 2 пара

            # Создаем два урока одновременно для одной группы
            for assignment in relevant_assignments[:2]:
                lesson_data = {
                    "schedule_id": 1,  # INF расписание
                    "group_id": target_group.id,
                    "subject_assignment_id": assignment.id,
                    "room_id": random.choice(rooms).id,
                    "is_online": False,
                    "date": conflict_date,
                    "start_time": conflict_time[0],
                    "end_time": conflict_time[1],
                    "lesson_type": "practice",
                }

                try:
                    lesson = lesson_repo.create(lesson_data)
                    created_lessons.append(lesson)
                    print(
                        f"🔥 CONFLICT {conflicts_created + 1} (Group): {assignment.subject.name} - {target_group.name}"
                    )
                    conflicts_created += 1
                except Exception as e:
                    print(f"❌ Failed to create group conflict: {e}")
                    db.rollback()

    print(
        f"\n🎯 Created {conflicts_created} conflicts out of {target_conflicts} target"
    )
    print(f"📚 Total lessons created: {len(created_lessons)}")

    # Создаем дополнительные уроки для предметов с малым количеством часов (для превышения)
    # Это создаст превышения для Data Structures, Web Technologies, Game AI (которые имеют только 10 часов)
    excess_subjects = ["Data Structures", "Web Technologies", "Game AI"]
    for subject_name in excess_subjects:
        subject_assignments = [a for a in assignments if a.subject.name == subject_name]

        for assignment in subject_assignments:
            # Находим подходящую группу
            target_groups = [
                g
                for g in groups
                if g.study_form.direction_id == assignment.subject.direction_id
                and g.semester_id == assignment.subject.semester_id
            ]

            if target_groups:
                target_group = target_groups[0]

                # Создаем несколько дополнительных уроков (чтобы превысить 10 часов)
                for extra_day in range(3, 6):  # Чт-Сб
                    extra_date = base_date + timedelta(days=extra_day)
                    extra_time = time_slots[0]  # Первая пара

                    # Находим соответствующее расписание
                    schedule_id = (
                        1
                        if assignment.subject.direction_id == 3
                        else (2 if assignment.subject.direction_id == 2 else 3)
                    )

                    lesson_data = {
                        "schedule_id": schedule_id,
                        "group_id": target_group.id,
                        "subject_assignment_id": assignment.id,
                        "room_id": random.choice(rooms).id,
                        "is_online": False,
                        "date": extra_date,
                        "start_time": extra_time[0],
                        "end_time": extra_time[1],
                        "lesson_type": "practice",
                    }

                    try:
                        lesson = lesson_repo.create(lesson_data)
                        print(f"⚠️ EXCESS HOURS: Extra lesson for {subject_name}")
                    except Exception as e:
                        print(f"❌ Failed to create excess lesson: {e}")
                        db.rollback()
                        continue


def drop_and_create_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed_test_data(db):
    seed_faculties(db)
    seed_directions_and_study_forms(db)
    seed_semesters_and_academic_year(db)
    seed_university_holidays(db)
    seed_groups(db)
    seed_subjects(db)
    seed_rooms(db)
    seed_users(db)
    seed_professor_contracts(db)
    seed_professor_workloads(db)
    seed_subject_assignments(db)
    seed_schedules_and_lessons(db)
