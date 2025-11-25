import React from "react";
import { format } from "date-fns";

export function TimeSlotWrapper({ children, value, resource, isHolidayDate }) {
  // Проверяем, является ли этот слот времени праздничным днем
  const isHoliday = isHolidayDate && value && isHolidayDate(value);

  return (
    <div className={`rbc-time-slot ${isHoliday ? "holiday-slot" : ""}`}>
      {children}
    </div>
  );
}

export function DayColumnWrapper({ children, date, isHolidayDate }) {
  // Проверяем, является ли этот день праздничным
  const isHoliday = isHolidayDate && date && isHolidayDate(date);

  return (
    <div className={`rbc-day-bg ${isHoliday ? "holiday-slot" : ""}`}>
      {children}
    </div>
  );
}
