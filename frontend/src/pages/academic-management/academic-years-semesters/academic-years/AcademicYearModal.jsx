import React from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AcademicYearForm } from "./AcademicYearForm";
import { useEntityMutation } from "@/hooks/useEntityMutation";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

export const AcademicYearModal = ({
  isOpen,
  academicYear,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const isEdit = !!academicYear;
  const createYear = useEntityMutation("academic_year", "create");
  const updateYear = useEntityMutation("academic_year", "patch");
  const queryClient = useQueryClient();

  const handleSubmit = async (values) => {
    console.log("🔄 AcademicYearModal: Starting submit", { isEdit, values });

    try {
      if (isEdit) {
        console.log(
          "📝 AcademicYearModal: Updating academic year",
          academicYear.id
        );
        await updateYear.mutateAsync({ id: academicYear.id, data: values });
        toast.success(t("academicYears.messages.updateSuccess"));
      } else {
        console.log("➞ AcademicYearModal: Creating academic year");
        await createYear.mutateAsync(values);
        toast.success(t("academicYears.messages.createSuccess"));
      }

     
      console.log("🗑️ AcademicYearModal: Invalidating queries");
      queryClient.invalidateQueries({
        queryKey: ["academic_year"],
        exact: false,
      });

    
      console.log("🔄 AcademicYearModal: Calling onSuccess", {
        hasOnSuccess: !!onSuccess,
      });
      if (onSuccess) {
        onSuccess();
      } else {
        console.log("🚪 AcademicYearModal: No onSuccess, calling onClose");
        onClose();
      }
    } catch (error) {
      toast.error(
        error.message ||
          (isEdit
            ? t("academicYears.messages.updateError")
            : t("academicYears.messages.createError"))
      );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit
              ? t("academicYears.form.title.edit")
              : t("academicYears.form.title.create")}
          </DialogTitle>
        </DialogHeader>
        <AcademicYearForm
          defaultValues={
            isEdit
              ? {
                  name: academicYear.name,
                  start_date: academicYear.start_date,
                  end_date: academicYear.end_date,
                  is_current: academicYear.is_current,
                }
              : {
                  name: "",
                  start_date: "",
                  end_date: "",
                  is_current: false,
                }
          }
          isEdit={isEdit}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isLoading={createYear.isPending || updateYear.isPending}
        />
      </DialogContent>
    </Dialog>
  );
};
