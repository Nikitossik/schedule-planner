import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProtectedFetch } from "@/hooks/useProtectedFetch";

const ScheduleAnalysisContext = createContext();

export function ScheduleAnalysisProvider({ children, schedule }) {
  const protectedFetch = useProtectedFetch();

  // Получаем полный анализ расписания (конфликты + предупреждения о нагрузке)
  const { data: analysisData, isLoading: analysisLoading } = useQuery({
    queryKey: ["schedule-analysis", schedule?.id],
    queryFn: async () => {
      if (!schedule?.id) return null;

      const res = await protectedFetch(
        `http://localhost:8000/api/schedule/${schedule.id}/analysis`
      );

      if (!res.ok) throw new Error("Failed to fetch schedule analysis");
      return res.json();
    },
    enabled: !!schedule?.id,
    staleTime: 30000, // Кешируем на 30 секунд
  });

  // Используем данные напрямую с бэкенда без лишних трансформаций
  const timeConflicts = analysisData?.time_conflicts || {};
  const workloadIssues = analysisData?.workload_issues || {};

  // Прямые ссылки на данные с бэкенда
  const roomConflicts = timeConflicts.room_conflicts || {};
  const professorConflicts = timeConflicts.professor_conflicts || {};
  const groupConflicts = timeConflicts.group_conflicts || {};

  // Счетчики напрямую с бэкенда
  const totalConflicts = timeConflicts.total_conflicts || 0;
  const totalSingleScheduleConflicts = timeConflicts.total_single_schedule || 0;
  const totalCrossScheduleConflicts = timeConflicts.total_cross_schedule || 0;

  // Предупреждения напрямую с бэкенда
  const professorWarnings = workloadIssues.professor_overloads || [];
  const subjectWarnings = workloadIssues.subject_overallocations || [];
  const totalProfessorWarnings = workloadIssues.total_professor_overloads || 0;
  const totalSubjectWarnings =
    workloadIssues.total_subject_overallocations || 0;
  const totalWorkloadIssues = workloadIssues.total_workload_issues || 0;

  // Состояния на основе счетчиков с бэкенда
  const hasConflicts = totalConflicts > 0;
  const hasWorkloadIssues = totalWorkloadIssues > 0;
  const hasIssues = hasConflicts || hasWorkloadIssues;
  const hasCriticalIssues = totalCrossScheduleConflicts > 0;

  const isLoading = analysisLoading;

  const value = {
    // Основные данные
    schedule,
    analysisData,

    // Структурированные данные с бэкенда
    timeConflicts,
    workloadIssues,
    roomConflicts,
    professorConflicts,
    groupConflicts,

    // Предупреждения о нагрузке
    professorWarnings,
    subjectWarnings,
    workloadWarnings: professorWarnings, // Алиас для обратной совместимости

    // Группы из расписания
    scheduleGroups: schedule?.groups || [],
    groupsInvolved: schedule?.groups || [], // Алиас

    // Состояния и счетчики
    hasConflicts,
    hasWorkloadIssues,
    hasIssues,
    hasCriticalIssues,
    totalConflicts,
    totalSingleScheduleConflicts,
    totalCrossScheduleConflicts,
    totalWarnings: totalWorkloadIssues,
    totalWorkloadIssues,
    totalProfessorWarnings,
    totalSubjectWarnings,

    // Загрузка
    isLoading: analysisLoading,
    analysisLoading,
    conflictsLoading: analysisLoading, // Алиас для обратной совместимости
    workloadLoading: analysisLoading, // Алиас для обратной совместимости
    groupsLoading: false,
  };

  return (
    <ScheduleAnalysisContext.Provider value={value}>
      {children}
    </ScheduleAnalysisContext.Provider>
  );
}

export function useScheduleAnalysisData() {
  const context = useContext(ScheduleAnalysisContext);
  if (!context) {
    throw new Error(
      "useScheduleAnalysisData must be used within ScheduleAnalysisProvider"
    );
  }
  return context;
}

// Обратная совместимость
export const useSchedulePageData = useScheduleAnalysisData;
export const SchedulePageProvider = ScheduleAnalysisProvider;
