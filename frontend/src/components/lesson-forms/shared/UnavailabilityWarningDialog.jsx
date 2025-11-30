import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

export function UnavailabilityWarningDialog({
  open,
  onOpenChange,
  unavailabilityInfo,
  daysOfWeek,
  onConfirm,
  onCancel,
}) {
  const { t } = useTranslation();

  if (!unavailabilityInfo) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {t("recurringLessons.form.unavailabilityWarning.title")}
          </DialogTitle>
          <DialogDescription className="space-y-4">
            <p>
              {t("recurringLessons.form.unavailabilityWarning.description", {
                professor: unavailabilityInfo?.professorName,
              })}
            </p>

            <div className="space-y-2">
              <p className="font-medium text-foreground">
                {t(
                  "recurringLessons.form.unavailabilityWarning.unavailableDays"
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {unavailabilityInfo?.conflictDays.map((dayValue) => {
                  const dayInfo = daysOfWeek.find((d) => d.value === dayValue);
                  return (
                    <Badge key={dayValue} variant="destructive">
                      {dayInfo?.full || dayValue}
                    </Badge>
                  );
                })}
              </div>
            </div>

            {unavailabilityInfo?.availableDays.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-foreground">
                  {t(
                    "recurringLessons.form.unavailabilityWarning.lessonsWillBeCreatedOn"
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {unavailabilityInfo.availableDays.map((dayValue) => {
                    const dayInfo = daysOfWeek.find(
                      (d) => d.value === dayValue
                    );
                    return (
                      <Badge key={dayValue} variant="secondary">
                        {dayInfo?.full || dayValue}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-sm text-muted-foreground">
              {t("recurringLessons.form.unavailabilityWarning.confirmation")}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            {t("recurringLessons.form.unavailabilityWarning.cancel")}
          </Button>
          <Button type="button" onClick={onConfirm}>
            {t("recurringLessons.form.unavailabilityWarning.continue")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
