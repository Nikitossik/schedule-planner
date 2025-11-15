import { actionsColumn } from "@/components/datatable/commonColumns";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export const useSemesterColumns = () => {
  const { t } = useTranslation();

  return [
    { accessorKey: "id", header: t("semesters.table.columns.id") },
    {
      accessorKey: "name",
      header: t("semesters.table.columns.name"),
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: "academic_year",
      header: t("semesters.table.columns.academicYear"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span>{row.original.academic_year?.name}</span>
          {row.original.academic_year?.is_current && (
            <Badge variant="secondary" className="text-xs">
              {t("semesters.table.columns.current")}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "number",
      header: t("semesters.table.columns.number"),
      cell: ({ row }) => (
        <Badge variant="outline">
          {t("semesters.table.columns.semesterNumber", {
            number: row.original.number,
          })}
        </Badge>
      ),
    },
    {
      accessorKey: "period",
      header: t("semesters.table.columns.period"),
      cell: ({ row }) => (
        <span className="capitalize">
          {t(`semesters.form.fields.period.${row.original.period}`)}
        </span>
      ),
    },
    {
      accessorKey: "start_date",
      header: t("semesters.table.columns.startDate"),
    },
    { accessorKey: "end_date", header: t("semesters.table.columns.endDate") },
    actionsColumn({ entity: "semester", useModal: true }),
  ];
};

// Для обратной совместимости
export const semesterColumns = [];

// Экспортируем старые колонки для обратной совместимости
export const columns = semesterColumns;
