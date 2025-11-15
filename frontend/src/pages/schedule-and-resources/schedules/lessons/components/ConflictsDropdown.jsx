import React from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, ChevronDown } from "lucide-react";
import { useSchedulePageData } from "@/contexts/SchedulePageContext";
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
  const { conflicts, hasConflicts, totalConflicts, conflictsLoading } =
    useSchedulePageData();

  const single = conflicts?.single || [];
  const shared = conflicts?.shared || [];
  const total_single = single.reduce((sum, group) => sum + group.count, 0);
  const total_shared = shared.reduce((sum, group) => sum + group.count, 0);

  // Функции для работы с конфликтами
  const getConflictIcon = (type) => {
    switch (type) {
      case "room":
        return "🏢";
      case "professor":
        return "👨‍🏫";
      case "group":
        return "👥";
      default:
        return "⚠️";
    }
  };

  const getConflictColor = (type) => {
    switch (type) {
      case "room":
        return "border-red-500 bg-red-50 text-red-700";
      case "professor":
        return "border-orange-500 bg-orange-50 text-orange-700";
      case "group":
        return "border-yellow-500 bg-yellow-50 text-yellow-700";
      default:
        return "border-gray-500 bg-gray-50 text-gray-700";
    }
  };

  const getConflictBadgeColor = (type) => {
    switch (type) {
      case "room":
        return "bg-red-100 text-red-800 border-red-200";
      case "professor":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "group":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (conflictsLoading) {
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
        className="w-96 max-h-80 overflow-y-hidden p-0"
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
            <div className="text-green-600 mb-2">✅</div>
            <p className="text-sm text-muted-foreground">
              {t("lessons.conflicts.noConflictsMessage")}
            </p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto">
            {/* Single Schedule Conflicts */}
            {single.length > 0 && (
              <div>
                <div className="px-3 py-2 bg-gray-100 border-b">
                  <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    📋{" "}
                    {t("lessons.conflicts.types.internal", {
                      count: total_single,
                    })}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("lessons.conflicts.types.internalDescription")}
                  </p>
                </div>
                {single.map((group, groupIndex) => (
                  <div key={`single-${groupIndex}`}>
                    <div className="px-3 py-1 bg-gray-50 border-b">
                      <span className="text-xs font-medium text-gray-700 flex items-center gap-1">
                        {getConflictIcon(group.type)} {group.type.toUpperCase()}{" "}
                        ({group.count})
                      </span>
                    </div>
                    {group.conflicts.map((conflict, conflictIndex) => (
                      <ConflictItem
                        key={`single-${group.type}-${conflictIndex}`}
                        conflict={conflict}
                        onNavigateToConflict={onNavigateToConflict}
                        getConflictColor={getConflictColor}
                        getConflictIcon={getConflictIcon}
                        getConflictBadgeColor={getConflictBadgeColor}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Shared Schedule Conflicts */}
            {shared.length > 0 && (
              <div>
                <div className="px-3 py-2 bg-blue-100 border-b">
                  <h5 className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    🔄{" "}
                    {t("lessons.conflicts.types.crossSchedule", {
                      count: total_shared,
                    })}
                  </h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {t("lessons.conflicts.types.crossScheduleDescription")}
                  </p>
                </div>
                {shared.map((group, groupIndex) => (
                  <div key={`shared-${groupIndex}`}>
                    <div className="px-3 py-1 bg-blue-50 border-b">
                      <span className="text-xs font-medium text-blue-700 flex items-center gap-1">
                        {getConflictIcon(group.type)} {group.type.toUpperCase()}{" "}
                        ({group.count})
                      </span>
                    </div>
                    {group.conflicts.map((conflict, conflictIndex) => (
                      <ConflictItem
                        key={`shared-${group.type}-${conflictIndex}`}
                        conflict={conflict}
                        onNavigateToConflict={onNavigateToConflict}
                        getConflictColor={getConflictColor}
                        getConflictIcon={getConflictIcon}
                        getConflictBadgeColor={getConflictBadgeColor}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Вынесенный компонент для отображения одного конфликта
function ConflictItem({
  conflict,
  onNavigateToConflict,
  getConflictColor,
  getConflictIcon,
  getConflictBadgeColor,
}) {
  const { t } = useTranslation();
  const { schedule } = useSchedulePageData();

  const handleClick = () => {
    const firstLesson = conflict.lessons[0];
    const lessonDate = new Date(firstLesson.date);

    onNavigateToConflict(conflict);
    toast.info(`Navigated to ${firstLesson.date} - ${conflict.message}`);
  };

  return (
    <div
      className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-gray-50 transition-colors ${getConflictColor(
        conflict.type
      )}`}
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">
          {getConflictIcon(conflict.type)}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge
              variant="outline"
              className={`text-xs ${getConflictBadgeColor(conflict.type)}`}
            >
              {conflict.type.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {conflict.lessons[0]?.date} • {conflict.lessons[0]?.start_time}-
              {conflict.lessons[0]?.end_time}
            </span>
          </div>

          <p className="text-sm font-medium text-gray-900 mb-2">
            {conflict.message}
          </p>

          <div className="space-y-1">
            {conflict.lessons.map((lesson, lessonIndex) => (
              <div
                key={lessonIndex}
                className="flex items-center justify-between text-xs bg-white bg-opacity-60 rounded px-2 py-1"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{lesson.group?.name}</span>
                  <span className="text-muted-foreground">•</span>
                  <span>{lesson.subject?.name}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>
                    {lesson.professor?.name} {lesson.professor?.surname}
                  </span>
                  {lesson.schedule?.id !== schedule?.id && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {t("lessons.conflicts.otherScheduleBadge")}
                    </Badge>
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
