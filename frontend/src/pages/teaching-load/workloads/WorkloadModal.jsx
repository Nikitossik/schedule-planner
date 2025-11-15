import React from "react";
import { useTranslation } from "react-i18next";
import { useEntityMutation } from "@/hooks/useEntityMutation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import WorkloadForm from "./WorkloadForm";

export default function WorkloadModal({
  isOpen,
  workload,
  onClose,
  onSuccess,
}) {
  const { t } = useTranslation();
  const isEdit = !!workload;
  const createWorkload = useEntityMutation("professor_workload", "create");
  const updateWorkload = useEntityMutation("professor_workload", "patch");
  const queryClient = useQueryClient();

  const handleSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateWorkload.mutateAsync({ id: workload.id, data: values });
        toast.success(t("workloads.messages.updateSuccess"));
      } else {
        await createWorkload.mutateAsync(values);
        toast.success(t("workloads.messages.createSuccess"));
      }

      // Сначала инвалидируем кеш
      queryClient.invalidateQueries({
        queryKey: ["professor_workload"],
        exact: false,
      });

      // Потом вызываем коллбек
      if (onSuccess) {
        onSuccess();
      } else {
        onClose();
      }
    } catch (error) {
      toast.error(
        error.message ||
          t(
            isEdit
              ? "workloads.messages.updateError"
              : "workloads.messages.createError"
          )
      );
    }
  };

  // Преобразуем данные для формы
  const defaultValues = isEdit
    ? {
        contract_id: workload?.contract?.id || "",
        study_form_id: workload?.study_form?.id || "",
        assigned_hours: workload?.assigned_hours || "",
      }
    : {
        contract_id: "",
        study_form_id: "",
        assigned_hours: "",
      };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t(
              isEdit
                ? "workloads.form.title.edit"
                : "workloads.form.title.create"
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="max-w-2xl">
          <WorkloadForm
            defaultValues={defaultValues}
            isEdit={isEdit}
            onSubmit={handleSubmit}
            showButtons={false}
            isLoading={createWorkload.isPending || updateWorkload.isPending}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={createWorkload.isPending || updateWorkload.isPending}
            form="workload-form"
          >
            {createWorkload.isPending || updateWorkload.isPending
              ? t("common.buttons.saving")
              : isEdit
              ? t("common.buttons.update")
              : t("common.buttons.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
