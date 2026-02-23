import { useCallback, useMemo } from "react";

export function useUnavailabilityCheck({
  workloads = [],
  selectedWorkloadId,
  selectedDate, 
  selectedDaysOfWeek, 
  daysOfWeek, 
}) {
  
  const selectedDayOfWeek = useMemo(() => {
    if (!selectedDate) return null;
    const date = new Date(selectedDate);
    const day = date.getDay();
    
    return day === 0 ? 6 : day - 1;
  }, [selectedDate]);

  const isProfessorAvailable = useCallback(
    (workload) => {
      if (selectedDayOfWeek === null) return true; 

      const unavailableDays =
        workload?.professor?.professor_profile?.unavailable_days;
      if (!unavailableDays) return true; 

      try {
        const daysArray =
          typeof unavailableDays === "string"
            ? JSON.parse(unavailableDays)
            : unavailableDays;
        return !daysArray.includes(selectedDayOfWeek);
      } catch {
        return true; 
      }
    },
    [selectedDayOfWeek]
  );

  const selectedWorkload = useMemo(() => {
    if (!selectedWorkloadId) return null;
    
    const found = workloads.find((w) => 
      w.id === selectedWorkloadId || 
      w.id.toString() === selectedWorkloadId.toString()
    );
    
    return found || null;
  }, [selectedWorkloadId, workloads]);

  const unavailabilityInfo = useMemo(() => {


    if (!selectedWorkload || !selectedDaysOfWeek?.length) {
      return null;
    }

    const unavailableDays =
      selectedWorkload?.professor?.professor_profile?.unavailable_days;
    if (!unavailableDays) {
      return null;
    }

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

      const result = {
        conflictDays,
        availableDays,
        professorName: `${selectedWorkload.professor.name} ${selectedWorkload.professor.surname}`,
      };

      return result;
    } catch (error) {
      return null;
    }
  }, [selectedWorkload, selectedDaysOfWeek]);

  return {
    isProfessorAvailable,
    unavailabilityInfo,
    selectedDayOfWeek,
  };
}
