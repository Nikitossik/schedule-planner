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
import HolidayForm from "./HolidayForm";

export default function HolidayModal({ isOpen, holiday, onClose, onSuccess }) {
  const { t } = useTranslation();
  const isEdit = !!holiday;
  const createHoliday = useEntityMutation("university_holiday", "create");
  const updateHoliday = useEntityMutation("university_holiday", "patch");
  const queryClient = useQueryClient();

  const handleSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateHoliday.mutateAsync({ id: holiday.id, data: values });
        toast.success(t("holidays.messages.updateSuccess"));
      } else {
        await createHoliday.mutateAsync(values);
        toast.success(t("holidays.messages.createSuccess"));
      }

      // Сначала инвалидируем кеш
      queryClient.invalidateQueries({
        queryKey: ["university_holiday"],
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
          ? error.message || t("holidays.messages.updateError")
          : error.message || t("holidays.messages.createError")
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("holidays.form.title.edit")
              : t("holidays.form.title.create")}
          </DialogTitle>
        </DialogHeader>
        <div className="max-w-2xl">
          <HolidayForm
            defaultValues={holiday}
            isEdit={isEdit}
            onSubmit={handleSubmit}
            showButtons={false}
            isLoading={createHoliday.isPending || updateHoliday.isPending}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.buttons.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={createHoliday.isPending || updateHoliday.isPending}
            form="holiday-form"
          >
            {createHoliday.isPending || updateHoliday.isPending
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
