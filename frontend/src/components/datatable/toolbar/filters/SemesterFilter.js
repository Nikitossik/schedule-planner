import { useTranslation } from "react-i18next";
import { useDependentFilter } from "./useDependentFilter";

export const useSemesterFilter = () => {
  const { t } = useTranslation();

  return useDependentFilter({
    entity: "semester",
    key: "semester_ids",
    label: t("filterLabels.semester"),
    valueField: "id",
    labelField: "name",
    dependsOn: ["academic_year_ids", "periods"],
    filterPredicate: (semester, currentFilters) => {
      const selectedYearIds = currentFilters.academic_year_ids || [];
      const selectedPeriods = currentFilters.periods || [];

      if (
        selectedYearIds.length > 0 &&
        !selectedYearIds.includes(semester.academic_year.id)
      ) {
        return false;
      }

      if (
        selectedPeriods.length > 0 &&
        !selectedPeriods.includes(semester.period)
      ) {
        return false;
      }

      return true;
    },
    customLabelFormatter: (semester) => {
      const periodLabel = t(`filterLabels.periods.${semester.period}`);
      return `${semester.name} (${periodLabel})`;
    },
  });
};
