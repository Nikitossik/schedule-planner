import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProtectedFetch } from "@/hooks/useProtectedFetch";

const SchedulePageContext = createContext();

export function SchedulePageProvider({ children, schedule }) {
  const protectedFetch = useProtectedFetch();

  // Основные данные конфликтов
  const { data: conflictsData, isLoading: conflictsLoading } = useQuery({
    queryKey: ["conflicts-summary", schedule?.id],
    queryFn: async () => {
      if (!schedule?.id) return null;

      const queryParams = new URLSearchParams();
      queryParams.append("schedule_id", schedule.id);

      const res = await protectedFetch(
        `http://localhost:8000/api/lesson/conflicts/summary?${queryParams.toString()}`
      );

      if (!res.ok) throw new Error("Failed to fetch conflicts");
      return res.json();
    },
    enabled: !!schedule?.id,
    staleTime: 30000, // Кешируем на 30 секунд
  });

  // Данные предупреждений о превышении часов (объединенные)
  const { data: combinedWarningsData, isLoading: workloadLoading } = useQuery({
    queryKey: ["combined-warnings", schedule?.id],
    queryFn: async () => {
      if (!schedule?.id) return null;

      const res = await protectedFetch(
        `http://localhost:8000/api/professor_workload/warnings/combined/${schedule.id}`
      );

      if (!res.ok) throw new Error("Failed to fetch combined warnings");
      return res.json();
    },
    enabled: !!schedule?.id,
    staleTime: 30000,
  });

  // Получаем группы, задействованные в расписании
  const { data: scheduleGroupsData, isLoading: groupsLoading } = useQuery({
    queryKey: ["schedule-groups", schedule?.id],
    queryFn: async () => {
      if (!schedule?.id) return null;

      const res = await protectedFetch(
        `http://localhost:8000/api/lesson/groups?schedule_id=${schedule.id}`
      );

      if (!res.ok) throw new Error("Failed to fetch schedule groups");
      return res.json();
    },
    enabled: !!schedule?.id,
    staleTime: 60000, // Группы меняются реже
  });

  // Производные данные
  const conflictsSummary = conflictsData || {};
  const { single = [], shared = [], total_conflicts = 0 } = conflictsSummary;

  const professorWarnings = combinedWarningsData?.professor_warnings || [];
  const subjectWarnings = combinedWarningsData?.subject_warnings || [];
  const workloadWarnings = professorWarnings; // Для обратной совместимости
  const totalProfessorWarnings =
    combinedWarningsData?.total_professor_warnings || 0;
  const totalSubjectWarnings =
    combinedWarningsData?.total_subject_warnings || 0;
  const totalWarnings = totalProfessorWarnings + totalSubjectWarnings;

  const scheduleGroups = scheduleGroupsData?.groups || [];
  const groupsInvolved = scheduleGroups; // Алиас для совместимости

  const hasConflicts = total_conflicts > 0;
  const hasWorkloadIssues = totalWarnings > 0;
  const hasIssues = hasConflicts || hasWorkloadIssues;

  const isLoading = conflictsLoading || workloadLoading || groupsLoading;

  const value = {
    // Данные
    schedule,
    conflictsData: conflictsSummary,
    conflicts: conflictsSummary, // Алиас для совместимости
    workloadWarnings, // Для обратной совместимости (только профессора)
    professorWarnings,
    subjectWarnings,
    scheduleGroups,
    groupsInvolved,

    // Производные состояния
    hasConflicts,
    hasWorkloadIssues,
    hasIssues,
    totalConflicts: total_conflicts,
    totalWarnings,
    totalProfessorWarnings,
    totalSubjectWarnings,

    // Загрузка
    isLoading,
    conflictsLoading,
    workloadLoading,
    groupsLoading,

    // Детализированные данные
    singleConflicts: single,
    sharedConflicts: shared,
  };

  return (
    <SchedulePageContext.Provider value={value}>
      {children}
    </SchedulePageContext.Provider>
  );
}

export function useSchedulePageData() {
  const context = useContext(SchedulePageContext);
  if (!context) {
    throw new Error(
      "useSchedulePageData must be used within SchedulePageProvider"
    );
  }
  return context;
}
