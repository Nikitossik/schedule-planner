// components/datatable/commonColumns.js

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useEntityMutation } from "@/hooks/useEntityMutation";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";
import { useEntityTranslator } from "@/utils/entityTranslator";
import { usePolishDeclensions } from "@/utils/polish-declensions";

export const selectColumn = {
  id: "select",
  header: ({ table }) => (
    <Checkbox
      checked={
        table.getIsAllPageRowsSelected() ||
        (table.getIsSomePageRowsSelected() && "indeterminate")
      }
      onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      aria-label="Select all"
    />
  ),
  cell: ({ row }) => (
    <Checkbox
      checked={row.getIsSelected()}
      onCheckedChange={(value) => row.toggleSelected(!!value)}
      aria-label="Select row"
    />
  ),
  enableSorting: false,
  enableHiding: false,
};

// Компонент для ячеек действий
function ActionsCell({
  row,
  onEdit,
  onDelete,
  onRefresh,
  entity,
  editUrlBase,
  useModal,
  displayName,
}) {
  const { t } = useTranslation();
  const { translateEntity } = useEntityTranslator();
  const { getDeleteConfirmMessage, getDeleteSuccessMessage } = usePolishDeclensions();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const itemId = row.original.id;
  const { canManageUsers, isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const entityDisplayName = displayName
    ? translateEntity(displayName)
    : translateEntity(entity);

  const deleteMutation = useEntityMutation(entity, "delete");

  // Проверяем разрешения
  const canEdit = entity === "user" ? canManageUsers() : true;
  const canDelete = entity === "user" ? canManageUsers() : true;

  // Если нет разрешений на редактирование и удаление, не показываем колонку
  if (!canEdit && !canDelete) {
    return null;
  }

  const handleEdit = () => {
    if (useModal && onEdit) {
      onEdit(row.original);
    } else {
      navigate(`${editUrlBase}/${itemId}/edit`);
    }
  };

  const handleDelete = () => {
    if (useModal && onDelete) {
      onDelete(row.original);
      setOpen(false);
    } else {
      deleteMutation.mutate(
        { id: itemId },
        {
          onSuccess: () => {
            toast.success(getDeleteSuccessMessage(entity));
            setOpen(false);
            queryClient.invalidateQueries(["entity", entity]);
            if (onRefresh) {
              onRefresh();
            }
          },
          onError: (err) => {
            toast.error(err.message || t("datatable.deleteFailed"));
          },
        }
      );
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("datatable.actions")}</DropdownMenuLabel>
          {canEdit && (
            <>
              <DropdownMenuItem
                onClick={handleEdit}
                className={"cursor-pointer"}
              >
                <Pencil className="h-4 w-4" />
                {t("datatable.edit")}
              </DropdownMenuItem>
              {canDelete && <DropdownMenuSeparator />}
            </>
          )}
          {canDelete && (
            <DropdownMenuItem
              variant="destructive"
              className={"cursor-pointer"}
              onClick={() => setOpen(true)}
            >
              <Trash2 className="h-4 w-4" />
              {t("datatable.delete")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {canDelete && (
        <ConfirmDialog
          open={open}
          onConfirm={handleDelete}
          onCancel={() => setOpen(false)}
          entityType={entity}
        />
      )}
    </>
  );
}

export function actionsColumn({
  entity,
  editUrlBase = "",
  useModal = false,
  displayName,
}) {
  return {
    id: "actions",
    cell: (props) => (
      <ActionsCell
        {...props}
        entity={entity}
        editUrlBase={editUrlBase}
        useModal={useModal}
        displayName={displayName}
      />
    ),
  };
}
