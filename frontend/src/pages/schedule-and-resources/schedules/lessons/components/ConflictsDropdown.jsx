import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useScheduleAnalysisData } from "@/contexts/ScheduleAnalysisContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export function ConflictsDropdown({ onNavigateToConflict }) {
  const { t } = useTranslation();
  const {
    roomConflicts,
    professorConflicts,
    groupConflicts,
    hasConflicts,
    totalConflicts,
    totalSingleScheduleConflicts,
    totalCrossScheduleConflicts,
    analysisLoading,
  } = useScheduleAnalysisData();

  // Функции для работы с конфликтами

  const getConflictColor = (type) => {
    switch (type) {
      case "room_double_booking":
      case "room":
        return "border-red-500 bg-red-50 text-red-700";
      case "professor_time_conflict":
      case "professor":
        return "border-orange-500 bg-orange-50 text-orange-700";
      case "group_schedule_conflict":
      case "group":
        return "border-yellow-500 bg-yellow-50 text-yellow-700";
      default:
        return "border-gray-500 bg-gray-50 text-gray-700";
    }
  };

  const getConflictBadgeColor = (type) => {
    switch (type) {
      case "room_double_booking":
      case "room":
        return "bg-red-100 text-red-800 border-red-200";
      case "professor_time_conflict":
      case "professor":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "group_schedule_conflict":
      case "group":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (analysisLoading) {
    return (
      <Button variant="outline" disabled className="gap-2">
        <AlertTriangle className="h-4 w-4" />
        {t("lessons.conflicts.loading")}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={hasConflicts ? "destructive" : "outline"}
          className="gap-2"
        >
          <AlertTriangle className="h-4 w-4" />
          {t("lessons.conflicts.title")}
          {hasConflicts && (
            <Badge variant="secondary" className="ml-1 bg-white text-red-600">
              {totalConflicts}
            </Badge>
          )}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="max-w-md max-h-90 overflow-y-hidden p-0"
        align="end"
      >
        <div className="p-3 border-b bg-gray-50">
          <h4 className="font-semibold text-sm">
            {hasConflicts
              ? t("lessons.conflicts.foundConflicts", {
                  count: totalConflicts,
                  s: totalConflicts > 1 ? "s" : "",
                })
              : t("lessons.conflicts.noConflicts")}
          </h4>
          {hasConflicts && (
            <p className="text-xs text-muted-foreground mt-1">
              {t("lessons.conflicts.clickToNavigate")}
            </p>
          )}
        </div>

        {!hasConflicts ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {t("lessons.conflicts.noConflictsMessage")}
            </p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {/* Single Schedule Conflicts */}
            {totalSingleScheduleConflicts > 0 && (
              <div>
                <div className="px-3 py-2 bg-gray-100 border-b">
                  <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    📋{" "}
                    {t("lessons.conflicts.types.internal", {
                      count: totalSingleScheduleConflicts,
                    })}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("lessons.conflicts.types.internalDescription")}
                  </p>
                </div>

                {/* Room Conflicts - Single Schedule */}
                {roomConflicts?.single_schedule?.length > 0 && (
                  <ConflictSection
                    type="room"
                    conflicts={roomConflicts.single_schedule}
                    onNavigateToConflict={onNavigateToConflict}
                    getConflictColor={getConflictColor}
                    getConflictBadgeColor={getConflictBadgeColor}
                  />
                )}

                {/* Professor Conflicts - Single Schedule */}
                {professorConflicts?.single_schedule?.length > 0 && (
                  <ConflictSection
                    type="professor"
                    conflicts={professorConflicts.single_schedule}
                    onNavigateToConflict={onNavigateToConflict}
                    getConflictColor={getConflictColor}
                    getConflictBadgeColor={getConflictBadgeColor}
                  />
                )}

                {/* Group Conflicts - Single Schedule */}
                {groupConflicts?.single_schedule?.length > 0 && (
                  <ConflictSection
                    type="group"
                    conflicts={groupConflicts.single_schedule}
                    onNavigateToConflict={onNavigateToConflict}
                    getConflictColor={getConflictColor}
                    getConflictBadgeColor={getConflictBadgeColor}
                  />
                )}
              </div>
            )}

            {/* Cross Schedule Conflicts */}
            {totalCrossScheduleConflicts > 0 && (
              <div>
                <div className="px-3 py-2 bg-blue-100 border-b">
                  <h5 className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    🔄{" "}
                    {t("lessons.conflicts.types.crossSchedule", {
                      count: totalCrossScheduleConflicts,
                    })}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("lessons.conflicts.types.crossScheduleDescription")}
                  </p>
                </div>

                {/* Room Conflicts - Cross Schedule */}
                {roomConflicts?.cross_schedule?.length > 0 && (
                  <ConflictSection
                    type="room"
                    conflicts={roomConflicts.cross_schedule}
                    onNavigateToConflict={onNavigateToConflict}
                    getConflictColor={getConflictColor}
                    getConflictBadgeColor={getConflictBadgeColor}
                  />
                )}

                {/* Professor Conflicts - Cross Schedule */}
                {professorConflicts?.cross_schedule?.length > 0 && (
                  <ConflictSection
                    type="professor"
                    conflicts={professorConflicts.cross_schedule}
                    onNavigateToConflict={onNavigateToConflict}
                    getConflictColor={getConflictColor}
                    getConflictBadgeColor={getConflictBadgeColor}
                  />
                )}

                {/* Group Conflicts - Cross Schedule */}
                {groupConflicts?.cross_schedule?.length > 0 && (
                  <ConflictSection
                    type="group"
                    conflicts={groupConflicts.cross_schedule}
                    onNavigateToConflict={onNavigateToConflict}
                    getConflictColor={getConflictColor}
                    getConflictBadgeColor={getConflictBadgeColor}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Компонент для отображения секции конфликтов определенного типа
function ConflictSection({
  type,
  conflicts,
  onNavigateToConflict,
  getConflictColor,
  getConflictBadgeColor,
}) {
  const { t } = useTranslation();

  const getTypeTitle = (conflictType) => {
    switch (conflictType) {
      case "room":
        return t("lessons.conflicts.sections.rooms");
      case "professor":
        return t("lessons.conflicts.sections.professors");
      case "group":
        return t("lessons.conflicts.sections.groups");
      default:
        return conflictType;
    }
  };

  return (
    <div>
      <div className="px-3 py-1 bg-gray-50 border-b">
        <span className="text-xs font-medium text-gray-700">
          {getTypeTitle(type)} ({conflicts.length})
        </span>
      </div>
      {conflicts.map((conflict, conflictIndex) => (
        <ConflictItem
          key={`${type}-${conflictIndex}`}
          conflict={conflict}
          onNavigateToConflict={onNavigateToConflict}
          getConflictColor={getConflictColor}
          getConflictBadgeColor={getConflictBadgeColor}
        />
      ))}
    </div>
  );
}

// Вынесенный компонент для отображения одного конфликта
function ConflictItem({
  conflict,
  onNavigateToConflict,
  getConflictColor,
  getConflictBadgeColor,
}) {
  const { t, i18n } = useTranslation();
  const { schedule } = useScheduleAnalysisData();

  // Функция для форматирования времени без секунд
  const formatTime = (timeString) => {
    return timeString.slice(0, 5); // "08:00:00" -> "08:00"
  };

  // Функция для форматирования даты
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language, {
      month: "2-digit",
      day: "2-digit",
    });
  };

  // Функция для построения сообщения о конфликте
  const buildConflictMessage = (conflict) => {
    const firstLesson = conflict.lessons[0];
    const timeRange = `${formatTime(firstLesson.start_time)}-${formatTime(
      firstLesson.end_time
    )}`;

    // Определяем, есть ли конфликт между разными расписаниями
    const isCrossSchedule = conflict.schedules_involved?.length > 1;

    // Используем resource_name из схемы конфликта
    const resourceName = conflict.resource_name;

    switch (conflict.type) {
      case "group_schedule_conflict":
      case "group":
        return isCrossSchedule
          ? t("lessons.conflicts.messages.groupCrossSchedule", {
              group: resourceName,
              time: timeRange,
            })
          : t("lessons.conflicts.messages.groupSingleSchedule", {
              group: resourceName,
              time: timeRange,
            });

      case "room_double_booking":
      case "room":
        return isCrossSchedule
          ? t("lessons.conflicts.messages.roomCrossSchedule", {
              room: resourceName,
              time: timeRange,
            })
          : t("lessons.conflicts.messages.roomSingleSchedule", {
              room: resourceName,
              time: timeRange,
            });

      case "professor_time_conflict":
      case "professor":
        return isCrossSchedule
          ? t("lessons.conflicts.messages.professorCrossSchedule", {
              professor: resourceName,
              time: timeRange,
            })
          : t("lessons.conflicts.messages.professorSingleSchedule", {
              professor: resourceName,
              time: timeRange,
            });

      default:
        return `${resourceName} conflict at ${timeRange}`;
    }
  };

  const handleClick = () => {
    const firstLesson = conflict.lessons[0];

    onNavigateToConflict(conflict);
    toast.info(
      `Navigated to ${formatDate(firstLesson.date)} - ${buildConflictMessage(
        conflict
      )}`
    );
  };

  return (
    <div
      className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${getConflictColor(
        conflict.type
      )}`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-muted-foreground">
              {formatDate(conflict.lessons[0]?.date)} •{" "}
              {formatTime(conflict.lessons[0]?.start_time)}-
              {formatTime(conflict.lessons[0]?.end_time)}
            </span>
          </div>

          <p className="text-sm font-medium text-gray-900 mb-2">
            {buildConflictMessage(conflict)}
          </p>

          <div className="space-y-2">
            {conflict.lessons.map((lesson, lessonIndex) => (
              <div
                key={lessonIndex}
                className="text-xs bg-white bg-opacity-60 rounded px-3 py-2 space-y-1"
              >
                {/* Информация о предмете и группе (если не конфликт группы) */}
                <div className="flex flex-col space-y-1">
                  {conflict.type !== "group_schedule_conflict" &&
                    conflict.type !== "group" && (
                      <div className="font-medium text-gray-800">
                        {lesson.group_name}
                      </div>
                    )}

                  <div className="text-gray-700">{lesson.subject_name}</div>

                  {/* Преподаватель (если не конфликт преподавателя) */}
                  {conflict.type !== "professor_time_conflict" &&
                    conflict.type !== "professor" && (
                      <div className="text-gray-600">
                        {lesson.professor_full_name}
                      </div>
                    )}

                  {/* Комната (если не конфликт комнаты) */}
                  {conflict.type !== "room_double_booking" &&
                    conflict.type !== "room" && (
                      <div className="text-gray-600">{lesson.room_number}</div>
                    )}

                  {/* Название плана (если это другой план) */}
                  {lesson.schedule_name !== schedule?.name && (
                    <div className="text-blue-700 font-medium">
                      {t("entities.plan")}: {lesson.schedule_name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
