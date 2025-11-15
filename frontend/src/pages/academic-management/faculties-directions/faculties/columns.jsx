// columns.js

import { actionsColumn } from "@/components/datatable/commonColumns";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export const useFacultyColumns = () => {
  const { t } = useTranslation();

  return [
    { accessorKey: "id", header: t("faculties.table.columns.id") },
    { accessorKey: "name", header: t("faculties.table.columns.name") },
    {
      accessorKey: "directions_count",
      header: t("faculties.table.columns.directionsCount"),
      cell: ({ row }) => (
        <Badge variant="outline">
          {t("faculties.table.columns.directionsText", {
            count: row.original.directions_count ?? 0,
          })}
        </Badge>
      ),
    },
    actionsColumn({ entity: "faculty", useModal: true }),
  ];
};

// Для обратной совместимости
export const columns = [];
