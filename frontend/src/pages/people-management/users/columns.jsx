// columns.js

import { actionsColumn } from "@/components/datatable/commonColumns";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Info } from "lucide-react";

export const useUserColumns = () => {
  const { t, i18n } = useTranslation();

  const formatUnavailableDays = (unavailableDays) => {
    if (
      !unavailableDays ||
      unavailableDays === "[]" ||
      unavailableDays === ""
    ) {
      return [];
    }

    try {
      const daysArray =
        typeof unavailableDays === "string"
          ? JSON.parse(unavailableDays)
          : unavailableDays;
      if (!Array.isArray(daysArray) || daysArray.length === 0) {
        return [];
      }

      const locale = i18n?.language === "pl" ? "pl" : "en";
      return daysArray.map((day) => {
        const date = new Date(2024, 0, 1 + day);
        return date.toLocaleDateString(locale, { weekday: "short" });
      });
    } catch {
      return [];
    }
  };

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
        if (role === "admin" || role === "coordinator") {
          return email ? email : (
            <Badge variant="secondary" className="text-xs">
              {t("common.notSet")}
            </Badge>
          );
        }
        return (
          <Badge variant="secondary" className="text-xs">
            {t("common.notApplicable")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "role",
      header: t("users.table.columns.role"),
      cell: ({ row }) => {
        const role = row.original.role;
        return (
          <Badge variant="outline" className="text-xs">
            {t(`users.form.roles.${role}`)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "user_type",
      header: t("users.table.columns.userType"),
      cell: ({ row }) => {
        const role = row.original.role;
        const userType = row.original.user_type;
        
        if (role === "admin" || role === "coordinator") {
          return (
            <Badge variant="secondary" className="text-xs">
              {t("common.notApplicable")}
            </Badge>
          );
        }
        
        return userType ? (
          <Badge variant="outline" className="text-xs">
            {t(`users.form.userTypes.${userType}`)}
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            {t("common.notSet")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "academic_title",
      header: t("users.table.columns.academicTitle"),
      cell: ({ row }) => {
        const role = row.original.role;
        const academicTitle = row.original.professor_profile?.academic_title;
        
        if (role === "admin" || role === "coordinator") {
          return (
            <Badge variant="secondary" className="text-xs">
              {t("common.notApplicable")}
            </Badge>
          );
        }
        
        return academicTitle ? (
          <Badge variant="outline" className="text-xs">
            {academicTitle}
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-xs">
            {t("common.notSet")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "notes",
      header: t("users.table.columns.notes"),
      cell: ({ row }) => {
        const role = row.original.role;
        const notes = row.original.professor_profile?.notes;

        if (role === "admin" || role === "coordinator") {
          return (
            <Badge variant="secondary" className="text-xs">
              {t("common.notApplicable")}
            </Badge>
          );
        }

        if (!notes || notes.trim() === "") {
          return (
            <Badge variant="secondary" className="text-xs">
              {t("common.notSet")}
            </Badge>
          );
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
    {
      accessorKey: "color",
      header: t("subjects.table.columns.color"),
      cell: ({ row }) => {
        const role = row.original.role;
        
        if (role === "admin" || role === "coordinator") {
          return (
            <Badge variant="secondary" className="text-xs">
              {t("common.notApplicable")}
            </Badge>
          );
        }
        
        return (
          <div
            className="w-5 h-5 rounded-sm"
            style={{
              backgroundColor: row.original.professor_profile?.color,
            }}
          ></div>
        );
      },
    },
    {
      accessorKey: "unavailable_days",
      header: t("users.table.columns.unavailableDays"),
      cell: ({ row }) => {
        const unavailableDays =
          row.original.professor_profile?.unavailable_days;
        const userType = row.original.user_type;

        const role = row.original.role;
        
        // Не применимо для админов и координаторов
        if (role === "admin" || role === "coordinator") {
          return (
            <Badge variant="secondary" className="text-xs">
              {t("common.notApplicable")}
            </Badge>
          );
        }
        
        // Показываем дни доступности только для профессоров
        if (userType !== "professor") {
          return (
            <Badge variant="secondary" className="text-xs">
              {t("common.notApplicable")}
            </Badge>
          );
        }

        const unavailableDaysArray = formatUnavailableDays(unavailableDays);

        if (unavailableDaysArray.length === 0) {
          return (
            <Badge variant="secondary" className="text-xs">
              {t("users.table.allDaysAvailable")}
            </Badge>
          );
        }

        return (
          <div className="flex flex-wrap gap-1">
            {unavailableDaysArray.map((day, index) => (
              <Badge key={index} variant="destructive" className="text-xs">
                {day}
              </Badge>
            ))}
          </div>
        );
      },
    },
    actionsColumn({ entity: "user", useModal: true }),
  ];
};

// Для обратной совместимости
export const columns = [];
