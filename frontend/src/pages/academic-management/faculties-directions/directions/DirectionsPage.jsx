import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import DataTableWrapper from "@/components/datatable/DataTableWrapper";
import { useDirectionColumns } from "./columns";
import DirectionModal from "./DirectionModal";
import { useFilterComposer } from "@/components/datatable/toolbar/filters/useFilterComposer";
import { useFacultyFilter } from "@/components/datatable/toolbar/filters/FacultyFilter";
import { useStudyFormFilter } from "@/components/datatable/toolbar/filters/StudyFormFilter";

export const DirectionsPage = () => {
  const { t } = useTranslation();
  const columns = useDirectionColumns();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDirection, setEditingDirection] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const { filterSchema, isLoading, hasError } = useFilterComposer([
    useFacultyFilter,
    useStudyFormFilter,
  ]);

  const handleCreate = () => {
    setEditingDirection(null);
    setIsModalOpen(true);
  };

  const handleEdit = (direction) => {
    setEditingDirection(direction);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingDirection(null);
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
        entity="direction"
        columns={columns}
        defaultFilters={{ q: "" }}
        defaultSorting={[{ id: "id", desc: false }]}
        localStorageKey="directionsTableState"
        searchPlaceholder={t("directions.table.searchPlaceholder")}
        addButton={{
          label: t("directions.table.addButton"),
          onClick: handleCreate,
        }}
        onEdit={handleEdit}
        sortFields={[{ label: t("directions.table.columns.id"), value: "id" }]}
        filterSchema={filterSchema}
        onRefresh={handleRefresh}
        refetchTrigger={refetchTrigger}
      />

      <DirectionModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        direction={editingDirection}
        onSuccess={handleSuccess}
      />
    </>
  );
};
