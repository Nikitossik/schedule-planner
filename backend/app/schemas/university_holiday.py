from pydantic import BaseModel, ConfigDict, Field, computed_field
from datetime import date as Date
from typing import Optional
from .shared import BaseQueryParams


class UniversityHolidayBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = Field(
        None,
        max_length=255,
        description="Holiday name (optional)",
        examples=["Labor Day", "Christmas Day"],
    )
    is_annual: bool = Field(
        default=False,
        description="True for recurring holidays (same date every year), False for specific one-time dates",
        examples=[True, False],
    )
    date: Date = Field(
        ...,
        description="Date of holiday. For annual holidays, year is ignored (can use any year like 1900)",
        examples=["1900-05-01", "2025-03-15"],
    )


class UniversityHolidayIn(UniversityHolidayBase):
    """Schema for creating a new university holiday"""

    pass


class UniversityHolidayUpdate(BaseModel):
    """Schema for updating a university holiday"""

    model_config = ConfigDict(from_attributes=True)

    name: Optional[str] = Field(
        None,
        max_length=255,
        description="Optional new holiday name",
    )


class UniversityHolidayOut(UniversityHolidayBase):
    """Schema for returning university holiday data"""

    id: int = Field(
        ...,
        description="Unique identifier of the holiday",
        examples=[1, 42],
    )

    # @computed_field
    # @property
    # def display_date(self) -> str:
    #     """Computed field for displaying the holiday date"""
    #     if self.is_annual:
    #         return f"{self.date.day:02d}.{self.date.month:02d} (every year)"
    #     else:
    #         return self.date.strftime("%d.%m.%Y")

    # @computed_field
    # @property
    # def display_name(self) -> str:
    #     """Computed field for displaying the holiday name"""
    #     if self.name:
    #         return self.name
    #     elif self.is_annual:
    #         return "Holiday"
    #     else:
    #         return "Free day"


class UniversityHolidayQueryParams(BaseQueryParams):
    # """Schema for querying university holidays with filters"""

    date_from: Optional[Date] = Field(
        None, description="Filter holidays from this date"
    )
    date_to: Optional[Date] = Field(None, description="Filter holidays to this date")
