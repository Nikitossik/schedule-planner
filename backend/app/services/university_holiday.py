from sqlalchemy.orm import Session
from datetime import date, timedelta
from typing import List, Dict
from collections import defaultdict

from ..repositories import UniversityHolidayRepository
from ..models import UniversityHoliday
from ..schemas.university_holiday import (
    UniversityHolidayIn,
    UniversityHolidayQueryParams,
)

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

    def get_expanded_holiday_dates(
        self, start_date: date, end_date: date
    ) -> List[Dict]:
        params = UniversityHolidayQueryParams(
            date_from=start_date, date_to=end_date, loadAll=True
        )

        query = self.db.query(UniversityHoliday)
        query = self.apply_filters(query, params)

        holidays = query.all()

        date_names_map = defaultdict(list)
        all_holiday_dates = set()

        for holiday in holidays:
            expanded_dates = self._expand_holiday_dates(holiday, start_date, end_date)

            for holiday_date in expanded_dates:
                
                all_holiday_dates.add(holiday_date)
                
                if holiday.name and holiday.name.strip():
                    date_names_map[holiday_date].append(holiday.name.strip())

        result = []
        for holiday_date in sorted(all_holiday_dates):
            unique_names = list(dict.fromkeys(date_names_map[holiday_date]))
            result.append({"date": holiday_date, "names": unique_names})

        return result

    def get_expanded_holiday_dates_paginated(
        self, start_date: date, end_date: date
    ) -> Dict:
        """
        Returns expanded holiday dates in the PaginatedResponse format
        for use in the API endpoint.
        """
        expanded_dates = self.get_expanded_holiday_dates(start_date, end_date)

        return {
            "page": 1,
            "page_size": len(expanded_dates),
            "total": len(expanded_dates),
            "items": expanded_dates,
        }

    def _expand_holiday_dates(
        self, holiday: UniversityHoliday, start_date: date, end_date: date
    ) -> List[date]:
        if holiday.is_date_range:
            return self._expand_date_range(holiday, start_date, end_date)
        else:
            return self._expand_single_day(holiday, start_date, end_date)

    def _expand_single_day(
        self, holiday: UniversityHoliday, start_date: date, end_date: date
    ) -> List[date]:
        dates: List[date] = []

        if not holiday.date:
            return dates

        if holiday.is_annual:
            start_year = start_date.year
            end_year = end_date.year

            for year in range(start_year, end_year + 1):
                try:
                    annual_date = date(year, holiday.date.month, holiday.date.day)
                    if start_date <= annual_date <= end_date:
                        dates.append(annual_date)
                except ValueError:
                    pass
        else:
            if start_date <= holiday.date <= end_date:
                dates.append(holiday.date)

        return dates

    def _expand_date_range(
        self, holiday: UniversityHoliday, start_date: date, end_date: date
    ) -> List[date]:
        dates: List[date] = []

        if not holiday.start_date or not holiday.end_date:
            return dates

        if holiday.is_annual:
            start_year = start_date.year
            end_year = end_date.year

            for year in range(start_year, end_year + 1):
                try:
                    annual_start = date(
                        year, holiday.start_date.month, holiday.start_date.day
                    )
                    annual_end = date(
                        year, holiday.end_date.month, holiday.end_date.day
                    )

                    range_start = max(annual_start, start_date)
                    range_end = min(annual_end, end_date)

                    if range_start <= range_end:
                        current = range_start
                        while current <= range_end:
                            dates.append(current)
                            current += timedelta(days=1)
                except ValueError:
                    pass
        else:
            range_start = max(holiday.start_date, start_date)
            range_end = min(holiday.end_date, end_date)

            if range_start <= range_end:
                current = range_start
                while current <= range_end:
                    dates.append(current)
                    current += timedelta(days=1)

        return dates

    def apply_filters(self, query, params):
        """
        Apply filters for university holidays.

        Returns all records from university_holiday that may fall
        within the specified date range, including annual holidays.
        """

        # Date range filtering
        if hasattr(params, "date_from") and (params.date_from or params.date_to):
            from sqlalchemy import and_, or_

            date_from = params.date_from
            date_to = params.date_to

            conditions = []

            if date_from and date_to:
                # 1. Annual holidays - only those that may fall within the period
                from sqlalchemy import extract

                # For annual single day
                annual_single_condition = and_(
                    UniversityHoliday.is_annual == True,
                    UniversityHoliday.is_date_range == False,
                    UniversityHoliday.date.isnot(None),
                    or_(
                        # If the period is within the same year
                        and_(
                            date_from.year == date_to.year,
                            or_(
                                # Month between start and end
                                and_(
                                    extract("month", UniversityHoliday.date)
                                    > date_from.month,
                                    extract("month", UniversityHoliday.date)
                                    < date_to.month,
                                ),
                                # In the start month, but day fits
                                and_(
                                    extract("month", UniversityHoliday.date)
                                    == date_from.month,
                                    extract("day", UniversityHoliday.date)
                                    >= date_from.day,
                                ),
                                # In the end month, but day fits
                                and_(
                                    extract("month", UniversityHoliday.date)
                                    == date_to.month,
                                    extract("day", UniversityHoliday.date)
                                    <= date_to.day,
                                ),
                            ),
                        ),
                        # If the period spans years
                        and_(
                            date_from.year != date_to.year,
                            or_(
                                # After the start of the period
                                extract("month", UniversityHoliday.date)
                                >= date_from.month,
                                # Before the end of the period
                                extract("month", UniversityHoliday.date)
                                <= date_to.month,
                            ),
                        ),
                    ),
                )
                conditions.append(annual_single_condition)

                # For annual date range - check more precise intersection
                annual_range_condition = and_(
                    UniversityHoliday.is_annual == True,
                    UniversityHoliday.is_date_range == True,
                    UniversityHoliday.start_date.isnot(None),
                    UniversityHoliday.end_date.isnot(None),
                    or_(
                        # If the period is within the same year - simple check
                        and_(
                            date_from.year == date_to.year,
                            or_(
                                # Start of annual falls within the period
                                and_(
                                    extract("month", UniversityHoliday.start_date)
                                    >= date_from.month,
                                    extract("month", UniversityHoliday.start_date)
                                    <= date_to.month,
                                ),
                                # End of annual falls within the period
                                and_(
                                    extract("month", UniversityHoliday.end_date)
                                    >= date_from.month,
                                    extract("month", UniversityHoliday.end_date)
                                    <= date_to.month,
                                ),
                                # Annual covers the entire period
                                and_(
                                    extract("month", UniversityHoliday.start_date)
                                    <= date_from.month,
                                    extract("month", UniversityHoliday.end_date)
                                    >= date_to.month,
                                ),
                            ),
                        ),
                        # If the period spans years - take all annual in the required months
                        and_(
                            date_from.year != date_to.year,
                            or_(
                                # Month greater than or equal to the start of the period
                                extract("month", UniversityHoliday.start_date)
                                >= date_from.month,
                                extract("month", UniversityHoliday.end_date)
                                >= date_from.month,
                                # Month less than or equal to the end of the period
                                extract("month", UniversityHoliday.start_date)
                                <= date_to.month,
                                extract("month", UniversityHoliday.end_date)
                                <= date_to.month,
                            ),
                        ),
                    ),
                )
                conditions.append(annual_range_condition)

                # 2. Regular single days within the range
                single_day_condition = and_(
                    UniversityHoliday.is_date_range == False,
                    UniversityHoliday.is_annual == False,
                    UniversityHoliday.date.isnot(None),
                    UniversityHoliday.date >= date_from,
                    UniversityHoliday.date <= date_to,
                )
                conditions.append(single_day_condition)

                # 3. Regular date ranges that intersect with the requested period
                date_range_condition = and_(
                    UniversityHoliday.is_date_range == True,
                    UniversityHoliday.is_annual == False,
                    UniversityHoliday.start_date.isnot(None),
                    UniversityHoliday.end_date.isnot(None),
                    # Range intersection: start1 <= end2 AND end1 >= start2
                    UniversityHoliday.start_date <= date_to,
                    UniversityHoliday.end_date >= date_from,
                )
                conditions.append(date_range_condition)

            elif date_from:
                # Only start date
                annual_condition = UniversityHoliday.is_annual == True
                conditions.append(annual_condition)

                single_day_condition = and_(
                    UniversityHoliday.is_date_range == False,
                    UniversityHoliday.is_annual == False,
                    UniversityHoliday.date.isnot(None),
                    UniversityHoliday.date >= date_from,
                )
                conditions.append(single_day_condition)

                date_range_condition = and_(
                    UniversityHoliday.is_date_range == True,
                    UniversityHoliday.is_annual == False,
                    UniversityHoliday.end_date.isnot(None),
                    UniversityHoliday.end_date >= date_from,
                )
                conditions.append(date_range_condition)

            elif date_to:
                # Only end date
                annual_condition = UniversityHoliday.is_annual == True
                conditions.append(annual_condition)

                single_day_condition = and_(
                    UniversityHoliday.is_date_range == False,
                    UniversityHoliday.is_annual == False,
                    UniversityHoliday.date.isnot(None),
                    UniversityHoliday.date <= date_to,
                )
                conditions.append(single_day_condition)

                date_range_condition = and_(
                    UniversityHoliday.is_date_range == True,
                    UniversityHoliday.is_annual == False,
                    UniversityHoliday.start_date.isnot(None),
                    UniversityHoliday.start_date <= date_to,
                )
                conditions.append(date_range_condition)

            if conditions:
                query = query.filter(or_(*conditions))

        return super().apply_filters(query, params)
