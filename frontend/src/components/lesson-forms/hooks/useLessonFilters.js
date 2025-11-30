import { useMemo } from "react";
import { useEntityList } from "@/hooks/useEntityList";
import { useScheduleData } from "@/contexts/ScheduleDataContext";

/**
 * Хук для фильтрации предзагруженных данных для форм уроков
 * Использует данные из ScheduleDataContext (groups, workloads, rooms, holidays)
 * и фильтрует их на клиенте в зависимости от выбора пользователя
 */
export function useLessonFilters({
  selectedGroupId,
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
    groups: allGroups,
    workloads: allWorkloads,
    rooms: allRooms,
    holidays,
    isLoadingGroups,
    isLoadingWorkloads,
    isLoadingRooms,
  } = useScheduleData();

  // Группы уже отфильтрованы по semester и direction в контексте
  const groups = allGroups;

  // Получаем выбранную группу для фильтрации workloads
  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === parseInt(selectedGroupId)),
    [groups, selectedGroupId]
  );

  // Фильтруем workloads по study_form выбранной группы
  const workloads = useMemo(() => {
    // При редактировании используем группу урока, при создании - выбранную пользователем
    const targetGroup = selectedGroup || (isEdit && initialGroup);

    // Если нет группы - возвращаем все workloads
    if (!targetGroup?.study_form?.form) {
      return allWorkloads;
    }

    // Фильтруем по study_form
    return allWorkloads.filter(
      (w) => w.study_form?.form === targetGroup.study_form.form
    );
  }, [allWorkloads, selectedGroup, isEdit, initialGroup]);

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
    if (!holidays || holidays.length === 0) return [];

    const matchers = [];

    holidays.forEach((holiday) => {
      const holidayDate = new Date(holiday.date);

      if (holiday.is_annual) {
        // Для ежегодных праздников создаем матчер, который проверяет день и месяц
        matchers.push(
          (date) =>
            date.getMonth() === holidayDate.getMonth() &&
            date.getDate() === holidayDate.getDate()
        );
      } else {
        // Для обычных праздников создаем матчер для конкретной даты
        matchers.push(
          (date) =>
            date.getFullYear() === holidayDate.getFullYear() &&
            date.getMonth() === holidayDate.getMonth() &&
            date.getDate() === holidayDate.getDate()
        );
      }
    });

    return matchers;
  }, [holidays]);

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
    workloads,
    assignments,
    rooms,
    holidays,
    disabledDayMatchers,
    selectedGroup,
    isLoadingGroups,
    isLoadingWorkloads,
    isLoadingAssignments: isLoadingWorkloads, // Assignments загружаются вместе с workloads
    isLoadingRooms: shouldFilterRooms ? isLoadingFilteredRooms : isLoadingRooms,
  };
}
