import { useTranslation } from "react-i18next";
import { useDependentFilter } from "./useDependentFilter";

export const useDirectionFilter = () => {
  const { t } = useTranslation();

  return useDependentFilter({
    entity: "direction",
    key: "direction_ids",
    label: t("filterLabels.direction"),
    valueField: "id",
    labelField: "name",
    dependsOn: ["faculty_ids"],
    filterPredicate: (direction, currentFilters) => {
      const selectedFacultyIds = currentFilters.faculty_ids || [];
      
      if (selectedFacultyIds.length === 0) return true;
      return selectedFacultyIds.includes(direction.faculty?.id);
    },
  });
};
