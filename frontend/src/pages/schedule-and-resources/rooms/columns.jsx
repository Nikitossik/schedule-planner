import { useTranslation } from "react-i18next";
import { actionsColumn } from "@/components/datatable/commonColumns";
import { Badge } from "@/components/ui/badge";

export const useRoomColumns = () => {
  const { t } = useTranslation();

  return [
    { 
      accessorKey: "id", 
      header: t("rooms.table.columns.id") 
    },
    { 
      accessorKey: "number", 
      header: t("rooms.table.columns.number") 
    },
    { 
      accessorKey: "capacity", 
      header: t("rooms.table.columns.capacity"),
      cell: ({ row }) => {
        const capacity = row.original.capacity;
        return capacity ? capacity : (
          <Badge variant="secondary" className="text-xs">
            {t("common.notSet")}
          </Badge>
        );
      }
    },
    actionsColumn({ entity: "room", useModal: true }),
  ];
};

export const columns = useRoomColumns;
