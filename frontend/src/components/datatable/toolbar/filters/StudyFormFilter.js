import { useTranslation } from "react-i18next";

/**
 * Фильтр по формам обучения (статический - не загружается с сервера)
 */
export const useStudyFormFilter = () => {
  const { t } = useTranslation();

  const createFilter = (currentFilters) => {
    const filter = {
      key: "study_forms",
      label: t("filterLabels.studyForm"),
      options: [
        {
          key: "full-time",
          value: "full-time",
          label: t("filterLabels.studyForms.fullTime"),
        },
        {
          key: "part-time",
          value: "part-time",
          label: t("filterLabels.studyForms.partTime"),
        },
      ],
    };

    return filter;
  };

  return {
    createFilter,
    isLoading: false,
    error: null,
    data: null,
  };
};
