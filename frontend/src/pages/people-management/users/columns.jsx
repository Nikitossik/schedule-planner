// columns.js

import { actionsColumn } from "@/components/datatable/commonColumns";
import { useTranslation } from "react-i18next";

export const useUserColumns = () => {
  const { t } = useTranslation();

  return [
    { accessorKey: "id", header: t("users.table.columns.id") },
    { accessorKey: "name", header: t("users.table.columns.name") },
    { accessorKey: "surname", header: t("users.table.columns.surname") },
    { accessorKey: "email", header: t("users.table.columns.email") },
    {
      accessorKey: "role",
      header: t("users.table.columns.role"),
      cell: ({ row }) => {
        const role = row.original.role;
        return t(`users.form.roles.${role}`);
      },
    },
    {
      accessorKey: "user_type",
      header: t("users.table.columns.userType"),
      cell: ({ row }) => {
        const userType = row.original.user_type;
        return userType ? t(`users.form.userTypes.${userType}`) : "-";
      },
    },
    actionsColumn({ entity: "user", useModal: true }),
  ];
};

// Для обратной совместимости
export const columns = [];
