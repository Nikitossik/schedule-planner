import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { useProtectedFetch } from "@/hooks/useProtectedFetch";

const ScheduleAnalysisContext = createContext();

export function ScheduleAnalysisProvider({ children, schedule }) {
  const protectedFetch = useProtectedFetch();

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
    staleTime: 30000, 
  });

  const timeConflicts = analysisData?.time_conflicts || {};
  const workloadIssues = analysisData?.workload_issues || {};

  const roomConflicts = timeConflicts.room_conflicts || {};
  const professorConflicts = timeConflicts.professor_conflicts || {};
  const groupConflicts = timeConflicts.group_conflicts || {};

  const totalConflicts = timeConflicts.total_conflicts || 0;
  const totalSingleScheduleConflicts = timeConflicts.total_single_schedule || 0;
  const totalCrossScheduleConflicts = timeConflicts.total_cross_schedule || 0;

  const professorWarnings = workloadIssues.professor_overloads || [];
  const subjectWarnings = workloadIssues.subject_overallocations || [];
  const totalProfessorWarnings = workloadIssues.total_professor_overloads || 0;
  const totalSubjectWarnings =
    workloadIssues.total_subject_overallocations || 0;
  const totalWorkloadIssues = workloadIssues.total_workload_issues || 0;

  const hasConflicts = totalConflicts > 0;
  const hasWorkloadIssues = totalWorkloadIssues > 0;
  const hasIssues = hasConflicts || hasWorkloadIssues;
  const hasCriticalIssues = totalCrossScheduleConflicts > 0;

  const isLoading = analysisLoading;

  const value = {
    schedule,
    analysisData,

    timeConflicts,
    workloadIssues,
    roomConflicts,
    professorConflicts,
    groupConflicts,

    professorWarnings,
    subjectWarnings,
    workloadWarnings: professorWarnings, 

    
    scheduleGroups: schedule?.groups || [],
    groupsInvolved: schedule?.groups || [], 

    
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

   
    isLoading: analysisLoading,
    analysisLoading,
    conflictsLoading: analysisLoading, 
    workloadLoading: analysisLoading, 
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


export const useSchedulePageData = useScheduleAnalysisData;
export const SchedulePageProvider = ScheduleAnalysisProvider;
