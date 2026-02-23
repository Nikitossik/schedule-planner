import { useTranslation } from "react-i18next";

export const useUserTypeFilter = () => {
  const { t } = useTranslation();

  return {
    createFilter: (currentFilters) => {
      return {
        key: "user_types",
        label: t("filterLabels.userType"),
        options: [
          {
            key: "student",
            label: t("filterLabels.userTypes.student"),
            value: "student",
          },
          {
            key: "professor",
            label: t("filterLabels.userTypes.professor"),
            value: "professor",
          },
        ],
        showWhen: { key: "user_roles", value: "user" },
      };
    },
    isLoading: false,
    error: null,
    data: null,
  };
};
