import { actionsColumn } from "@/components/datatable/commonColumns";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

export const useHolidayColumns = () => {
  const { t } = useTranslation();

  return [
    { accessorKey: "id", header: t("holidays.table.columns.id") },
    {
      accessorKey: "name",
      header: t("holidays.table.columns.name"),
      cell: ({ row }) => {
        const name = row.getValue("name");
        return (
          name || (
            <span className="text-muted-foreground">
              {t("holidays.defaultName")}
            </span>
          )
        );
      },
    },
    {
      accessorKey: "is_annual",
      header: t("holidays.table.columns.type"),
      cell: ({ row }) => {
        const isAnnual = row.getValue("is_annual");
        return (
          <Badge variant={isAnnual ? "default" : "secondary"}>
            {isAnnual
              ? t("holidays.table.types.annual")
              : t("holidays.table.types.manual")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "date",
      header: t("holidays.table.columns.date"),
      cell: ({ row }) => {
        const holiday = row.original;
        const date = new Date(holiday.date);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");

        if (holiday.is_annual) {
          return `${day}.${month}`;
        } else {
          const year = date.getFullYear();
          return `${day}.${month}.${year}`;
        }
      },
    },
    actionsColumn({ entity: "university_holiday", useModal: true }),
  ];
};

// Для обратной совместимости
export const columns = [];
