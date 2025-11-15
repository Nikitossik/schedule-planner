import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Edit, Trash2 } from "lucide-react";

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
              {assignment.subject?.code && (
                <div className="text-xs text-gray-500">
                  {assignment.subject.code}
                </div>
              )}
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
        header: t("workloads.subjectAssignments.columns.actions"),
        cell: ({ row }) => {
          const assignment = row.original;

          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={() => onEdit(assignment)}
                  className="cursor-pointer"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {t("common.edit")}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => onDelete(assignment.id)}
                  className="cursor-pointer text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t("common.delete")}
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
