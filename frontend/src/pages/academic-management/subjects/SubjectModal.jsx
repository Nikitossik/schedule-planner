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
import SubjectForm from "./SubjectForm";

export default function SubjectModal({ isOpen, subject, onClose, onSuccess }) {
  const { t } = useTranslation();
  const isEdit = !!subject;
  const createSubject = useEntityMutation("subject", "create");
  const updateSubject = useEntityMutation("subject", "patch");
  const queryClient = useQueryClient();

  const handleSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateSubject.mutateAsync({ id: subject.id, data: values });
        toast.success(t("subjects.messages.updateSuccess"));
      } else {
        await createSubject.mutateAsync(values);
        toast.success(t("subjects.messages.createSuccess"));
      }

      // Сначала инвалидируем кеш
      queryClient.invalidateQueries({
        queryKey: ["subject"],
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
        isEdit
          ? error.message || t("subjects.messages.updateError")
          : error.message || t("subjects.messages.createError")
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("subjects.form.title.edit")
              : t("subjects.form.title.create")}
          </DialogTitle>
        </DialogHeader>
        <div className="max-w-2xl">
          <SubjectForm
            defaultValues={subject}
            isEdit={isEdit}
            onSubmit={handleSubmit}
            showButtons={false}
            isLoading={createSubject.isPending || updateSubject.isPending}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.buttons.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={createSubject.isPending || updateSubject.isPending}
            form="subject-form"
          >
            {createSubject.isPending || updateSubject.isPending
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
