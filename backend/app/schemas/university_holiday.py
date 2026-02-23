from pydantic import BaseModel, ConfigDict, Field, model_validator
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
    is_date_range: bool = Field(
        default=False,
        description="True for holidays spanning a date range, False for single-day holidays",
        examples=[True, False],
    )

    date: Date | None = Field(
        None,
        description="Date of holiday. For annual holidays, year is ignored (can use any year like 1900)",
        examples=["1900-05-01", "2025-03-15"],
    )

    start_date: Optional[Date] = None
    end_date: Optional[Date] = None

    @model_validator(mode="after")
    def validate_dates(self):
        if not self.is_date_range:
            if not self.date:
                raise ValueError("Date is required for single day holidays")

            self.start_date = None
            self.end_date = None

        elif self.is_date_range:
            if not self.start_date or not self.end_date:
                raise ValueError("Start and end dates are required for date ranges")
            if self.end_date <= self.start_date:
                raise ValueError("End date must be after start date")
            self.date = None

        return self


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

    is_date_range: Optional[bool] = None
    is_annual: Optional[bool] = None
    date: Optional[Date] = None
    start_date: Optional[Date] = None
    end_date: Optional[Date] = None

    @model_validator(mode="after")
    def validate_update_dates(self):
        """Validate date fields based on is_date_range and is_annual flags for updates"""
        if not self.is_date_range:
            if self.start_date is not None or self.end_date is not None:
                self.start_date = None
                self.end_date = None

        elif self.is_date_range:
            if self.date is not None:
                self.date = None

            if self.start_date and self.end_date and self.end_date <= self.start_date:
                raise ValueError("End date must be after start date")

        return self


class UniversityHolidayOut(UniversityHolidayBase):
    """Schema for returning university holiday data"""

    id: int = Field(
        ...,
        description="Unique identifier of the holiday",
        examples=[1, 42],
    )


class UniversityHolidayExpandedDate(BaseModel):
    """Schema for expanded holiday date with names"""

    date: Date = Field(
        ...,
        description="Date of the holiday",
        examples=["2024-12-25", "2024-01-01"],
    )
    names: list[str] = Field(
        ...,
        description="List of holiday names for this date",
        examples=[["Christmas Day"], ["New Year", "Day Off"]],
    )


class UniversityHolidayFilters(BaseModel):
    date_from: Optional[Date] = Field(
        None, description="Filter holidays from this date"
    )
    date_to: Optional[Date] = Field(None, description="Filter holidays to this date")


class UniversityHolidayQueryParams(UniversityHolidayFilters, BaseQueryParams):
    pass
