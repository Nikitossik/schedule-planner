import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useScheduleColumns } from "@/hooks/useScheduleColumns";
import DataTableWrapper from "@/components/datatable/DataTableWrapper";
import ScheduleModal from "./ScheduleModal";

export default function SchedulesPage() {
  const { t } = useTranslation();
  const columns = useScheduleColumns();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCreateSchedule = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSuccess = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-3">
      <DataTableWrapper
        entity="schedule"
        pageLabel={t("schedules.title")}
        columns={columns}
        defaultFilters={{ q: "" }}
        defaultSorting={[{ id: "id", desc: false }]}
        localStorageKey="schedulesTableState"
        searchPlaceholder={t("schedules.searchPlaceholder")}
        addButton={{
          label: t("schedules.addButton"),
          onClick: handleCreateSchedule,
        }}
        sortFields={[
          { label: t("schedules.table.columns.id"), value: "id" },
          { label: t("schedules.table.columns.name"), value: "name" },
        ]}
        filterSchema={[]}
        refetchTrigger={refetchTrigger}
      />

      <ScheduleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
