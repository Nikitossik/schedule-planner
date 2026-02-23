from __future__ import annotations

from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, Date, Index


class UniversityHoliday(Base):
    
    """
    Represents a university holiday.

    Fields overview:
    - id: numeric primary key.
    - name: human-readable holiday name.
    - is_annual: boolean indicating if the holiday occurs annually.
    - is_date_range: boolean indicating if the holiday spans a date range.
    - date: specific date of the holiday (if not a range).
    - start_date: start date of the holiday (if a range).
    - end_date: end date of the holiday (if a range).
    """
    
    __tablename__ = "university_holiday"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=True)

    is_annual: Mapped[bool] = mapped_column(Boolean, default=False)
    is_date_range: Mapped[bool] = mapped_column(Boolean, default=False)

    date: Mapped[Date] = mapped_column(Date, nullable=True)
    start_date: Mapped[Date] = mapped_column(Date, nullable=True)
    end_date: Mapped[Date] = mapped_column(Date, nullable=True)

    __table_args__ = (
        Index("idx_holiday_date", "date"),
        Index("idx_holiday_range", "start_date", "end_date"),
    )
