import { useQuery } from "@tanstack/react-query";
import { useProtectedFetch } from "./useProtectedFetch";

export function useLocalWorkloadWarnings(scheduleId) {
  const protectedFetch = useProtectedFetch();

  return useQuery({
    queryKey: ["local-workload-warnings", scheduleId],
    queryFn: async () => {
      if (!scheduleId) return null;

      const res = await protectedFetch(
        `http://localhost:8000/api/professor_workload/warnings/local/${scheduleId}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch workload warnings");
      }

      return res.json();
    },
    enabled: !!scheduleId,
    staleTime: 30000, // 30 секунд
  });
}

export function useCombinedWarnings(scheduleId) {
  const protectedFetch = useProtectedFetch();

  return useQuery({
    queryKey: ["combined-warnings", scheduleId],
    queryFn: async () => {
      if (!scheduleId) return null;

      const res = await protectedFetch(
        `http://localhost:8000/api/professor_workload/warnings/combined/${scheduleId}`
      );

      if (!res.ok) {
        throw new Error("Failed to fetch combined warnings");
      }

      return res.json();
    },
    enabled: !!scheduleId,
    staleTime: 30000, // 30 секунд
  });
}
