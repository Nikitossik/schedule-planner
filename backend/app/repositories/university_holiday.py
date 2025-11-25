from .base import BaseRepository
from ..models.university_holiday import UniversityHoliday


class UniversityHolidayRepository(BaseRepository):
    model = UniversityHoliday
