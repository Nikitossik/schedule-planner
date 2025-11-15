import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRoomColumns } from "./useRoomColumns";
import DataTableWrapper from "@/components/datatable/DataTableWrapper";
import RoomModal from "./RoomModal";

export default function RoomsPage() {
  const { t } = useTranslation();
  const columns = useRoomColumns();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const handleCreateRoom = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRoom(null);
  };

  const handleSuccess = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-3">
      <DataTableWrapper
        entity="room"
        pageLabel={t("rooms.title")}
        columns={columns}
        defaultFilters={{ q: "" }}
        defaultSorting={[{ id: "id", desc: false }]}
        localStorageKey="roomsTableState"
        searchPlaceholder={t("rooms.table.searchPlaceholder")}
        addButton={{
          label: t("rooms.table.addButton"),
          onClick: handleCreateRoom,
        }}
        onEdit={handleEditRoom}
        sortFields={[
          { label: t("rooms.table.columns.id"), value: "id" },
          { label: t("rooms.table.columns.number"), value: "number" },
          { label: t("rooms.table.columns.capacity"), value: "capacity" },
        ]}
        filterSchema={[]}
        refetchTrigger={refetchTrigger}
      />

      <RoomModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        room={editingRoom}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
