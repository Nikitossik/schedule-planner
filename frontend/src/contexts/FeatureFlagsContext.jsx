import { createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";

/**
 * Feature flags context
 * Loads configuration from backend once and caches forever
 */
const FeatureFlagsContext = createContext({
  disableStudentAccounts: false,
  isLoading: true,
});

export function FeatureFlagsProvider({ children }) {
  const { data, isLoading } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: async () => {
      const response = await fetch(
        "http://127.0.0.1:8000/config/feature-flags"
      );
      if (!response.ok) {
        throw new Error("Failed to fetch feature flags");
      }
      return response.json();
    },
    staleTime: Infinity, // Cache forever - these flags don't change during runtime
    gcTime: Infinity,
    retry: 3,
  });

  const flags = {
    disableStudentAccounts: data?.disableStudentAccounts ?? false,
    isLoading,
  };

  return (
    <FeatureFlagsContext.Provider value={flags}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

/**
 * Hook to access feature flags
 * @returns {Object} flags - { disableStudentAccounts: boolean, isLoading: boolean }
 */
export const useFeatureFlags = () => useContext(FeatureFlagsContext);
