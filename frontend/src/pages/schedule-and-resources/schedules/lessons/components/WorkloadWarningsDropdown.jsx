import React from "react";
import { useTranslation } from "react-i18next";
import { Clock, AlertTriangle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useScheduleAnalysisData } from "@/contexts/ScheduleAnalysisContext";

export function WorkloadWarningsDropdown({ onNavigateToLessons }) {
  const { t } = useTranslation();
  const {
    professorWarnings,
    subjectWarnings,
    totalWorkloadIssues,
    hasWorkloadIssues,
    analysisLoading,
  } = useScheduleAnalysisData();

  if (analysisLoading) {
    return (
      <Button variant="outline" disabled>
        <Clock className="h-4 w-4 mr-2" />
        {t("lessons.workloadWarnings.loading")}
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={hasWorkloadIssues ? "text-amber-600 gap-2" : "text-green-600 gap-2"}
        >
          {hasWorkloadIssues ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
          {hasWorkloadIssues 
            ? t("lessons.workloadWarnings.hoursIssues") 
            : t("lessons.workloadWarnings.hoursOk")
          }
          {hasWorkloadIssues && (
            <Badge variant="destructive" className="ml-2">
              {totalWorkloadIssues}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="max-w-md max-h-90 overflow-y-hidden p-0" align="end">
        <div className="p-3 border-b bg-gray-50">
          <h4 className="font-semibold text-sm">
            {hasWorkloadIssues
              ? t("lessons.workloadWarnings.foundIssues", {
                  count: totalWorkloadIssues,
                  s: totalWorkloadIssues > 1 ? "s" : "",
                })
              : t("lessons.workloadWarnings.noIssues")}
          </h4>
          {hasWorkloadIssues && (
            <p className="text-xs text-muted-foreground mt-1">
              {t("lessons.workloadWarnings.clickToNavigate")}
            </p>
          )}
        </div>

        {!hasWorkloadIssues ? (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground">
              {t("lessons.workloadWarnings.noIssuesMessage")}
            </p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto overflow-x-hidden">
         
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
                          {warning.resource_name}
                        </div>
                        <div className="text-muted-foreground">
                          {warning.lessons?.[0]?.subject_name || "Unknown Subject"}
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

        
            {professorWarnings.length > 0 && subjectWarnings.length > 0 && (
              <DropdownMenuSeparator />
            )}

         
            {subjectWarnings.length > 0 && (
              <>
                <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">
                  {t("lessons.workloadWarnings.subjectSection")}
                </div>
                {subjectWarnings.map((warning) => (
                  <DropdownMenuItem
                    key={warning.resource_id}
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
                          {warning.resource_name}
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
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
