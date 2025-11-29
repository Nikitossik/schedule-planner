import React from "react";
import { useTranslation } from "react-i18next";
import { Clock, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSchedulePageData } from "@/contexts/SchedulePageContext";

export function WorkloadWarningsDropdown({ onNavigateToLessons }) {
  const { t } = useTranslation();
  const {
    professorWarnings,
    subjectWarnings,
    totalProfessorWarnings,
    totalSubjectWarnings,
    totalWarnings,
    hasWorkloadIssues,
    workloadLoading,
  } = useSchedulePageData();

  if (workloadLoading) {
    return (
      <Button variant="outline" disabled>
        <Clock className="h-4 w-4 mr-2" />
        {t("lessons.workloadWarnings.loading")}
      </Button>
    );
  }

  if (!hasWorkloadIssues) {
    return (
      <Button variant="outline" className="text-green-600">
        <Clock className="h-4 w-4 mr-2" />
        {t("lessons.workloadWarnings.hoursOk")}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="text-amber-600">
          <AlertTriangle className="h-4 w-4 mr-2" />
          {t("lessons.workloadWarnings.hoursIssues")}
          <Badge variant="destructive" className="ml-2">
            {totalWarnings}
          </Badge>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {t("lessons.workloadWarnings.title")}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {/* Предупреждения по преподавателям */}
        {professorWarnings.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
              {t("lessons.workloadWarnings.professorSection")}
            </div>
            {professorWarnings.map((warning) => (
              <DropdownMenuItem
                key={warning.subject_assignment_id}
                className="cursor-pointer p-3"
                onClick={() =>
                  onNavigateToLessons && onNavigateToLessons(warning.lessons)
                }
              >
                <div className="space-y-1 w-full">
                  <div className="font-medium text-amber-600 flex items-center justify-between">
                    <span>
                      {t("lessons.workloadWarnings.assignmentExceeded")}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      +{warning.excess_hours.toFixed(1)}h
                    </Badge>
                  </div>

                  <div className="text-sm space-y-1">
                    <div className="font-medium text-foreground">
                      {warning.professor_name}
                    </div>
                    <div className="text-muted-foreground">
                      {warning.subject_name}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>{t("lessons.workloadWarnings.scheduled")}</span>
                      <span className="font-medium">
                        {warning.scheduled_hours}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("lessons.workloadWarnings.allowed")}</span>
                      <span className="font-medium">
                        {warning.allowed_hours}h
                      </span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>{t("lessons.workloadWarnings.excess")}</span>
                      <span className="font-medium">
                        +{warning.excess_hours.toFixed(1)}h
                      </span>
                    </div>
                  </div>

                  {warning.lessons && (
                    <div className="text-xs text-muted-foreground">
                      {t("lessons.workloadWarnings.lessonsAffected", {
                        count: warning.lessons.length,
                        s: warning.lessons.length !== 1 ? "s" : "",
                      })}
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {/* Разделитель между секциями */}
        {professorWarnings.length > 0 && subjectWarnings.length > 0 && (
          <DropdownMenuSeparator />
        )}

        {/* Предупреждения по предметам */}
        {subjectWarnings.length > 0 && (
          <>
            <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
              {t("lessons.workloadWarnings.subjectSection")}
            </div>
            {subjectWarnings.map((warning) => (
              <DropdownMenuItem
                key={warning.subject_id}
                className="cursor-pointer p-3"
                onClick={() =>
                  onNavigateToLessons && onNavigateToLessons(warning.lessons)
                }
              >
                <div className="space-y-1 w-full">
                  <div className="font-medium text-orange-600 flex items-center justify-between">
                    <span>{t("lessons.workloadWarnings.subjectExceeded")}</span>
                    <Badge variant="outline" className="text-xs">
                      +{warning.excess_hours.toFixed(1)}h
                    </Badge>
                  </div>

                  <div className="text-sm space-y-1">
                    <div className="font-medium text-foreground">
                      {warning.subject_name}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      {warning.subject_code}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>{t("lessons.workloadWarnings.scheduled")}</span>
                      <span className="font-medium">
                        {warning.scheduled_hours.toFixed(1)}h
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("lessons.workloadWarnings.allocated")}</span>
                      <span className="font-medium">
                        {warning.allocated_hours}h
                      </span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>{t("lessons.workloadWarnings.excess")}</span>
                      <span className="font-medium">
                        +{warning.excess_hours.toFixed(1)}h
                      </span>
                    </div>
                  </div>

                  {warning.lessons && (
                    <div className="text-xs text-muted-foreground">
                      {t("lessons.workloadWarnings.lessonsAffected", {
                        count: warning.lessons.length,
                        s: warning.lessons.length !== 1 ? "s" : "",
                      })}
                    </div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </>
        )}

        {totalWarnings > 3 && (
          <>
            <DropdownMenuSeparator />
            <div className="p-2 text-xs text-center text-muted-foreground">
              {t("lessons.workloadWarnings.showingWarnings", {
                shown: Math.min(3, totalWarnings),
                total: totalWarnings,
              })}
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
