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
import GroupForm from "./GroupForm";

export default function GroupModal({
  isOpen,
  onClose,
  group = null,
  onSuccess,
}) {
  const { t } = useTranslation();
  const isEdit = Boolean(group);
  const [isLoading, setIsLoading] = useState(false);

  const createGroup = useEntityMutation("group", "create");
  const updateGroup = useEntityMutation("group", "patch");

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      if (isEdit) {
        await updateGroup.mutateAsync({ id: group.id, data: values });
        toast.success(t("groups.messages.updateSuccess"));
      } else {
        await createGroup.mutateAsync(values);
        toast.success(t("groups.messages.createSuccess"));
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error.message ||
          t(
            isEdit
              ? "groups.messages.updateError"
              : "groups.messages.createError"
          )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t(isEdit ? "groups.form.title.edit" : "groups.form.title.create")}
          </DialogTitle>
        </DialogHeader>
        <GroupForm
          id="group-form"
          defaultValues={group}
          isEdit={isEdit}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
