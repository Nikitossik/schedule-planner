from .user import UserService
from .faculty import FacultyService
from .direction import DirectionService
from .subject import SubjectService
from .room import RoomService
from .group import GroupService
from .schedule import ScheduleService
from .semester import SemesterService
from .professor_contract import ProfessorContractService
from .professor_workload import ProfessorWorkloadService
from .study_form import StudyFormService
from .subject_assignment import SubjectAssignmentService
from .lesson import LessonService
from .academic_year import AcademicYearService
from .university_holiday import UniversityHolidayService

__all__ = [
    "UserService",
    "FacultyService",
    "DirectionService",
    "SubjectService",
    "RoomService",
    "GroupService",
    "ScheduleService",
    "SemesterService",
    "ProfessorContractService",
    "ProfessorWorkloadService",
    "StudyFormService",
    "SubjectAssignmentService",
    "LessonService",
    "AcademicYearService",
    "UniversityHolidayService",
]
