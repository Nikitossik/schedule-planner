import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export function FormActions({
  isEdit = false,
  isSubmitting = false,
  onCancel,
  onDelete,
  deleteId,
  showCancelOnCreate = true,
  formType = "lessons", // "lessons" | "recurringLessons"
}) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (onDelete && deleteId) {
      onDelete(deleteId);
    }
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <DialogFooter className="flex justify-between">
        <div>
          {isEdit && onDelete && deleteId && (
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteClick}
              disabled={isSubmitting}
            >
              {t("lessons.form.buttons.delete")}
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          {((!isEdit && showCancelOnCreate) || isEdit) && onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t("lessons.form.buttons.cancel")}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                {isEdit
                  ? t(`${formType}.form.buttons.updating`)
                  : t(`${formType}.form.buttons.creating`)}
              </>
            ) : (
              <>
                {isEdit
                  ? t(`${formType}.form.buttons.update`)
                  : t(`${formType}.form.buttons.create`)}
              </>
            )}
          </Button>
        </div>
      </DialogFooter>

      <ConfirmDialog
        open={showDeleteConfirm}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
        message={t("lessons.form.confirmDelete")}
      />
    </>
  );
}
