import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useEntityMutation } from "@/hooks/useEntityMutation";
import ScheduleForm from "./ScheduleForm";

export default function ScheduleModal({ isOpen, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const createSchedule = useEntityMutation("schedule", "create");

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      await createSchedule.mutateAsync(values);
      toast.success(t("schedules.messages.createSuccess"));
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.message || t("schedules.messages.createError"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("schedules.form.title.create")}</DialogTitle>
          <DialogDescription>
            {t("schedules.form.description.create")}
          </DialogDescription>
        </DialogHeader>
        <ScheduleForm
          id="schedule-form"
          defaultValues={{
            name: "",
            academic_year_id: "",
            semester_id: "",
            direction_id: "",
          }}
          isEdit={false}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
