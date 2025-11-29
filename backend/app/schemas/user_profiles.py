from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    model_validator,
    field_serializer,
)
from typing import Annotated
from typing_extensions import Self
from ..utils.enums import UserRoleEnum, UserTypeEnum
from .minis import GroupMiniOut, SemesterMiniOut, AcademicYearMiniOut
from .shared import BaseQueryParams, BaseFilterParams


class StudentProfileBase(BaseModel):
    """
    Base schema for student profile data.
    Captures group association for students.
    """

    model_config = ConfigDict(from_attributes=True)

    group_id: Annotated[
        int,
        Field(
            gt=0,
            description="Identifier of the group the student belongs to.",
            examples=[10],
        ),
    ]


class StudentProfileIn(StudentProfileBase):
    """
    Input schema for student profile nested inside UserIn.
    Captures group association for students.
    """

    pass


class StudentProfileUpdate(BaseModel):
    """
    Partial update schema for student profile; all fields are optional.
    """

    group_id: Annotated[
        int | None,
        Field(
            None,
            gt=0,
            description="Optional new group ID for the student.",
            examples=[12],
        ),
    ]


class StudentProfileOut(BaseModel):
    """
    Student profile projection nested inside UserOut.
    Provides group and derived academic period info.
    """

    group: GroupMiniOut | None = Field(
        default=None,
        description="Mini representation of the student's group.",
        examples=[{"id": 10, "name": "CS-101"}],
    )
    academic_year: AcademicYearMiniOut | None = Field(
        default=None,
        description="Mini representation of the academic year (derived via group).",
        examples=[{"id": 1, "name": "2024-2025"}],
    )
    semester: SemesterMiniOut | None = Field(
        default=None,
        description="Mini representation of the semester (derived via group).",
        examples=[{"id": 2, "name": "Fall 2024"}],
    )


class ProfessorProfileBase(BaseModel):
    """
    Base schema for professor profile data.
    Reserved for future professor-specific fields.
    """

    model_config = ConfigDict(from_attributes=True)

    notes: str | None = Field(
        default=None,
        description="Optional notes about the professor.",
        examples=["Experienced in AI and machine learning."],
    )


class ProfessorProfileIn(ProfessorProfileBase):
    """
    Input schema for professor profile nested inside UserIn.
    """

    pass


class ProfessorProfileUpdate(ProfessorProfileBase):
    """
    Partial update schema for professor profile; all fields are optional.
    """

    pass


class ProfessorProfileOut(ProfessorProfileBase):
    """
    Professor profile projection nested inside UserOut.
    Reserved for future professor-specific fields.
    """

    pass
