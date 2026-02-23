import { useEntityList } from "@/hooks/useEntityList";

export const useDependentFilter = (config) => {
  const {
    entity,
    key,
    label,
    valueField = "id",
    labelField = "name",
    dependsOn = [],
    filterPredicate,
    customLabelFormatter,
    extractUnique = false,
  } = config;

  const { data, isLoading, error } = useEntityList(entity);

  const createFilter = (currentFilters) => {
    if (!data?.items?.length) return null;

    let filteredItems = data.items;

    if (dependsOn.length > 0 && filterPredicate) {
      filteredItems = data.items.filter((item) =>
        filterPredicate(item, currentFilters)
      );
    }

    if (filteredItems.length === 0) return null;

    let options;

    if (extractUnique) {
      const uniqueValues = [
        ...new Set(filteredItems.map((item) => item[valueField])),
      ];
      options = uniqueValues.map((value) => ({
        key: value,
        value: value,
        label: customLabelFormatter
          ? customLabelFormatter({ [valueField]: value, [labelField]: value })
          : value.charAt(0).toUpperCase() + value.slice(1),
      }));
    } else {
      options = filteredItems.map((item) => ({
        key: item[valueField],
        value: item[valueField],
        label: customLabelFormatter
          ? customLabelFormatter(item)
          : item[labelField],
      }));
    }

    const filter = {
      key,
      label,
      options,
      dependsOn,
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
