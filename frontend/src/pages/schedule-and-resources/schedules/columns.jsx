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
        header: t("schedules.table.columns.direction"),
        cell: ({ row }) => {
          const form = row.original.study_form?.form;
          const translatedForm = form === 'full-time' ? t('common.studyForms.fullTime') : 
                                form === 'part-time' ? t('common.studyForms.partTime') : form;
          return (
            <Badge variant="outline">
              {row.original.direction?.code} - {translatedForm}
            </Badge>
          );
        },
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
        cell: ({ row }) => {
          const period = row.original.semester?.period;
          const translatedPeriod = period === 'winter' ? t('common.periods.winter') : 
                                  period === 'summer' ? t('common.periods.summer') : period;
          return (
            <Badge variant="outline">
              {t("schedules.table.columns.semesterFormat", {
                number: row.original.semester?.number,
                period: translatedPeriod,
              })}
            </Badge>
          );
        },
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

export const columns = useScheduleColumns;
