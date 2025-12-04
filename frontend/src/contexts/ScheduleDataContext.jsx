import React, { createContext, useContext, useMemo } from "react";
import { useEntityList } from "@/hooks/useEntityList";
import { format } from "date-fns";

/**
 * Контекст для предзагруженных данных расписания
 * Загружает один раз при монтировании страницы редактирования расписания:
 * - Группы (по semester и direction из schedule)
 * - Workloads (все для данного semester, direction)
 * - Комнаты (все)
 * - Праздники (все)
 */
export const ScheduleDataContext = createContext(null);

export function ScheduleDataProvider({ schedule, children }) {
  // 1. Группы - фильтруем по semester и direction из расписания
  const { data: groupsData, isLoading: isLoadingGroups } = useEntityList(
    "group",
    {
      filters: schedule
        ? {
            semester_ids: [schedule.semester.id],
            direction_ids: [schedule.direction.id],
          }
        : {},
      pagination: { loadAll: true },
      // Кешируем на 5 минут - группы редко меняются
      staleTime: 5 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );

  // 2. Workloads - загружаем все для semester и direction
  // Будем фильтровать по study_form на клиенте
  const { data: workloadsData, isLoading: isLoadingWorkloads } = useEntityList(
    "professor_workload",
    {
      filters: schedule
        ? {
            semester_ids: [schedule.semester.id],
            direction_ids: [schedule.direction.id],
          }
        : {},
      pagination: { loadAll: true },
      // Кешируем на 3 минуты - могут обновляться при добавлении assignments
      staleTime: 3 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );

  // 3. Комнаты - загружаем все
  // Будем фильтровать по доступности на клиенте или делать отдельный запрос
  const { data: roomsData, isLoading: isLoadingRooms } = useEntityList("room", {
    pagination: { loadAll: true },
    // Кешируем на 5 минут - комнаты редко меняются
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });

  // 4. Праздники - загружаем развернутые даты для периода семестра
  // Используем новый expanded endpoint для получения всех дат с именами
  const semesterStart = schedule?.semester?.start_date;
  const semesterEnd = schedule?.semester?.end_date;

  const { data: expandedHolidaysData, isLoading: isLoadingHolidays } =
    useEntityList("university_holiday/expanded", {
      enabled: !!(semesterStart && semesterEnd),
      filters:
        semesterStart && semesterEnd
          ? {
              start_date: semesterStart,
              end_date: semesterEnd,
            }
          : {},
      pagination: { loadAll: true },
    });

  // Отладочная информация для праздников
  console.log("DEBUG ScheduleDataContext holidays:", {
    semesterStart,
    semesterEnd,
    expandedHolidaysData,
    isLoadingHolidays,
    enabled: !!(semesterStart && semesterEnd),
  });
  console.log("🎉 Type check - isArray:", Array.isArray(expandedHolidaysData));
  console.log(
    "🎉 Final expandedHolidays:",
    Array.isArray(expandedHolidaysData)
      ? expandedHolidaysData
      : expandedHolidaysData?.items || []
  );

  // Создаем удобную функцию для фильтрации праздников по дате
  const filterHolidaysByDateRange = useMemo(() => {
    return (startDate, endDate) => {
      const holidays = expandedHolidaysData?.items || [];
      if (!holidays.length || !startDate || !endDate) return [];

      const startStr = format(new Date(startDate), "yyyy-MM-dd");
      const endStr = format(new Date(endDate), "yyyy-MM-dd");

      return holidays.filter((holiday) => {
        const holidayDate = holiday.date;
        return holidayDate >= startStr && holidayDate <= endStr;
      });
    };
  }, [expandedHolidaysData]);

  const value = {
    // Данные расписания
    schedule,

    // Группы
    groups: groupsData?.items || [],
    isLoadingGroups,

    // Workloads со всеми subject_assignments
    workloads: workloadsData?.items || [],
    isLoadingWorkloads,

    // Комнаты
    rooms: roomsData?.items || [],
    isLoadingRooms,

    // Праздники (развернутые даты с именами)
    // expanded endpoint возвращает пагинированный ответ с items
    expandedHolidays: expandedHolidaysData?.items || [],
    filterHolidaysByDateRange,
    isLoadingHolidays,

    // Общий статус загрузки
    isLoading:
      isLoadingGroups ||
      isLoadingWorkloads ||
      isLoadingRooms ||
      isLoadingHolidays,
  };

  return (
    <ScheduleDataContext.Provider value={value}>
      {children}
    </ScheduleDataContext.Provider>
  );
}

/**
 * Хук для получения предзагруженных данных расписания
 */
export function useScheduleData() {
  const context = useContext(ScheduleDataContext);

  if (!context) {
    throw new Error("useScheduleData must be used within ScheduleDataProvider");
  }

  return context;
}
