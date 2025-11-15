import { useTranslation } from "react-i18next";
import { useIndependentFilter } from "./useIndependentFilter";

/**
 * Фильтр по факультетам
 * Загружает список факультетов и создает фильтр для множественного выбора
 */
export const useFacultyFilter = () => {
  const { t } = useTranslation();

  return useIndependentFilter({
    entity: "faculty",
    key: "faculty_ids",
    label: t("filterLabels.faculty"),
    valueField: "id",
    labelField: "name",
  });
};
