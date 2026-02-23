from pydantic import BaseModel, ConfigDict, Field, field_validator
from .shared import BaseQueryParams, BaseFilterParams
from .minis import FacultyMiniOut, StudyFormMiniOut


class DirectionBase(BaseModel):
    """
    Base schema for Direction data shared by input/output models.
    Contains core identity fields of the academic direction/program.
    """

    model_config = ConfigDict(from_attributes=True)

    name: str = Field(
        max_length=100,
        description="Human-readable direction/program name.",
        examples=["Computer Science"],
    )
    code: str = Field(
        max_length=20,
        description="Unique direction/program code.",
        examples=["CS-01"],
    )


class DirectionIn(DirectionBase):
    """
    Input schema for creating a new Direction.
    Includes faculty linkage and available study forms.
    """

    faculty_id: int = Field(
        description="Identifier of the faculty owning this direction.",
        examples=[3],
    )
    has_full_time: bool = Field(
        default=True,
        description="Whether the direction has a full-time (day) study form.",
        examples=[True],
    )
    has_part_time: bool = Field(
        default=False,
        description="Whether the direction has a part-time (evening/weekend) study form.",
        examples=[False],
    )

    @field_validator("has_full_time", "has_part_time")
    @classmethod
    def at_least_one_study_form(cls, v, info):
        """
        Ensure at least one study form is enabled.

        Args:
            v: Current field value being validated.
            info: FieldValidationInfo with access to other provided values.

        Returns:
            The original value if validation passes.

        Raises:
            ValueError: If both has_full_time and has_part_time are False.
        """
        values = info.data
        if "has_full_time" in values and "has_part_time" in values:
            if not values["has_full_time"] and not values["has_part_time"]:
                raise ValueError("Direction must have at least one study form")
        return v


class DirectionUpdate(BaseModel):
    """
    Partial update schema for Direction; all fields are optional.
    """

    name: str | None = Field(
        None,
        max_length=100,
        description="Optional new program name.",
        examples=["Applied Mathematics"],
    )
    code: str | None = Field(
        None,
        max_length=20,
        description="Optional new program code.",
        examples=["AM-02"],
    )


class DirectionOut(DirectionBase):
    """
    Output schema for Direction including identifiers and related mini resources.
    """

    id: int = Field(
        ...,
        description="Unique identifier of the direction.",
        examples=[12],
    )
    faculty: FacultyMiniOut = Field(
        description="Owning faculty (mini representation).",
        examples=[{"id": 3, "name": "Engineering"}],
    )
    study_forms: list[StudyFormMiniOut] = Field(
        serialization_alias="forms",
        description="Available study forms for this direction.",
        examples=[[{"id": 1, "form": "full-time"}, {"id": 2, "form": "part-time"}]],
    )


class DirectionFilters(BaseFilterParams):
    """
    Filter parameters for listing directions.
    """

    faculty_ids: list[int] | None = Field(
        default=[],
        description="Filter by one or more faculty IDs.",
        examples=[[1, 3]],
    )
    study_forms: list[str] | None = Field(
        default=[],
        description="Filter by study form values (e.g., full-time, part-time).",
        examples=[["full-time"]],
    )


class DirectionQueryParams(BaseQueryParams, DirectionFilters):
    """
    Query parameters combining pagination/sorting with direction filters.
    """

    pass
