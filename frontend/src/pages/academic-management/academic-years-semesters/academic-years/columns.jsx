import { actionsColumn } from "@/components/datatable/commonColumns";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export const useAcademicYearColumns = () => {
  const { t } = useTranslation();

  return [
    { accessorKey: "id", header: t("academicYears.table.columns.id") },
    {
      accessorKey: "name",
      header: t("academicYears.table.columns.name"),
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-medium">{row.original.name}</span>
          {row.original.is_current && (
            <Badge variant="default" className="text-xs">
              {t("academicYears.table.columns.current")}
            </Badge>
          )}
        </div>
      ),
    },
    {
      accessorKey: "start_date",
      header: t("academicYears.table.columns.startDate"),
    },
    {
      accessorKey: "end_date",
      header: t("academicYears.table.columns.endDate"),
    },
    {
      accessorKey: "semesters",
      header: t("academicYears.table.columns.semesters"),
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs">
          {t("academicYears.table.semestersCount", {
            count: row.original.semesters?.length || 0,
          })}
        </Badge>
      ),
    },
    actionsColumn({
      entity: "academic_year",
      useModal: true,
      displayName: "academic year",
    }),
  ];
};

export const academicYearColumns = [];
