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
        const holiday = row.original;
        const name = row.getValue("name");

        if (name) {
          return name;
        }

        // Если нет названия, показываем дефолтное в зависимости от типа
        const isDateRange = holiday.is_date_range;
        const defaultKey = isDateRange
          ? "holidays.defaultNameRange"
          : "holidays.defaultNameSingle";

        return <span className="text-muted-foreground">{t(defaultKey)}</span>;
      },
    },
    {
      accessorKey: "date",
      header: t("holidays.table.columns.date"),
      cell: ({ row }) => {
        const holiday = row.original;
        const isDateRange = holiday.is_date_range;
        const isAnnual = holiday.is_annual;

        const formatDate = (dateStr, showYear = true) => {
          if (!dateStr) return "";
          const date = new Date(dateStr);
          const day = String(date.getDate()).padStart(2, "0");
          const month = String(date.getMonth() + 1).padStart(2, "0");

          if (showYear) {
            const year = date.getFullYear();
            return `${day}.${month}.${year}`;
          } else {
            return `${day}.${month}`;
          }
        };

        let dateDisplay;
        if (isDateRange) {
          const startDate = formatDate(holiday.start_date, !isAnnual);
          const endDate = formatDate(holiday.end_date, !isAnnual);
          dateDisplay = `${startDate} - ${endDate}`;
        } else {
          dateDisplay = formatDate(holiday.date, !isAnnual);
        }

        return (
          <div className="flex items-center gap-2">
            <span>{dateDisplay}</span>
            {isAnnual && (
              <Badge variant="secondary" className="text-xs">
                {t("holidays.table.types.annual")}
              </Badge>
            )}
          </div>
        );
      },
    },
    actionsColumn({ entity: "university_holiday", useModal: true }),
  ];
};

// Для обратной совместимости
export const columns = [];
