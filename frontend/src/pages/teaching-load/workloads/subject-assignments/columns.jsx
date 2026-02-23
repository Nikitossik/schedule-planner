import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

export function useSubjectAssignmentColumns(onEdit, onDelete) {
  const { t } = useTranslation();

  return useMemo(
    () => [
      {
        accessorKey: "id",
        header: t("workloads.subjectAssignments.columns.id"),
        cell: ({ row }) => (
          <span className="font-mono text-sm">{row.original.id}</span>
        ),
      },
      {
        header: t("workloads.subjectAssignments.columns.subject"),
        cell: ({ row }) => {
          const assignment = row.original;
          return (
            <div className="space-y-1">
              <div className="font-medium">{assignment.subject?.name}</div>
            </div>
          );
        },
      },
      {
        accessorKey: "hours_per_subject",
        header: t("workloads.subjectAssignments.columns.hours"),
        cell: ({ row }) => row.original.hours_per_subject,
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const assignment = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{t("datatable.actions")}</DropdownMenuLabel>
                <DropdownMenuItem
                  onClick={() => onEdit(assignment)}
                  className="cursor-pointer"
                >
                  <Pencil className="h-4 w-4" />
                  {t("datatable.edit")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  className="cursor-pointer"
                  onClick={() => onDelete(assignment.id)}
                >
                  <Trash2 className="h-4 w-4" />
                  {t("datatable.delete")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          );
        },
      },
    ],
    [t, onEdit, onDelete]
  );
}

export const columns = useSubjectAssignmentColumns;
