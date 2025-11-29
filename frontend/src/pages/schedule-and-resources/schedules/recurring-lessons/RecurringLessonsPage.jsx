import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import DataTableWrapper from "@/components/datatable/DataTableWrapper";
import { useRecurringLessonsColumns } from "./columns";
import { RecurringLessonForm } from "./RecurringLessonForm";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { useEntityQuery } from "@/hooks/useEntityQuery";

export const RecurringLessonsPage = ({ scheduleId }) => {
  const { t } = useTranslation();
  const columns = useRecurringLessonsColumns();
  const [refetchTrigger, setRefetchTrigger] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Get schedule data for the form
  const {
    data: schedule,
    isLoading: scheduleLoading,
    isError: scheduleError,
  } = useEntityQuery("schedule", scheduleId);

  const handleCreate = () => {
    setShowCreateModal(true);
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setShowEditModal(true);
  };

  const handleRefresh = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  const handleCreateSuccess = () => {
    setShowCreateModal(false);
    handleRefresh();
  };

  const handleEditSuccess = () => {
    setShowEditModal(false);
    setSelectedTemplate(null);
    handleRefresh();
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setSelectedTemplate(null);
  };

  if (scheduleLoading) {
    return <div className="p-4">{t("common.loading")}</div>;
  }

  if (scheduleError || !schedule) {
    return (
      <div className="p-4 text-red-500">{t("common.error.loadingFailed")}</div>
    );
  }

  return (
    <>
      <DataTableWrapper
        entity="recurring_template"
        columns={columns}
        showSearch={false}
        defaultFilters={{ schedule_ids: [scheduleId] }}
        defaultSorting={[{ id: "id", desc: false }]}
        localStorageKey={`recurringLessonsTableState_${scheduleId}`}
        searchPlaceholder={t("recurringLessons.search.placeholder")}
        addButton={{
          label: t("recurringLessons.add"),
          onClick: handleCreate,
        }}
        sortFields={[
          { label: t("recurringLessons.table.name"), value: "name" },
          {
            label: t("recurringLessons.table.subject"),
            value: "subject_assignment.subject.name",
          },
          { label: t("recurringLessons.table.group"), value: "group.name" },
          { label: t("recurringLessons.table.type"), value: "lesson_type" },
          { label: t("recurringLessons.table.time"), value: "start_time" },
        ]}
        filterSchema={[]}
        onEdit={handleEdit}
        onRefresh={handleRefresh}
        refetchTrigger={refetchTrigger}
      />

      {/* Create Template Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <RecurringLessonForm
          schedule={schedule}
          onSave={handleCreateSuccess}
          onCancel={handleCancel}
          isEdit={false}
        />
      </Dialog>

      {/* Edit Template Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <RecurringLessonForm
          template={selectedTemplate}
          schedule={schedule}
          onSave={handleEditSuccess}
          onCancel={handleCancel}
          isEdit={true}
        />
      </Dialog>
    </>
  );
};
