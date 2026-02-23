import { useState, useEffect, useCallback } from "react";
import { useEntityList } from "./useEntityList";
import { useDebounce } from "./useDebounce";

export function useServerTableQuery({
  entity,
  defaultFilters = {},
  defaultSorting = [{ id: "id", desc: false }],
  localStorageKey,
  refetchTrigger = 0,
}) {
  const STORAGE_KEY = localStorageKey || `datatable_state:${entity}`;

  const getInitialState = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      return {
        pagination: saved.pagination || { pageIndex: 0, pageSize: 10 },
        sorting: saved.sorting || defaultSorting,
        filters: { ...defaultFilters, ...saved.filters },
      };
    } catch {
      return {
        pagination: { pageIndex: 0, pageSize: 10 },
        sorting: defaultSorting,
        filters: defaultFilters,
      };
    }
  };

  const [pagination, setPagination] = useState(getInitialState().pagination);
  const [sorting, setSorting] = useState(getInitialState().sorting);
  const [filters, setFilters] = useState(getInitialState().filters);

 
  const debouncedFilters = useDebounce(filters, 300);

  const { data, isLoading, error, refetch } = useEntityList(entity, {
    pagination,
    sorting,
    filters: debouncedFilters,
    refetchTrigger,
  });


  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ pagination, sorting, filters })
    );
  }, [pagination, sorting, filters]);

  const resetAll = () => {
    setPagination({ pageIndex: 0, pageSize: 10 });
    setSorting(defaultSorting);
    setFilters(defaultFilters);
  };

  return {
    data: data || { items: [], total: 0 },
    isLoading,
    error,
    refetch,
    pagination,
    setPagination,
    sorting,
    setSorting,
    filters,
    setFilters,
    resetAll,
  };
}
