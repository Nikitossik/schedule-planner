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
import ContractForm from "./ContractForm";

export default function ContractModal({
  isOpen,
  contract,
  onClose,
  onSuccess,
}) {
  const { t } = useTranslation();
  const isEdit = !!contract;
  const createContract = useEntityMutation("professor_contract", "create");
  const updateContract = useEntityMutation("professor_contract", "patch");
  const queryClient = useQueryClient();

  const handleSubmit = async (values) => {
    try {
      if (isEdit) {
        await updateContract.mutateAsync({ id: contract.id, data: values });
        toast.success(t("contracts.messages.updateSuccess"));
      } else {
        await createContract.mutateAsync(values);
        toast.success(t("contracts.messages.createSuccess"));
      }

      // Сначала инвалидируем кеш
      queryClient.invalidateQueries({
        queryKey: ["professor_contract"],
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
              ? "contracts.messages.updateError"
              : "contracts.messages.createError"
          )
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {t(
              isEdit
                ? "contracts.form.title.edit"
                : "contracts.form.title.create"
            )}
          </DialogTitle>
        </DialogHeader>
        <div>
          <ContractForm
            defaultValues={contract}
            isEdit={isEdit}
            onSubmit={handleSubmit}
            showButtons={false}
            isLoading={createContract.isPending || updateContract.isPending}
          />
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button type="button" variant="outline" onClick={onClose}>
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            disabled={createContract.isPending || updateContract.isPending}
            form="contract-form"
          >
            {createContract.isPending || updateContract.isPending
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
