import { useState } from "react";
import { useGroupColumns } from "./columns";
import { useTranslation } from "react-i18next";
import DataTableWrapper from "@/components/datatable/DataTableWrapper";
import { useFilterComposer } from "@/components/datatable/toolbar/filters/useFilterComposer";
import {
  useFacultyFilter,
  useDirectionFilter,
  useStudyFormFilter,
  useAcademicYearFilter,
  usePeriodFilter,
  useSemesterFilter,
} from "@/components/datatable/toolbar/filters";
import GroupModal from "./GroupModal";

export default function GroupsPage() {
  const { t } = useTranslation();
  const columns = useGroupColumns();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  const { filterSchema, isLoading, hasError } = useFilterComposer([
    useFacultyFilter, // Независимый
    useDirectionFilter, // Зависит от Faculty
    useStudyFormFilter, // Независимый (статический)
    useAcademicYearFilter, // Независимый
    usePeriodFilter, // Зависит от Academic Year (статический)
    useSemesterFilter, // Зависит от Academic Year + Period
  ]);

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setIsModalOpen(true);
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGroup(null);
  };

  const handleSuccess = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  return (
    <div className="container mx-auto py-3">
      <DataTableWrapper
        entity="group"
        pageLabel={t("navigation.groups")}
        columns={columns}
        defaultFilters={{ q: "" }}
        defaultSorting={[{ id: "id", desc: false }]}
        localStorageKey="groupsTableState"
        searchPlaceholder={t("groups.table.searchPlaceholder")}
        addButton={{
          label: t("groups.table.addButton"),
          onClick: handleCreateGroup,
        }}
        onEdit={handleEditGroup}
        sortFields={[
          { label: t("groups.table.columns.id"), value: "id" },
          { label: t("groups.table.columns.name"), value: "name" },
        ]}
        filterSchema={filterSchema}
        refetchTrigger={refetchTrigger}
      />

      <GroupModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        group={editingGroup}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
