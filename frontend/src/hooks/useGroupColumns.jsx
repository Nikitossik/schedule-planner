import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { actionsColumn } from "@/components/datatable/commonColumns";

export function useGroupColumns() {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        accessorKey: "id",
        header: t("groups.table.columns.id"),
      },
      {
        accessorKey: "name",
        header: t("groups.table.columns.name"),
      },
      {
        accessorKey: "students_count",
        header: t("groups.table.columns.studentsCount"),
        cell: ({ row }) => (
          <Badge variant="outline">
            {t("groups.table.studentsText", {
              count: row.original.students_count || 0,
            })}
          </Badge>
        ),
      },
      {
        header: t("groups.table.columns.directionAndStudyForm"),
        cell: ({ row }) => (
          <Badge variant="outline">
            {row.original.direction?.code} - {row.original.study_form?.form}
          </Badge>
        ),
      },
      {
        accessorKey: "academic_year",
        header: t("groups.table.columns.academicYear"),
        cell: ({ row }) => (
          <Badge variant="outline">{row.original.academic_year?.name}</Badge>
        ),
      },
      {
        accessorKey: "semester",
        header: t("groups.table.columns.semester"),
        cell: ({ row }) => (
          <Badge variant="outline">
            {t("groups.table.semesterFormat", {
              number: row.original.semester?.number,
              period: t(
                `filterLabels.periods.${row.original.semester?.period}`
              ),
            })}
          </Badge>
        ),
      },
      actionsColumn({ entity: "group", useModal: true }),
    ],
    [t]
  );
}
