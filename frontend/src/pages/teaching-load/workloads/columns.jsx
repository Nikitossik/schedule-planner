import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { actionsColumn } from "@/components/datatable/commonColumns";

export function useWorkloadColumns() {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        accessorKey: "id",
        header: t("workloads.table.columns.id"),
      },
      {
        accessorKey: "professor",
        header: t("workloads.table.columns.professor"),
        cell: ({ row }) =>
          `${row.original.professor?.professor_profile?.academic_title} ${row.original.professor?.name} ${row.original.professor?.surname}`,
      },
      {
        accessorKey: "faculty",
        header: t("workloads.table.columns.faculty"),
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.faculty?.name ?? ""}</Badge>
        ),
      },
      {
        header: t("workloads.table.columns.directionAndStudyForm"),
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.direction?.code} - {row.original.study_form?.form}
          </Badge>
        ),
      },
      {
        accessorKey: "academic_year",
        header: t("workloads.table.columns.academicYear"),
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.academic_year?.name}</Badge>
        ),
      },
      {
        accessorKey: "semester",
        header: t("workloads.table.columns.semester"),
        cell: ({ row }) => (
          <Badge variant="outline">
            {t("workloads.table.semesterFormat", {
              number: row.original.semester?.number,
              period: t(
                `filterLabels.periods.${row.original.semester?.period}`
              ),
            })}
          </Badge>
        ),
      },
      {
        header: t("workloads.table.columns.hours"),
        cell: ({ row }) => (
          <Badge variant="secondary">
            {row.original.total_assignment_hours || 0} /{" "}
            {row.original.assigned_hours} {t("workloads.table.hoursUnit")}
          </Badge>
        ),
      },
      actionsColumn({
        entity: "professor_workload",
        editUrlBase: "/workloads",
        useModal: false,
        displayName: "workload",
      }),
    ],
    [t]
  );
}

export const columns = useWorkloadColumns;
