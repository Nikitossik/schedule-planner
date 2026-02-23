import { useTranslation } from "react-i18next";
import { useIndependentFilter } from "./useIndependentFilter";

export const useAcademicYearFilter = () => {
  const { t } = useTranslation();

  return useIndependentFilter({
    entity: "academic_year",
    key: "academic_year_ids",
    label: t("filterLabels.academicYear"),
    valueField: "id",
    labelField: "name",
  });
};
