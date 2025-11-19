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
import RoomForm from "./RoomForm";

export default function RoomModal({ isOpen, onClose, room = null, onSuccess }) {
  const { t } = useTranslation();
  const isEdit = Boolean(room);
  const [isLoading, setIsLoading] = useState(false);

  const createRoom = useEntityMutation("room", "create");
  const updateRoom = useEntityMutation("room", "patch");

  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      if (isEdit) {
        await updateRoom.mutateAsync({ id: room.id, data: values });
        toast.success(t("rooms.messages.updateSuccess"));
      } else {
        await createRoom.mutateAsync(values);
        toast.success(t("rooms.messages.createSuccess"));
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(
        error.message ||
          t(
            isEdit ? "rooms.messages.updateError" : "rooms.messages.createError"
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
            {isEdit ? t("rooms.form.title.edit") : t("rooms.form.title.create")}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t("rooms.form.description.edit")
              : t("rooms.form.description.create")}
          </DialogDescription>
        </DialogHeader>
        <RoomForm
          id="room-form"
          defaultValues={room}
          isEdit={isEdit}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </DialogContent>
    </Dialog>
  );
}
