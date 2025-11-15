import { useTranslation } from "react-i18next";
import { actionsColumn } from "@/components/datatable/commonColumns";

export const useRoomColumns = () => {
  const { t } = useTranslation();

  return [
    { accessorKey: "id", header: t("rooms.table.columns.id") },
    { accessorKey: "number", header: t("rooms.table.columns.number") },
    { accessorKey: "capacity", header: t("rooms.table.columns.capacity") },
    actionsColumn({ entity: "room", useModal: true }),
  ];
};
