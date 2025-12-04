import { useQuery } from "@tanstack/react-query";
import { useProtectedFetch } from "@/hooks/useProtectedFetch";

export function useEntityList(
  entity,
  { filters = {}, pagination, sorting, refetchTrigger = 0, enabled = true } = {}
) {
  const protectedFetch = useProtectedFetch();

  const queryKey = [
    "entityList",
    entity,
    filters,
    pagination,
    sorting,
    refetchTrigger,
  ];

  const queryFn = async () => {
    const queryParams = new URLSearchParams();

    if (pagination) {
      queryParams.append(
        "page",
        pagination.pageIndex ? pagination.pageIndex + 1 : 1
      );
      queryParams.append(
        "pageSize",
        pagination.pageSize ? pagination.pageSize : 10
      );
      queryParams.append("loadAll", pagination.loadAll === true);
    }

    if (sorting?.length) {
      const sort = sorting[0];
      queryParams.append("sort_by", sort.id);
      queryParams.append("desc", sort.desc);
    }

    for (const key in filters) {
      const value = filters[key];
      if (Array.isArray(value)) {
        value.forEach((v) => queryParams.append(key, v));
      } else if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value);
      }
    }

    const url = `http://localhost:8000/api/${entity}/?${queryParams.toString()}`;

    const res = await protectedFetch(url);

    if (!res.ok) {
      throw new Error(`Failed to fetch ${entity}`);
    }

    const data = await res.json();
    return data;
  };

  return useQuery({
    queryKey,
    queryFn,
    keepPreviousData: true,
    enabled,
  });
}
