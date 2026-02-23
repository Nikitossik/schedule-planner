import { useMemo } from "react";

export const useFilterComposer = (filterHooks, currentFilters = {}) => {
  const allData = filterHooks.map((hook) => hook());

  const isLoading = allData.some((data) => data.isLoading);
  const hasError = allData.some((data) => data.error);

  const filterSchema = useMemo(() => {
    return (currentFilters) => {
      if (isLoading) return [];

      const filters = [];
      const addedFilterKeys = new Set();

      let changed = true;
      while (changed && filters.length < allData.length) {
        changed = false;

        allData.forEach((hookData, index) => {
          const filter = hookData.createFilter(currentFilters);

          if (!filter) return;

          if (addedFilterKeys.has(filter.key)) return;

          const dependsOn = filter.dependsOn || [];
          const dependenciesSatisfied = dependsOn.every((dep) =>
            addedFilterKeys.has(dep)
          );

          if (dependenciesSatisfied) {
            filters.push(filter);
            addedFilterKeys.add(filter.key);
            changed = true;
          }
        });
      }

      return filters;
    }; 
  }, [allData, isLoading]); 

  return {
    filterSchema,
    isLoading,
    hasError,
  };
};
