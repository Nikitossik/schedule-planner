import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import DataTableWrapper from "@/components/datatable/DataTableWrapper";
import { useFacultyColumns } from "./columns";
import FacultyModal from "./FacultyModal";

export const FacultiesPage = () => {
  const { t } = useTranslation();
  const columns = useFacultyColumns();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const handleCreate = () => {
    setEditingFaculty(null);
    setIsModalOpen(true);
  };

  const handleEdit = (faculty) => {
    setEditingFaculty(faculty);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingFaculty(null);
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
        entity="faculty"
        columns={columns}
        defaultFilters={{ q: "" }}
        defaultSorting={[{ id: "id", desc: false }]}
        localStorageKey="facultiesTableState"
        searchPlaceholder={t("faculties.table.searchPlaceholder")}
        addButton={{
          label: t("faculties.table.addButton"),
          onClick: handleCreate,
        }}
        onEdit={handleEdit}
        sortFields={[{ label: t("faculties.table.columns.id"), value: "id" }]}
        filterSchema={[]}
        onRefresh={handleRefresh}
        refetchTrigger={refetchTrigger}
      />

      <FacultyModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        faculty={editingFaculty}
        onSuccess={handleSuccess}
      />
    </>
  );
};
