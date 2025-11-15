import React from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useEntityMutation } from "@/hooks/useEntityMutation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FacultyForm from "./FacultyForm";

export default function FacultyModal({ isOpen, faculty, onClose, onSuccess }) {
  const { t } = useTranslation();
  const isEdit = !!faculty;
  const createFaculty = useEntityMutation("faculty", "create");
  const updateFaculty = useEntityMutation("faculty", "patch");
  const queryClient = useQueryClient();

  const handleSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateFaculty.mutateAsync({ id: faculty.id, data: values });
        toast.success(t("faculties.messages.updateSuccess"));
      } else {
        await createFaculty.mutateAsync(values);
        toast.success(t("faculties.messages.createSuccess"));
      }

      // Сначала инвалидируем кеш
      queryClient.invalidateQueries({
        queryKey: ["faculty"],
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
          ? t("faculties.messages.updateError")
          : t("faculties.messages.createError")
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("faculties.form.title.edit")
              : t("faculties.form.title.create")}
          </DialogTitle>
        </DialogHeader>
        <div>
          <FacultyForm
            defaultValues={faculty}
            isEdit={isEdit}
            onSubmit={handleSubmit}
            showButtons={false}
            isLoading={createFaculty.isPending || updateFaculty.isPending}
          />
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("faculties.form.buttons.cancel")}
          </Button>
          <Button
            type="submit"
            form="faculty-form"
            disabled={createFaculty.isPending || updateFaculty.isPending}
          >
            {createFaculty.isPending || updateFaculty.isPending
              ? t("faculties.form.buttons.saving")
              : isEdit
              ? t("faculties.form.buttons.update")
              : t("faculties.form.buttons.create")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
