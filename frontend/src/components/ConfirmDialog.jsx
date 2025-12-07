import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { usePolishDeclensions } from "@/utils/polish-declensions";

export function ConfirmDialog({ open, onConfirm, onCancel, message, entityType }) {
  const { t } = useTranslation();
  const { getDeleteConfirmMessage } = usePolishDeclensions();

  const confirmMessage = getDeleteConfirmMessage(entityType, message);

  return (
    <Dialog open={open} onOpenChange={onCancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {confirmMessage}
          </DialogTitle>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onCancel}>
            {t("common.confirmDialog.cancel")}
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            {t("common.confirmDialog.delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
