import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { actionsColumn } from "@/components/datatable/commonColumns";

export const useRecurringLessonsColumns = () => {
  const { t, i18n } = useTranslation();

  const formatDaysOfWeek = (days) => {
    // Конвертируем JSON строку в массив, если нужно
    const daysArray = typeof days === "string" ? JSON.parse(days) : days;
    if (!Array.isArray(daysArray)) return "";
    const locale = i18n?.language === "pl" ? "pl" : "en";

    return daysArray
      .map((day) => {
        const date = new Date(2024, 0, 1 + day);
        return date.toLocaleDateString(locale, { weekday: "short" });
      })
      .join(", ");
  };

  const formatTime = (time) => {
    if (!time) return "";
    return time.slice(0, 5); // Remove seconds, show HH:MM
  };

  const formatLessonType = (type) => {
    return t(`lessons.form.lessonType.${type}`);
  };

  return [
    { accessorKey: "id", header: "ID" },
    {
      accessorKey: "name",
      header: t("recurringLessons.table.name"),
      cell: ({ row }) => {
        const name = row.original.name;
        if (!name || name.trim() === "") {
          return (
            <Badge variant="secondary" className="text-muted-foreground">
              {t("common.notSet")}
            </Badge>
          );
        }
        return <div className="font-medium">{name}</div>;
      },
    },
    {
      accessorKey: "subject_assignment.subject.name",
      header: t("recurringLessons.table.subject"),
      cell: ({ row }) => {
        const subject = row.original.subject_assignment?.subject;
        return subject ? (
          <div className="flex items-center gap-2">
            <span>{subject.name}</span>
          </div>
        ) : (
          "-"
        );
      },
    },
    {
      accessorKey: "groups",
      header: t("recurringLessons.table.groups"),
      cell: ({ row }) => {
        const groups = row.original.groups;
        if (!groups || groups.length === 0) return "-";

        return (
          <div className="flex flex-wrap gap-1">
            {groups.map((group) => (
              <Badge key={group.id} variant="outline" className="text-xs">
                {group.name}
              </Badge>
            ))}
          </div>
        );
      },
    },
    {
      accessorKey: "professor",
      header: t("recurringLessons.table.professor"),
      cell: ({ row }) => {
        const professor = row.original.professor;
        return professor ? (
          <div className="flex flex-row items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: professor.professor_profile?.color }}
            />
            <span className="font-medium">
              {professor.professor_profile?.academic_title} {professor.name}{" "}
              {professor.surname}
            </span>
          </div>
        ) : (
          "-"
        );
      },
    },
    {
      accessorKey: "lesson_type",
      header: t("recurringLessons.table.type"),
      cell: ({ row }) => (
        <Badge variant="secondary">
          {formatLessonType(row.original.lesson_type)}
        </Badge>
      ),
    },
    {
      accessorKey: "days_of_week",
      header: t("recurringLessons.table.days"),
      cell: ({ row }) => (
        <Badge variant="outline">
          {formatDaysOfWeek(row.original.days_of_week)}
        </Badge>
      ),
    },
    {
      accessorKey: "time",
      header: t("recurringLessons.table.time"),
      cell: ({ row }) => (
        <span className="font-mono text-sm">
          {formatTime(row.original.start_time)} -{" "}
          {formatTime(row.original.end_time)}
        </span>
      ),
    },
    {
      accessorKey: "room",
      header: t("recurringLessons.table.room"),
      cell: ({ row }) => {
        const room = row.original.room;
        if (row.original.is_online) {
          return (
            <Badge variant="outline">
              {t("recurringLessons.table.online")}
            </Badge>
          );
        }
        if (!room) {
          return (
            <Badge variant="secondary" className="text-muted-foreground">
              {t("common.notSet")}
            </Badge>
          );
        }
        return room.number;
      },
    },
    {
      accessorKey: "period",
      header: t("recurringLessons.table.period"),
      cell: ({ row }) => (
        <div className="text-sm">
          <div>{new Date(row.original.start_date).toLocaleDateString()}</div>
          <div className="text-muted-foreground">
            {row.original.end_date
              ? new Date(row.original.end_date).toLocaleDateString()
              : t("recurringLessons.table.semesterEnd")}
          </div>
        </div>
      ),
    },
    actionsColumn({
      entity: "recurring_template",
      useModal: true,
      displayName: "recurring lesson template",
    }),
  ];
};
