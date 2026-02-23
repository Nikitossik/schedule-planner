import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import DataTableWrapper from "@/components/datatable/DataTableWrapper";
import { useSemesterColumns } from "./columns";
import { SemesterModal } from "./SemesterModal";
import { useFilterComposer } from "@/components/datatable/toolbar/filters/useFilterComposer";
import { useAcademicYearFilter } from "@/components/datatable/toolbar/filters/AcademicYearFilter";
import { usePeriodFilter } from "@/components/datatable/toolbar/filters/PeriodFilter";

export const SemestersPage = () => {
  const { t } = useTranslation();
  const columns = useSemesterColumns();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);


  const { filterSchema, isLoading, hasError } = useFilterComposer([
    useAcademicYearFilter, 
    usePeriodFilter, 
  ]);

  const handleCreate = () => {
    setEditingSemester(null);
    setIsModalOpen(true);
  };

  const handleEdit = (semester) => {
    setEditingSemester(semester);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSemester(null);
  };

  const handleSuccess = () => {
  
    setRefetchTrigger((prev) => prev + 1);
    handleModalClose();
  };

  const handleRefresh = () => {
    
    setRefetchTrigger((prev) => prev + 1);
  };

  return (
    <>
      <DataTableWrapper
        entity="semester"
        columns={columns}
        defaultFilters={{ q: "" }}
        defaultSorting={[{ id: "id", desc: false }]}
        localStorageKey="semestersTableState"
        searchPlaceholder={t("semesters.table.searchPlaceholder")}
        showSearch={false}
        addButton={{
          label: t("semesters.table.addButton"),
          onClick: handleCreate,
        }}
        sortFields={[
          { label: t("semesters.table.columns.id"), value: "id" },
          { label: t("semesters.table.columns.number"), value: "number" },
          {
            label: t("semesters.table.columns.startDate"),
            value: "start_date",
          },
          { label: t("semesters.table.columns.endDate"), value: "end_date" },
        ]}
        filterSchema={filterSchema}
        onEdit={handleEdit}
        onRefresh={handleRefresh}
        refetchTrigger={refetchTrigger}
      />

      <SemesterModal
        isOpen={isModalOpen}
        semester={editingSemester}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </>
  );
};
