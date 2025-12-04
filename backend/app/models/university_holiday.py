from __future__ import annotations

from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, Date, Index


class UniversityHoliday(Base):
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
