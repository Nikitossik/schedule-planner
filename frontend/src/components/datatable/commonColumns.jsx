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
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const itemId = row.original.id;
  const { canManageUsers, isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const entityDisplayName = displayName || entity;

  // ВСЕ HOOKS ДОЛЖНЫ БЫТЬ ВЫЗВАНЫ ДО ЛЮБЫХ УСЛОВНЫХ RETURN!
  const deleteMutation = useEntityMutation(entity, "delete");

  // Логгирование для диагностики
  console.log("🔍 ActionsCell Debug:", {
    entity,
    isAdmin: isAdmin(),
    canManageUsers: canManageUsers(),
    itemId,
  });

  // Проверяем разрешения
  const canEdit = entity === "user" ? canManageUsers() : true;
  const canDelete = entity === "user" ? canManageUsers() : true;

  // Если нет разрешений на редактирование и удаление, не показываем колонку
  if (!canEdit && !canDelete) {
    console.log("❌ ActionsCell: No permissions, hiding actions");
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
    console.log("🗑️ actionsColumn: Delete clicked", {
      useModal,
      hasOnDelete: !!onDelete,
    });
    if (useModal && onDelete) {
      onDelete(row.original);
      setOpen(false);
    } else {
      deleteMutation.mutate(
        { id: itemId },
        {
          onSuccess: () => {
            console.log(
              "✅ actionsColumn: Delete success, calling invalidateQueries and onRefresh"
            );
            toast.success(
              t("datatable.deleteSuccess", { item: entityDisplayName })
            );
            setOpen(false);
            queryClient.invalidateQueries(["entity", entity]);
            if (onRefresh) {
              onRefresh();
            }
          },
          onError: (err) => {
            console.error("❌ actionsColumn: Delete failed", err);
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
          message={t("datatable.confirmDelete", { item: entityDisplayName })}
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
