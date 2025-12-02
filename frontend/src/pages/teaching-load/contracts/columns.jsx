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
        cell: ({ row }) => {
          const professor = row.original.professor;
          return professor ? (
            <div className="flex flex-row items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: professor.professor_profile?.color }}
              />
              <span className="font-medium">
                {professor.professor_profile?.academic_title} {professor.name}{" "}
                {professor.surname}
              </span>
            </div>
          ) : (
            "-"
          );
        },
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
        header: t("contracts.table.columns.hours"),
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.total_workload_hours || 0} /{" "}
            {row.original.total_hours} {t("contracts.table.hoursUnit")}
          </Badge>
        ),
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

export const columns = useContractColumns;
