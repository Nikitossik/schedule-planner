import { useTranslation } from "react-i18next";

/**
 * Статический фильтр для ролей пользователей
 */
export const useUserRoleFilter = () => {
  const { t } = useTranslation();

  return {
    createFilter: (currentFilters) => {
      return {
        key: "user_roles",
        label: t("filterLabels.userRole"),
        options: [
          {
            key: "admin",
            label: t("filterLabels.userRoles.admin"),
            value: "admin",
          },
          {
            key: "coordinator",
            label: t("filterLabels.userRoles.coordinator"),
            value: "coordinator",
          },
          {
            key: "user",
            label: t("filterLabels.userRoles.user"),
            value: "user",
          },
        ],
      };
    },
    isLoading: false,
    error: null,
    data: null,
  };
};
