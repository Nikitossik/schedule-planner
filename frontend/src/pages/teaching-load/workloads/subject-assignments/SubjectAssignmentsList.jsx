import { useState } from "react";
import { useTranslation } from "react-i18next";
import DataTableWrapper from "@/components/datatable/DataTableWrapper";
import { useSubjectAssignmentColumns } from "@/hooks/useSubjectAssignmentColumns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import SubjectAssignmentForm from "./SubjectAssignmentForm";
import { useEntityMutation } from "@/hooks/useEntityMutation";

const SubjectAssignmentsList = ({ workload, onUpdate }) => {
  const { t } = useTranslation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const createAssignment = useEntityMutation("subject_assignment", "create");
  const updateAssignment = useEntityMutation("subject_assignment", "patch");
  const deleteAssignment = useEntityMutation("subject_assignment", "delete");

  const assignments = workload.subject_assignments || [];
  const totalAssignedHours = assignments.reduce(
    (sum, assignment) => sum + assignment.hours_per_subject,
    0
  );
  const remainingHours = workload.assigned_hours - totalAssignedHours;

  const handleCreate = () => {
    setIsCreateOpen(true);
  };

  const handleEdit = (assignment) => {
    setEditingAssignment(assignment);
    setIsEditOpen(true);
  };

  const handleSaveAssignment = async (data) => {
    try {
      if (editingAssignment) {
        // Update existing assignment
        await updateAssignment.mutateAsync({
          id: editingAssignment.id,
          data,
        });
        toast.success(t("workloads.subjectAssignments.messages.updateSuccess"));
        setIsEditOpen(false);
        setEditingAssignment(null);
      } else {
        // Create new assignment
        await createAssignment.mutateAsync(data);
        toast.success(t("workloads.subjectAssignments.messages.createSuccess"));
        setIsCreateOpen(false);
      }

      // Триггерим обновление таблицы
      setRefetchTrigger((prev) => prev + 1);

      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(
        error.message || t("workloads.subjectAssignments.messages.createError")
      );
    }
  };

  const handleDelete = async (assignmentId) => {
    try {
      await deleteAssignment.mutateAsync({ id: assignmentId });
      toast.success(t("workloads.subjectAssignments.messages.deleteSuccess"));

      // Триггерим обновление таблицы
      setRefetchTrigger((prev) => prev + 1);

      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(
        error.message || t("workloads.subjectAssignments.messages.deleteError")
      );
    }
  };

  // Calculate available hours for editing
  const getAvailableHours = (currentAssignment = null) => {
    const otherAssignments = assignments.filter(
      (a) => !currentAssignment || a.id !== currentAssignment.id
    );
    const otherHours = otherAssignments.reduce(
      (sum, assignment) => sum + assignment.hours_per_subject,
      0
    );
    return workload.assigned_hours - otherHours;
  };

  // Create columns with handlers
  const columns = useSubjectAssignmentColumns(handleEdit, handleDelete);

  return (
    <div className="space-y-4">
      {/* Header with summary */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">
            {t("workloads.subjectAssignments.title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("workloads.subjectAssignments.summary", {
              total: workload.assigned_hours,
              assigned: totalAssignedHours,
              remaining: remainingHours,
            })}
          </p>
        </div>
      </div>

      <DataTableWrapper
        entity="subject_assignment"
        columns={columns}
        defaultFilters={{
          workload_id: workload.id,
        }}
        defaultSorting={[{ id: "id", desc: false }]}
        localStorageKey={`subjectAssignmentsTableState_${workload.id}`}
        searchPlaceholder={t("workloads.subjectAssignments.searchPlaceholder")}
        showSearch={false}
        addButton={{
          label: t("workloads.subjectAssignments.addButton"),
          onClick: handleCreate,
          disabled: createAssignment.isPending,
        }}
        sortFields={[
          { label: t("workloads.subjectAssignments.columns.id"), value: "id" },
          {
            label: t("workloads.subjectAssignments.columns.subject"),
            value: "subject_id",
          },
          {
            label: t("workloads.subjectAssignments.columns.hours"),
            value: "hours_per_subject",
          },
        ]}
        filterSchema={[]}
        customActions={true}
        refetchTrigger={refetchTrigger}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("workloads.subjectAssignments.form.title.create")}
            </DialogTitle>
          </DialogHeader>
          <SubjectAssignmentForm
            workload={workload}
            onSubmit={handleSaveAssignment}
            onCancel={() => setIsCreateOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t("workloads.subjectAssignments.form.title.edit")}
            </DialogTitle>
          </DialogHeader>
          <SubjectAssignmentForm
            workload={workload}
            assignment={editingAssignment}
            maxHours={getAvailableHours(editingAssignment)}
            onSubmit={handleSaveAssignment}
            onCancel={() => {
              setIsEditOpen(false);
              setEditingAssignment(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SubjectAssignmentsList;
