import json
import os
from datetime import date
from typing import Dict, Any

import app.services as services
import app.repositories as repos
import app.schemas as sch
from ..database import Base, engine
from .enums import UserRoleEnum, StudyFormEnum, SemesterPeriodEnum
from ..config import setting
from .security import get_password_hash


def load_data() -> Dict[str, Any]:
    """Load data from the JSON file."""
    current_dir = os.path.dirname(__file__)
    data_file_path = os.path.join(current_dir, "data.json")
    
    with open(data_file_path, 'r', encoding='utf-8') as file:
        return json.load(file)


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
    """Seed faculties from data.json"""
    data = load_data()
    repo = repos.FacultyRepository(db)
    
    for faculty_data in data.get("faculty", []):
        repo.create(faculty_data)


def seed_directions(db):
    """Seed directions from data.json"""
    data = load_data()
    repo = repos.DirectionRepository(db)
    
    for direction_data in data.get("direction", []):
        # Remove id from data as it should be auto-generated
        create_data = {k: v for k, v in direction_data.items() if k != "id"}
        repo.create(direction_data)


def seed_study_forms(db):
    """Seed study forms from data.json"""
    data = load_data()
    repo = repos.StudyFormRepository(db)
    
    for study_form_data in data.get("study_form", []):
        # Remove id from data as it should be auto-generated
        create_data = {k: v for k, v in study_form_data.items() if k != "id"}
        repo.create(study_form_data)


def seed_academic_years(db):
    """Seed academic years from data.json"""
    data = load_data()
    repo = repos.AcademicYearRepository(db)
    
    for academic_year_data in data.get("academic_year", []):
        # Remove id from data as it should be auto-generated
        create_data = academic_year_data
        # Convert date strings to date objects
        if "start_date" in create_data and isinstance(create_data["start_date"], str):
            create_data["start_date"] = date.fromisoformat(create_data["start_date"])
        if "end_date" in create_data and isinstance(create_data["end_date"], str):
            create_data["end_date"] = date.fromisoformat(create_data["end_date"])
        repo.create(create_data)


def seed_semesters(db):
    """Seed semesters from data.json"""
    data = load_data()
    repo = repos.SemesterRepository(db)
    
    for semester_data in data.get("semester", []):
        # Remove id from data as it should be auto-generated
        create_data = semester_data
        # Convert date strings to date objects
        if "start_date" in create_data and isinstance(create_data["start_date"], str):
            create_data["start_date"] = date.fromisoformat(create_data["start_date"])
        if "end_date" in create_data and isinstance(create_data["end_date"], str):
            create_data["end_date"] = date.fromisoformat(create_data["end_date"])
        repo.create(create_data)


def seed_groups(db):
    """Seed groups from data.json"""
    data = load_data()
    repo = repos.GroupRepository(db)
    
    for group_data in data.get("group", []):
        # Remove id from data as it should be auto-generated
        create_data = {k: v for k, v in group_data.items() if k != "id"}
        repo.create(group_data)


def seed_subjects(db):
    """Seed subjects from data.json"""
    data = load_data()
    repo = repos.SubjectRepository(db)
    
    for subject_data in data.get("subject", []):
        # Remove id from data as it should be auto-generated
        create_data = {k: v for k, v in subject_data.items() if k != "id"}
        repo.create(subject_data)


def seed_rooms(db):
    """Seed rooms from data.json"""
    data = load_data()
    repo = repos.RoomRepository(db)
    
    for room_data in data.get("room", []):
        # Remove id from data as it should be auto-generated
        create_data = {k: v for k, v in room_data.items() if k != "id"}
        repo.create(room_data)


def seed_university_holidays(db):
    """Seed university holidays from data.json"""
    data = load_data()
    repo = repos.UniversityHolidayRepository(db)
    
    for holiday_data in data.get("university_holiday", []):
        # Remove id from data as it should be auto-generated
        create_data = holiday_data
        # Convert date strings to date objects
        if "date" in create_data and isinstance(create_data["date"], str):
            create_data["date"] = date.fromisoformat(create_data["date"])
        if "start_date" in create_data and isinstance(create_data["start_date"], str):
            create_data["start_date"] = date.fromisoformat(create_data["start_date"])
        if "end_date" in create_data and isinstance(create_data["end_date"], str):
            create_data["end_date"] = date.fromisoformat(create_data["end_date"])
        repo.create(create_data)


def seed_users(db):
    """Seed users from data.json using UserService with create_profile=False"""
    data = load_data()
    service = services.UserService(db)
    for user_data in data.get("user", []):
        user_schema = sch.user.UserIn(**user_data)
        service.create(user_schema, create_profile=False)



def seed_professor_profiles(db):
    """Seed professor profiles from data.json"""
    data = load_data()
    repo = repos.ProfessorProfileRepository(db)
    
    for profile_data in data.get("professor_profile", []):
        repo.create(profile_data)


def seed_professor_contracts(db):
    """Seed professor contracts from data.json"""
    data = load_data()
    repo = repos.ProfessorContractRepository(db)
    
    for contract_data in data.get("professor_contract", []):
        # Remove id from data as it should be auto-generated
        create_data = {k: v for k, v in contract_data.items() if k != "id"}
        repo.create(contract_data)


def seed_professor_workloads(db):
    """Seed professor workloads from data.json"""
    data = load_data()
    repo = repos.ProfessorWorkloadRepository(db)
    
    for workload_data in data.get("professor_workload", []):
        # Remove id from data as it should be auto-generated
        create_data = {k: v for k, v in workload_data.items() if k != "id"}
        repo.create(workload_data)


def seed_subject_assignments(db):
    """Seed subject assignments from data.json"""
    data = load_data()
    repo = repos.SubjectAssignmentRepository(db)
    for assignment_data in data.get("subject_assignment", []):
        # Remove id from data as it should be auto-generated
        create_data = {k: v for k, v in assignment_data.items() if k != "id"}
        repo.create(assignment_data)


def drop_and_create_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)


def seed_test_data(db):
    """Seed all test data in proper order to respect foreign key constraints"""
    
    # Create first admin
    seed_first_admin(db)
    
    # Base entities first
    seed_faculties(db)
    seed_directions(db)
    seed_study_forms(db)
    seed_academic_years(db)
    seed_semesters(db)
    seed_university_holidays(db)
    seed_groups(db)
    seed_subjects(db)
    seed_rooms(db)
    
    # Users and profiles
    seed_users(db)
    seed_professor_profiles(db)
    
    # Workload related entities
    seed_professor_contracts(db)
    seed_professor_workloads(db)
    seed_subject_assignments(db)