import { actionsColumn } from "@/components/datatable/commonColumns";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export const useSubjectColumns = () => {
  const { t } = useTranslation();

  return [
    { accessorKey: "id", header: t("subjects.table.columns.id") },
    { accessorKey: "name", header: t("subjects.table.columns.name") },
    { accessorKey: "code", header: t("subjects.table.columns.code") },
    {
      accessorKey: "faculty",
      header: t("subjects.table.columns.faculty"),
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.faculty?.name}</Badge>
      ),
    },
    {
      accessorKey: "direction",
      header: t("subjects.table.columns.direction"),
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.direction?.code}</Badge>
      ),
    },
    {
      accessorKey: "academic_year",
      header: t("subjects.table.columns.academicYear"),
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.academic_year?.name}</Badge>
      ),
    },
    {
      accessorKey: "semester",
      header: t("subjects.table.columns.semester"),
      cell: ({ row }) => {
        const semester = row.original.semester;
        const periodLabel = t(`filterLabels.periods.${semester?.period}`);
        return (
          <Badge variant="outline">
            {t("subjects.table.semesterFormat", {
              number: semester?.number,
              period: periodLabel,
            })}
          </Badge>
        );
      },
    },
    {
      accessorKey: "allocated_hours",
      header: t("subjects.table.columns.allocatedHours"),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {row.original.allocated_hours} {t("subjects.table.hoursUnit")}
        </Badge>
      ),
    },
    {
      accessorKey: "color",
      header: t("subjects.table.columns.color"),
      cell: ({ row }) => (
        <div
          className="w-5 h-5 rounded-sm"
          style={{ backgroundColor: row.original.color }}
        ></div>
      ),
    },
    actionsColumn({ entity: "subject", useModal: true }),
  ];
};

// Для обратной совместимости
export const columns = [];
