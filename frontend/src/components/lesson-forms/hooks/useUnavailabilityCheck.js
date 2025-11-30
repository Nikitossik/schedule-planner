import { useCallback, useMemo } from "react";

/**
 * Хук для проверки доступности профессора
 */
export function useUnavailabilityCheck({
  workloads = [],
  selectedWorkloadId,
  selectedDate, // для LessonForm
  selectedDaysOfWeek, // для RecurringLessonForm
  daysOfWeek, // для RecurringLessonForm
}) {
  // Получаем день недели из выбранной даты (0 = Monday, 6 = Sunday)
  const selectedDayOfWeek = useMemo(() => {
    if (!selectedDate) return null;
    const date = new Date(selectedDate);
    const day = date.getDay();
    // Преобразуем из JS формата (0=Sunday) в наш формат (0=Monday)
    return day === 0 ? 6 : day - 1;
  }, [selectedDate]);

  // Функция для проверки доступности профессора в выбранный день (для LessonForm)
  const isProfessorAvailable = useCallback(
    (workload) => {
      if (selectedDayOfWeek === null) return true; // Если дата не выбрана, показываем всех

      const unavailableDays =
        workload?.professor?.professor_profile?.unavailable_days;
      if (!unavailableDays) return true; // Если нет данных о недоступности, профессор доступен

      try {
        const daysArray =
          typeof unavailableDays === "string"
            ? JSON.parse(unavailableDays)
            : unavailableDays;
        return !daysArray.includes(selectedDayOfWeek);
      } catch {
        return true; // В случае ошибки парсинга считаем профессора доступным
      }
    },
    [selectedDayOfWeek]
  );

  // Получаем выбранный workload
  const selectedWorkload = useMemo(() => {
    if (!selectedWorkloadId) return null;
    return workloads.find((w) => w.id.toString() === selectedWorkloadId);
  }, [selectedWorkloadId, workloads]);

  // Вычисляем конфликтующие дни (для RecurringLessonForm)
  const unavailabilityInfo = useMemo(() => {
    if (!selectedWorkload || !selectedDaysOfWeek?.length) return null;

    const unavailableDays =
      selectedWorkload?.professor?.professor_profile?.unavailable_days;
    if (!unavailableDays) return null;

    try {
      const unavailableDaysArray =
        typeof unavailableDays === "string"
          ? JSON.parse(unavailableDays)
          : unavailableDays;

      const conflictDays = selectedDaysOfWeek.filter((day) =>
        unavailableDaysArray.includes(day)
      );

      if (conflictDays.length === 0) return null;

      const availableDays = selectedDaysOfWeek.filter(
        (day) => !unavailableDaysArray.includes(day)
      );

      return {
        conflictDays,
        availableDays,
        professorName: `${selectedWorkload.professor.name} ${selectedWorkload.professor.surname}`,
      };
    } catch {
      return null;
    }
  }, [selectedWorkload, selectedDaysOfWeek]);

  return {
    isProfessorAvailable,
    unavailabilityInfo,
    selectedDayOfWeek,
  };
}
