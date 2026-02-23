import { useTranslation } from "react-i18next";

export const usePeriodFilter = () => {
  const { t } = useTranslation();

  return {
    createFilter: (currentFilters) => {
      return {
        key: "periods",
        label: t("filterLabels.period"),
        options: [
          {
            key: "winter",
            value: "winter",
            label: t("filterLabels.periods.winter"),
          },
          {
            key: "summer",
            value: "summer",
            label: t("filterLabels.periods.summer"),
          },
        ],
      };
    },
    isLoading: false,
    error: null,
    data: null,
  };
};
