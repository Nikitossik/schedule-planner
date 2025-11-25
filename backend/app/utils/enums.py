import enum


class UserRoleEnum(str, enum.Enum):
    admin = "admin"
    coordinator = "coordinator"
    user = "user"


class UserTypeEnum(str, enum.Enum):
    student = "student"
    professor = "professor"


class StudyFormEnum(str, enum.Enum):
    part_time = "part-time"
    full_time = "full-time"


class LessonTypeEnum(str, enum.Enum):
    lecture = "lecture"
    seminar = "seminar"
    lab = "lab"
    practice = "practice"


class SemesterPeriodEnum(str, enum.Enum):
    winter = "winter"
    summer = "summer"


class ExportFormat(str, enum.Enum):
    excel = "excel"
    pdf = "pdf"
