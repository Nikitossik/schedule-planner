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
import { UserForm } from "./UserForm";

export default function UserModal({ isOpen, user, onClose, onSuccess }) {
  const { t } = useTranslation();
  const isEdit = !!user;
  const createUser = useEntityMutation("user", "create");
  const updateUser = useEntityMutation("user", "patch");
  const queryClient = useQueryClient();

  const handleSubmit = async (values) => {
    try {
      // Базовые данные пользователя (без профилей)
      const payload = {
        email: values.email,
        name: values.name,
        surname: values.surname,
        role: values.role,
        user_type: values.user_type || null,
      };

      // Добавляем пароль только если он указан
      if (values.password) {
        payload.password = values.password;
      } else if (!isEdit) {
        // При создании пароль обязателен - используем дефолтный если не указан
        payload.password = "password";
      }

      // Формируем профиль студента
      if (values.user_type === "student" && values.group_id) {
        payload.student_profile = {
          group_id: parseInt(values.group_id),
        };
      }

      // Формируем профиль профессора
      if (values.user_type === "professor") {
        payload.professor_profile = {
          notes: values.notes || null,
        };
      }

      if (isEdit) {
        await updateUser.mutateAsync({ id: user.id, data: payload });
        toast.success(t("users.messages.updateSuccess"));
      } else {
        await createUser.mutateAsync(payload);
        toast.success(t("users.messages.createSuccess"));
      }

      // Сначала инвалидируем кеш
      queryClient.invalidateQueries({
        queryKey: ["user"],
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
          ? error.message || t("users.messages.updateError")
          : error.message || t("users.messages.createError")
      );
    }
  };

  const defaultValues = isEdit
    ? user
    : {
        name: "",
        surname: "",
        email: "",
        password: "",
        role: "user",
        user_type: "",
        group_id: "",
        notes: "",
      };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("users.form.title.edit") : t("users.form.title.create")}
          </DialogTitle>
        </DialogHeader>
        <div>
          <UserForm
            defaultValues={defaultValues}
            isEdit={isEdit}
            onSubmit={handleSubmit}
            showButtons={false}
            isLoading={createUser.isPending || updateUser.isPending}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.buttons.cancel")}
          </Button>
          <Button
            type="submit"
            form="user-form"
            disabled={createUser.isPending || updateUser.isPending}
          >
            {createUser.isPending || updateUser.isPending
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
