import { actionsColumn } from "@/components/datatable/commonColumns";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export const useDirectionColumns = () => {
  const { t } = useTranslation();

  return [
    { accessorKey: "id", header: t("directions.table.columns.id") },
    { accessorKey: "name", header: t("directions.table.columns.name") },
    { accessorKey: "code", header: t("directions.table.columns.code") },
    {
      accessorKey: "faculty",
      header: t("directions.table.columns.faculty"),
      cell: ({ row }) => (
        <Badge variant="outline">{row.original.faculty?.name ?? ""}</Badge>
      ),
    },
    {
      accessorKey: "forms",
      header: t("directions.table.columns.studyForms"),
      cell: ({ row }) => {
        return row.original.forms?.map((form, index) => (
          <Badge key={index} variant="outline" className="mx-1">
            {t(
              `directions.studyForms.${
                form.form === "full-time" ? "fullTime" : "partTime"
              }`
            )}
          </Badge>
        ));
      },
    },
    actionsColumn({ entity: "direction", useModal: true }),
  ];
};

// Для обратной совместимости
export const columns = [];
