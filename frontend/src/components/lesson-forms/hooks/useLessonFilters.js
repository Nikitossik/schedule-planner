import { useMemo } from "react";
import { useEntityList } from "@/hooks/useEntityList";
import { useScheduleData } from "@/contexts/ScheduleDataContext";

export function useLessonFilters({
  selectedGroupIds, 
  selectedWorkloadId,
  selectedDate,
  startTime,
  endTime,
  isOnline,
  isEdit,
  currentLessonId,
  initialGroup,
}) {
  
  const {
    groups,
    workloads,
    rooms: allRooms,
    expandedHolidays,
    isLoadingGroups,
    isLoadingWorkloads,
    isLoadingRooms,
  } = useScheduleData();


  const selectedGroups = useMemo(() => {
    if (
      selectedGroupIds &&
      Array.isArray(selectedGroupIds) &&
      selectedGroupIds.length > 0
    ) {
      return groups.filter((g) => selectedGroupIds.includes(g.id));
    }

    if (
      isEdit &&
      initialGroup &&
      (!selectedGroupIds || selectedGroupIds.length === 0)
    ) {
      return [initialGroup];
    }

    return [];
  }, [groups, selectedGroupIds, isEdit, initialGroup]);

  const assignments = useMemo(() => {
    if (!selectedWorkloadId) return [];

    const selectedWorkload = workloads.find(
      (w) => w.id === parseInt(selectedWorkloadId)
    );

    return selectedWorkload?.subject_assignments || [];
  }, [workloads, selectedWorkloadId]);

  const disabledDayMatchers = useMemo(() => {
    if (!expandedHolidays || expandedHolidays.length === 0) return [];

    const matchers = [];

    expandedHolidays.forEach((holiday) => {
      const holidayDate = new Date(holiday.date);

      matchers.push(
        (date) =>
          date.getFullYear() === holidayDate.getFullYear() &&
          date.getMonth() === holidayDate.getMonth() &&
          date.getDate() === holidayDate.getDate()
      );
    });

    return matchers;
  }, [expandedHolidays]);

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

  const { data: filteredRoomsData, isLoading: isLoadingFilteredRooms } =
    useEntityList("room", {
      filters: roomFilters,
      pagination: { loadAll: true },
      enabled: shouldFilterRooms, 
    });

  const rooms = shouldFilterRooms ? filteredRoomsData?.items || [] : allRooms;

  return {
    groups,
    workloads, 
    assignments,
    rooms,
    expandedHolidays,
    disabledDayMatchers,
    selectedGroups,
    isLoadingGroups,
    isLoadingWorkloads,
    isLoadingAssignments: isLoadingWorkloads, 
    isLoadingRooms: shouldFilterRooms ? isLoadingFilteredRooms : isLoadingRooms,
  };
}
