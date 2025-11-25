from __future__ import annotations

from ..database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Boolean, Date


class UniversityHoliday(Base):
    __tablename__ = "university_holiday"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(255), nullable=True)
    is_annual: Mapped[bool] = mapped_column(Boolean, default=False)
    date: Mapped[Date] = mapped_column(Date, nullable=False)
