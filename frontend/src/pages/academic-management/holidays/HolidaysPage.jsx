import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useHolidayColumns } from "./columns";
import DataTableWrapper from "@/components/datatable/DataTableWrapper";
import HolidayModal from "./HolidayModal";

export default function HolidaysPage() {
  const { t } = useTranslation();
  const columns = useHolidayColumns();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [modalState, setModalState] = useState({
    isOpen: false,
    holiday: null,
  });

  const handleRefresh = () => {
    // Функция для обновления таблицы
    setRefetchTrigger((prev) => prev + 1);
  };

  const handleAddHoliday = () => {
    setModalState({
      isOpen: true,
      holiday: null,
    });
  };

  const handleEditHoliday = (holiday) => {
    setModalState({
      isOpen: true,
      holiday,
    });
  };

  const handleCloseModal = () => {
    setModalState({
      isOpen: false,
      holiday: null,
    });
  };

  const handleModalSuccess = () => {
    handleCloseModal();
    handleRefresh();
  };

  return (
    <div className="container mx-auto py-3">
      <DataTableWrapper
        entity="university_holiday"
        showSearch={false}
        pageLabel={t("sidebar.holidays")}
        columns={columns}
        defaultFilters={{}}
        defaultSorting={[{ id: "id", desc: false }]}
        localStorageKey="holidaysTableState"
        addButton={{
          label: t("holidays.table.addButton"),
          onClick: handleAddHoliday,
        }}
        sortFields={[
          { label: t("holidays.table.columns.id"), value: "id" },
          { label: t("holidays.table.columns.name"), value: "name" },
        ]}
        filterSchema={[]}
        onEdit={handleEditHoliday}
        onRefresh={handleRefresh}
        refetchTrigger={refetchTrigger}
      />

      <HolidayModal
        isOpen={modalState.isOpen}
        holiday={modalState.holiday}
        onClose={handleCloseModal}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
