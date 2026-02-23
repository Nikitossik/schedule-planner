import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useWorkloadColumns } from "./columns";
import DataTableWrapper from "@/components/datatable/DataTableWrapper";
import WorkloadModal from "./WorkloadModal";
import { useFilterComposer } from "@/components/datatable/toolbar/filters/useFilterComposer";
import {
  useFacultyFilter,
  useDirectionFilter,
  useStudyFormFilter,
  useAcademicYearFilter,
  usePeriodFilter,
  useSemesterFilter,
} from "@/components/datatable/toolbar/filters";

export default function WorkloadsPage() {
  const { t } = useTranslation();
  const columns = useWorkloadColumns();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkload, setEditingWorkload] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    console.log("🎯 WorkloadsPage: refetchTrigger changed to:", refetchTrigger);
  }, [refetchTrigger]);

  const handleCreate = () => {
    setEditingWorkload(null);
    setIsModalOpen(true);
  };

 
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingWorkload(null);
  };

  const handleSuccess = () => {
    setRefetchTrigger((prev) => prev + 1);
    handleModalClose();
  };

  const handleRefresh = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  const { filterSchema, isLoading, hasError } = useFilterComposer([
    useFacultyFilter, 
    useDirectionFilter, 
    useStudyFormFilter, 
    useAcademicYearFilter,
    usePeriodFilter, 
    useSemesterFilter, 
  ]);

  return (
    <div className="container mx-auto py-3">
      <DataTableWrapper
        entity="professor_workload"
        pageLabel={t("workloads.title")}
        columns={columns}
        defaultFilters={{ q: "" }}
        defaultSorting={[{ id: "id", desc: false }]}
        localStorageKey="workloadsTableState"
        searchPlaceholder={t("workloads.searchPlaceholder")}
        addButton={{
          label: t("workloads.addButton"),
          onClick: handleCreate,
        }}
        sortFields={[
          { label: t("workloads.table.columns.id"), value: "id" },
        ]}
        filterSchema={filterSchema}
        onRefresh={handleRefresh}
        refetchTrigger={refetchTrigger}
      />

      <WorkloadModal
        isOpen={isModalOpen}
        workload={editingWorkload}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
