import React, { createContext, useContext } from "react";
import { useEntityList } from "@/hooks/useEntityList";

/**
 * Контекст для предзагруженных данных расписания
 * Загружает один раз при монтировании страницы редактирования расписания:
 * - Группы (по semester и direction из schedule)
 * - Workloads (все для данного semester, direction)
 * - Комнаты (все)
 * - Праздники (все)
 */
const ScheduleDataContext = createContext(null);

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

  // 4. Праздники - загружаем все
  // Используются для блокировки дат в DatePicker
  const { data: holidaysData, isLoading: isLoadingHolidays } = useEntityList(
    "university_holiday",
    {
      pagination: { loadAll: true },
      // Кешируем на 10 минут - праздники меняются очень редко
      staleTime: 10 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
    }
  );

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

    // Праздники
    holidays: holidaysData?.items || [],
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
