import { useEntityList } from "@/hooks/useEntityList";

export const useIndependentFilter = (config) => {
  const {
    entity,
    key,
    label,
    valueField = "id",
    labelField = "name",
    customLabelFormatter,
  } = config;

  const { data, isLoading, error } = useEntityList(entity);

  const createFilter = (currentFilters) => {
    if (!data?.items?.length) return null;

    const filter = {
      key,
      label,
      options: data.items.map((item) => ({
        key: item[valueField],
        value: item[valueField],
        label: customLabelFormatter
          ? customLabelFormatter(item)
          : item[labelField],
      })),
    };

    return filter;
  };

  return {
    createFilter,
    isLoading,
    error,
    data,
  };
};
