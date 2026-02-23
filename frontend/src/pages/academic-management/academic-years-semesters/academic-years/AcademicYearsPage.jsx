import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import DataTableWrapper from "@/components/datatable/DataTableWrapper";
import { useAcademicYearColumns } from "./columns";
import { AcademicYearModal } from "./AcademicYearModal";

export const AcademicYearsPage = () => {
  const { t } = useTranslation();
  const columns = useAcademicYearColumns();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    console.log(
      "🎯 AcademicYearTab: refetchTrigger changed to:",
      refetchTrigger
    );
  }, [refetchTrigger]);

  const handleCreate = () => {
    setEditingYear(null);
    setIsModalOpen(true);
  };

  const handleEdit = (year) => {
    console.log("📝 AcademicYearTab: Opening edit modal", year);
    setEditingYear(year);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    console.log("🚪 AcademicYearTab: Closing modal");
    setIsModalOpen(false);
    setEditingYear(null);
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
        entity="academic_year"
        columns={columns}
        defaultFilters={{ q: "" }}
        defaultSorting={[{ id: "start_date", desc: true }]}
        localStorageKey="academicYearsTableState"
        searchPlaceholder={t("academicYears.table.searchPlaceholder")}
        showSearch={false}
        addButton={{
          label: t("academicYears.table.addButton"),
          onClick: handleCreate,
        }}
        sortFields={[
          { label: t("academicYears.table.columns.id"), value: "id" },
          { label: t("academicYears.table.columns.name"), value: "name" },
          {
            label: t("academicYears.table.columns.startDate"),
            value: "start_date",
          },
          {
            label: t("academicYears.table.columns.endDate"),
            value: "end_date",
          },
        ]}
        filterSchema={[]}
        onEdit={handleEdit}
        onRefresh={handleRefresh}
        refetchTrigger={refetchTrigger}
      />

      <AcademicYearModal
        isOpen={isModalOpen}
        academicYear={editingYear}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </>
  );
};
