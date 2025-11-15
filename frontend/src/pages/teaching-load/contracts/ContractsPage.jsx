import { useState } from "react";
import { useContractColumns } from "./columns";
import { useTranslation } from "react-i18next";
import DataTableWrapper from "@/components/datatable/DataTableWrapper";
import { useFilterComposer } from "@/components/datatable/toolbar/filters/useFilterComposer";
import { useAcademicYearFilter } from "@/components/datatable/toolbar/filters/AcademicYearFilter";
import { usePeriodFilter } from "@/components/datatable/toolbar/filters/PeriodFilter";
import { useSemesterFilter } from "@/components/datatable/toolbar/filters/SemesterFilter";
import ContractModal from "./ContractModal";

export default function ContractsPage() {
  const { t } = useTranslation();
  const columns = useContractColumns();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContract, setEditingContract] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const handleCreate = () => {
    setEditingContract(null);
    setIsModalOpen(true);
  };

  const handleEdit = (contract) => {
    setEditingContract(contract);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingContract(null);
  };

  const handleSuccess = () => {
    // Триггерим обновление таблицы
    setRefetchTrigger((prev) => prev + 1);
    handleModalClose();
  };

  const handleRefresh = () => {
    // Функция для обновления таблицы
    setRefetchTrigger((prev) => prev + 1);
  };
  // Композируем фильтры с каскадными зависимостями для контрактов
  const { filterSchema, isLoading, hasError } = useFilterComposer([
    useAcademicYearFilter, // независимый
    usePeriodFilter, // зависит от academic_year_ids
    useSemesterFilter, // зависит от academic_year_ids и periods
  ]);

  return (
    <div className="container mx-auto py-3">
      <DataTableWrapper
        entity="professor_contract"
        pageLabel={t("sidebar.contracts")}
        columns={columns}
        defaultFilters={{ q: "" }}
        defaultSorting={[{ id: "id", desc: false }]}
        localStorageKey="contractsTableState"
        searchPlaceholder={t("contracts.table.searchPlaceholder")}
        addButton={{
          label: t("contracts.table.addButton"),
          onClick: handleCreate,
        }}
        sortFields={[
          { label: t("contracts.table.columns.id"), value: "id" },
          {
            label: t("contracts.table.columns.totalHours"),
            value: "total_hours",
          },
          // на беке исправить сортировку по этому полю
          //{ label: t('contracts.table.columns.usedHours'), value: "total_workload_hours" },
        ]}
        filterSchema={filterSchema}
        onEdit={handleEdit}
        onRefresh={handleRefresh}
        refetchTrigger={refetchTrigger}
      />

      <ContractModal
        isOpen={isModalOpen}
        contract={editingContract}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
