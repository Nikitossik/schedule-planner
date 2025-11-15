import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { actionsColumn } from "@/components/datatable/commonColumns";

export function useContractColumns() {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        accessorKey: "id",
        header: t("contracts.table.columns.id"),
      },
      {
        header: t("contracts.table.columns.professor"),
        cell: ({ row }) =>
          `${row.original.professor?.name} ${row.original.professor?.surname}` ??
          "",
      },
      {
        header: t("contracts.table.columns.academicYear"),
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.academic_year?.name ?? ""}
          </Badge>
        ),
      },
      {
        accessorKey: "semester",
        header: t("contracts.table.columns.semester"),
        cell: ({ row }) => (
          <Badge variant="outline">
            {t("contracts.table.semesterFormat", {
              number: row.original.semester?.number,
              period: t(
                `filterLabels.periods.${row.original.semester?.period}`
              ),
            })}
          </Badge>
        ),
      },
      {
        header: t("contracts.table.columns.totalHours"),
        accessorKey: "total_hours",
      },
      {
        header: t("contracts.table.columns.usedHours"),
        accessorKey: "total_workload_hours",
      },
      {
        header: t("contracts.table.columns.remainingHours"),
        cell: ({ row }) => {
          const total = row.original.total_hours || 0;
          const used = row.original.total_workload_hours || 0;
          const remaining = total - used;
          return remaining >= 0 ? remaining : 0;
        },
      },
      actionsColumn({
        entity: "professor_contract",
        useModal: true,
        displayName: "contract",
      }),
    ],
    [t]
  );
}
