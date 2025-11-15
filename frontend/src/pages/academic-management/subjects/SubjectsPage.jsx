import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSubjectColumns } from "./columns";
import DataTableWrapper from "@/components/datatable/DataTableWrapper";
import SubjectModal from "./SubjectModal";
import { useFilterComposer } from "@/components/datatable/toolbar/filters/useFilterComposer";
import { useFacultyFilter } from "@/components/datatable/toolbar/filters/FacultyFilter";
import { useDirectionFilter } from "@/components/datatable/toolbar/filters/DirectionFilter";
import { useAcademicYearFilter } from "@/components/datatable/toolbar/filters/AcademicYearFilter";
import { usePeriodFilter } from "@/components/datatable/toolbar/filters/PeriodFilter";
import { useSemesterFilter } from "@/components/datatable/toolbar/filters/SemesterFilter";

export default function SubjectsPage() {
  const { t } = useTranslation();
  const columns = useSubjectColumns();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const handleCreate = () => {
    setEditingSubject(null);
    setIsModalOpen(true);
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingSubject(null);
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

  // Композируем все фильтры с правильными зависимостями
  const { filterSchema, isLoading, hasError } = useFilterComposer([
    useFacultyFilter,
    useDirectionFilter,
    useAcademicYearFilter,
    usePeriodFilter,
    useSemesterFilter,
  ]);

  return (
    <div className="container mx-auto py-3">
      <DataTableWrapper
        entity="subject"
        pageLabel={t("sidebar.subjects")}
        columns={columns}
        defaultFilters={{ q: "" }}
        defaultSorting={[{ id: "id", desc: false }]}
        localStorageKey="subjectsTableState"
        searchPlaceholder={t("subjects.table.searchPlaceholder")}
        addButton={{
          label: t("subjects.table.addButton"),
          onClick: handleCreate,
        }}
        sortFields={[
          { label: t("subjects.table.columns.id"), value: "id" },
          { label: t("subjects.table.columns.name"), value: "name" },
        ]}
        filterSchema={filterSchema}
        onEdit={handleEdit}
        onRefresh={handleRefresh}
        refetchTrigger={refetchTrigger}
      />

      <SubjectModal
        isOpen={isModalOpen}
        subject={editingSubject}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
