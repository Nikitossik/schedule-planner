import { useMemo } from "react";
import { useEntityList } from "@/hooks/useEntityList";
import { useScheduleData } from "@/contexts/ScheduleDataContext";

/**
 * Хук для обработки данных для форм уроков
 * Использует данные из ScheduleDataContext (groups, workloads уже отфильтрованы по study_form)
 * Выполняет минимальную обработку - извлечение assignments и фильтрацию комнат
 */
export function useLessonFilters({
  selectedGroupIds, // Массив выбранных групп
  selectedWorkloadId,
  selectedDate,
  startTime,
  endTime,
  isOnline,
  isEdit,
  currentLessonId,
  initialGroup,
}) {
  // Получаем предзагруженные данные из контекста
  const {
    groups,
    workloads,
    rooms: allRooms,
    expandedHolidays,
    isLoadingGroups,
    isLoadingWorkloads,
    isLoadingRooms,
  } = useScheduleData();

  // Группы и workloads уже отфильтрованы по study_form на бэкенде
  // Не нужно дополнительно фильтровать

  // Получаем выбранные группы для справки
  const selectedGroups = useMemo(() => {
    // Используем selectedGroupIds (всегда массив)
    if (
      selectedGroupIds &&
      Array.isArray(selectedGroupIds) &&
      selectedGroupIds.length > 0
    ) {
      return groups.filter((g) => selectedGroupIds.includes(g.id));
    }

    // При редактировании используем initialGroup если нет выбранных групп
    if (
      isEdit &&
      initialGroup &&
      (!selectedGroupIds || selectedGroupIds.length === 0)
    ) {
      return [initialGroup];
    }

    return [];
  }, [groups, selectedGroupIds, isEdit, initialGroup]);

  // Subject assignments: извлекаем из выбранного workload (уже включены в response)
  const assignments = useMemo(() => {
    if (!selectedWorkloadId) return [];

    const selectedWorkload = workloads.find(
      (w) => w.id === parseInt(selectedWorkloadId)
    );

    return selectedWorkload?.subject_assignments || [];
  }, [workloads, selectedWorkloadId]);

  // Создаем массив функций-матчеров для блокировки праздничных дней в DatePicker
  const disabledDayMatchers = useMemo(() => {
    if (!expandedHolidays || expandedHolidays.length === 0) return [];

    const matchers = [];

    expandedHolidays.forEach((holiday) => {
      const holidayDate = new Date(holiday.date);

      // Для всех праздников создаем матчер для конкретной даты
      // (expanded holidays уже содержат развернутые даты)
      matchers.push(
        (date) =>
          date.getFullYear() === holidayDate.getFullYear() &&
          date.getMonth() === holidayDate.getMonth() &&
          date.getDate() === holidayDate.getDate()
      );
    });

    return matchers;
  }, [expandedHolidays]);

  // Комнаты: фильтруем по доступности
  // Если указаны дата и время - делаем запрос с фильтрами, иначе используем все из контекста
  const shouldFilterRooms = !!(
    selectedDate &&
    startTime &&
    endTime &&
    !isOnline
  );

  const roomFilters = useMemo(() => {
    if (!shouldFilterRooms) return {};

    const filters = {
      available_date: selectedDate,
      available_start_time: startTime,
      available_end_time: endTime,
    };

    // При редактировании исключаем текущий урок
    if (isEdit && currentLessonId) {
      filters.exclude_lesson_id = currentLessonId;
    }

    return filters;
  }, [
    selectedDate,
    startTime,
    endTime,
    isEdit,
    currentLessonId,
    shouldFilterRooms,
  ]);

  // Если нужна фильтрация по доступности - делаем запрос, иначе используем все комнаты
  const { data: filteredRoomsData, isLoading: isLoadingFilteredRooms } =
    useEntityList("room", {
      filters: roomFilters,
      pagination: { loadAll: true },
      enabled: shouldFilterRooms, // Запрос выполняется только если нужна фильтрация
    });

  const rooms = shouldFilterRooms ? filteredRoomsData?.items || [] : allRooms;

  return {
    groups,
    workloads, // Уже отфильтрованы по study_form
    assignments,
    rooms,
    expandedHolidays,
    disabledDayMatchers,
    selectedGroups,
    isLoadingGroups,
    isLoadingWorkloads,
    isLoadingAssignments: isLoadingWorkloads, // Assignments загружаются вместе с workloads
    isLoadingRooms: shouldFilterRooms ? isLoadingFilteredRooms : isLoadingRooms,
  };
}
