from sqlalchemy.orm import Session

from ..repositories import UniversityHolidayRepository
from ..models import UniversityHoliday
from ..schemas.university_holiday import UniversityHolidayIn
from .base import BaseService


class UniversityHolidayService(BaseService[UniversityHoliday, UniversityHolidayIn]):
    """
    Service layer for UniversityHoliday domain logic.

    Responsibilities:
    - Provide listing with rich filtering across related entities (semester, academic year, direction, faculty, study form).
    - Delegate CRUD operations to UniversityHolidayRepository via BaseService.
    """

    def __init__(self, db: Session):
        """
        Initialize the UniversityHoliday service.

        Args:
            db (Session): Active SQLAlchemy session.
        """
        super().__init__(db, UniversityHoliday, UniversityHolidayRepository(db))

    def apply_filters(self, query, params):
        """
        Apply filters for university holidays including date range filtering.

        For date_from and date_to parameters:
        - Non-annual holidays: filter by exact date in range
        - Annual holidays: include if day/month falls within the date range (any year)
        """

        # Date range filtering
        if params.date_from or params.date_to:
            from sqlalchemy import and_, or_, extract

            if params.date_from and params.date_to:
                # Both dates provided - range filtering
                date_from = params.date_from
                date_to = params.date_to

                # Non-annual holidays: simple date range
                non_annual_filter = and_(
                    ~UniversityHoliday.is_annual,
                    UniversityHoliday.date >= date_from,
                    UniversityHoliday.date <= date_to,
                )

                # Annual holidays: check if month/day falls within range
                annual_filter = and_(
                    UniversityHoliday.is_annual,
                    or_(
                        # Same month and day range
                        and_(
                            extract("month", UniversityHoliday.date) == date_from.month,
                            extract("month", UniversityHoliday.date) == date_to.month,
                            extract("day", UniversityHoliday.date) >= date_from.day,
                            extract("day", UniversityHoliday.date) <= date_to.day,
                        ),
                        # Different months - include all days in start month after start_day
                        and_(
                            extract("month", UniversityHoliday.date) == date_from.month,
                            extract("month", UniversityHoliday.date) < date_to.month,
                            extract("day", UniversityHoliday.date) >= date_from.day,
                        ),
                        # Different months - include all days in end month before end_day
                        and_(
                            extract("month", UniversityHoliday.date) == date_to.month,
                            extract("month", UniversityHoliday.date) > date_from.month,
                            extract("day", UniversityHoliday.date) <= date_to.day,
                        ),
                        # Months completely between start and end
                        and_(
                            extract("month", UniversityHoliday.date) > date_from.month,
                            extract("month", UniversityHoliday.date) < date_to.month,
                        ),
                    ),
                )

                query = query.filter(or_(non_annual_filter, annual_filter))

            elif params.date_from:
                # Only start date - filter from that date onwards
                date_from = params.date_from

                non_annual_filter = and_(
                    ~UniversityHoliday.is_annual, UniversityHoliday.date >= date_from
                )

                annual_filter = and_(
                    UniversityHoliday.is_annual,
                    or_(
                        extract("month", UniversityHoliday.date) > date_from.month,
                        and_(
                            extract("month", UniversityHoliday.date) == date_from.month,
                            extract("day", UniversityHoliday.date) >= date_from.day,
                        ),
                    ),
                )

                query = query.filter(or_(non_annual_filter, annual_filter))

            elif params.date_to:
                # Only end date - filter up to that date
                date_to = params.date_to

                non_annual_filter = and_(
                    ~UniversityHoliday.is_annual, UniversityHoliday.date <= date_to
                )

                annual_filter = and_(
                    UniversityHoliday.is_annual,
                    or_(
                        extract("month", UniversityHoliday.date) < date_to.month,
                        and_(
                            extract("month", UniversityHoliday.date) == date_to.month,
                            extract("day", UniversityHoliday.date) <= date_to.day,
                        ),
                    ),
                )

                query = query.filter(or_(non_annual_filter, annual_filter))

        return super().apply_filters(query, params)
