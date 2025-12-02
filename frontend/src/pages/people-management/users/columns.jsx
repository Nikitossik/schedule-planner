// columns.js

import { actionsColumn } from "@/components/datatable/commonColumns";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

export const useUserColumns = () => {
  const { t } = useTranslation();

  return [
    { accessorKey: "id", header: t("users.table.columns.id") },
    { accessorKey: "name", header: t("users.table.columns.name") },
    { accessorKey: "surname", header: t("users.table.columns.surname") },
    {
      accessorKey: "email",
      header: t("users.table.columns.email"),
      cell: ({ row }) => {
        const role = row.original.role;
        const email = row.original.email;
        return role === "admin" || role === "coordinator" ? email : "-";
      },
    },
    {
      accessorKey: "role",
      header: t("users.table.columns.role"),
      cell: ({ row }) => {
        const role = row.original.role;
        return t(`users.form.roles.${role}`);
      },
    },
    {
      accessorKey: "user_type",
      header: t("users.table.columns.userType"),
      cell: ({ row }) => {
        const userType = row.original.user_type;
        return userType ? t(`users.form.userTypes.${userType}`) : "-";
      },
    },
    {
      accessorKey: "academic_title",
      header: t("users.table.columns.academicTitle"),
      cell: ({ row }) => {
        const academicTitle = row.original.professor_profile?.academic_title;
        return academicTitle || "-";
      },
    },
    {
      accessorKey: "notes",
      header: t("users.table.columns.notes"),
      cell: ({ row }) => {
        const notes = row.original.professor_profile?.notes;

        if (!notes || notes.trim() === "") {
          return <span className="pl-3">{"-"}</span>;
        }

        return (
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title={t("users.table.viewNotes")}
              >
                <Info className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {t("users.table.notesTitle")} - {row.original.name}{" "}
                  {row.original.surname}
                </DialogTitle>
              </DialogHeader>
              <div className="mt-4">
                <p className="text-sm whitespace-pre-wrap">{notes}</p>
              </div>
            </DialogContent>
          </Dialog>
        );
      },
    },
    actionsColumn({ entity: "user", useModal: true }),
  ];
};

// Для обратной совместимости
export const columns = [];
