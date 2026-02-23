from pydantic import BaseModel, ConfigDict, Field
from .shared import BaseQueryParams
from ..utils.enums import StudyFormEnum
from .minis import DirectionMiniOut


class StudyFormBase(BaseModel):
    """
    Base schema for StudyForm data shared by input/output models.
    Describes a study format (e.g., full-time, part-time) linked to a Direction.
    """

    model_config = ConfigDict(from_attributes=True)

    form: StudyFormEnum = Field(
        ...,
        description="Study format value (enum).",
        examples=["full-time"],
    )
    direction_id: int = Field(
        gt=0,
        description="ID of the direction this study form belongs to.",
        examples=[3],
    )


class StudyFormIn(StudyFormBase):
    """Input schema for creating a StudyForm."""

    pass


class StudyFormUpdate(BaseModel):
    """Partial update schema for StudyForm; all fields are optional."""

    form: StudyFormEnum | None = Field(
        None,
        description="Optional new study format value.",
        examples=["part-time"],
    )
    direction_id: int | None = Field(
        None,
        gt=0,
        description="Optional new direction ID.",
        examples=[4],
    )


class StudyFormOut(BaseModel):
    """Output schema for StudyForm including identifier and owning direction."""

    id: int = Field(
        ...,
        description="Unique identifier of the study form.",
        examples=[2],
    )
    form: StudyFormEnum = Field(
        ...,
        description="Study format value (enum).",
        examples=["full-time"],
    )
    direction: DirectionMiniOut = Field(
        ...,
        description="Mini representation of the owning direction.",
        examples=[{"id": 3, "name": "Computer Science", "code": "CS-01"}],
    )


class StudyFormFilters(BaseModel):
    """Filtering parameters for study forms (reserved for future use)."""

    pass


class StudyFormQueryParams(BaseQueryParams, StudyFormFilters):
    """Query parameters combining pagination/sorting with study form filters."""

    pass
