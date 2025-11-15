import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { actionsColumn } from "@/components/datatable/commonColumns";

export function useScheduleColumns() {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        accessorKey: "id",
        header: t("schedules.table.columns.id"),
      },
      {
        accessorKey: "name",
        header: t("schedules.table.columns.name"),
      },
      {
        accessorKey: "faculty",
        header: t("schedules.table.columns.faculty"),
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.faculty?.name}</Badge>
        ),
      },
      {
        accessorKey: "direction",
        header: t("schedules.table.columns.direction"),
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.direction?.code}</Badge>
        ),
      },
      {
        header: t("schedules.table.columns.academicYear"),
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.academic_year?.name ?? ""}
          </Badge>
        ),
      },
      {
        accessorKey: "semester",
        header: t("schedules.table.columns.semester"),
        cell: ({ row }) => (
          <Badge variant="outline">
            {t("schedules.table.columns.semesterFormat", {
              number: row.original.semester?.number,
              period: row.original.semester?.period,
            })}
          </Badge>
        ),
      },
      actionsColumn({
        entity: "schedule",
        editUrlBase: "/schedules",
        useModal: false,
      }),
    ],
    [t]
  );
}
