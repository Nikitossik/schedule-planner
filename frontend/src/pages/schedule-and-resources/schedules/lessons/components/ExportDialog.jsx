import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Download, FileText, X } from "lucide-react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useScheduleAnalysisData } from "@/contexts/ScheduleAnalysisContext";
import { useScheduleExport } from "@/hooks/useScheduleExport";

export function ExportDialog({ children, onExportStateChange }) {
  const { t } = useTranslation();
  const {
    schedule,
    hasConflicts,
    totalConflicts,
    hasWorkloadIssues,
    totalWorkloadIssues,
    groupsInvolved,
    isLoading,
  } = useScheduleAnalysisData();

  const [open, setOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState("excel");
  const [filename, setFilename] = useState("");
  const [errors, setErrors] = useState({});
  const [confirmExport, setConfirmExport] = useState(false);

  const exportSchema = z.object({
    filename: z.string().min(1, t("lessons.export.filename.required")),
  });

  const { exportSchedule, isExporting } = useScheduleExport();

  
  useEffect(() => {
    if (onExportStateChange) {
      onExportStateChange(isExporting);
    }
  }, [isExporting, onExportStateChange]);


  useEffect(() => {
    if (schedule && !filename) {
      const defaultName = schedule.name || "schedule";
      setFilename(defaultName.replace(/[^a-zA-Z0-9_-\s]/g, "_"));
    }
  }, [schedule]);

  const hasIssues = hasConflicts || hasWorkloadIssues;
  const totalIssues = totalConflicts + totalWorkloadIssues;

  const validateForm = () => {
    try {
      exportSchema.parse({
        filename: filename.trim(),
      });
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0]] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleExport = async () => {
    if (!validateForm()) {
      return;
    }

    if (hasIssues && !confirmExport) {
      setConfirmExport(true);
      return;
    }

    try {
      await exportSchedule({
        scheduleId: schedule.id,
        format: exportFormat,
        groupIds: null, 
        filename: filename.trim() || undefined,
      });
      setOpen(false);
      setConfirmExport(false);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  if (isLoading) {
    return (
      <Button disabled className="gap-2">
        <Download className="h-4 w-4" />
        {t("common.loading")}
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {t("lessons.export.title")}
          </DialogTitle>
          <DialogDescription>
            {t("lessons.export.description", { name: schedule?.name })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
        
          {hasIssues && !confirmExport && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">
                    {t("lessons.export.issues.title")}
                  </p>
                  <ul className="text-sm space-y-1">
                    {hasConflicts && (
                      <li>
                        •{" "}
                        {t("lessons.export.issues.conflicts", {
                          count: totalConflicts,
                        })}
                      </li>
                    )}
                    {hasWorkloadIssues && (
                      <li>
                        •{" "}
                        {t("lessons.export.issues.workload", {
                          count: totalWorkloadIssues,
                        })}
                      </li>
                    )}
                  </ul>
                  <p className="text-sm">
                    {t("lessons.export.issues.continueAnyway")}?
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {hasIssues && confirmExport && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{t("lessons.export.issues.confirmed")}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmExport(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </AlertDescription>
            </Alert>
          )}

       
          <div className="space-y-2">
            <Label htmlFor="filename">
              {t("lessons.export.filename.label")}
            </Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => {
                setFilename(e.target.value);
                if (errors.filename && e.target.value.trim()) {
                  setErrors((prev) => ({ ...prev, filename: undefined }));
                }
              }}
              placeholder={t("lessons.export.filename.placeholder")}
              className={errors.filename ? "border-red-500" : ""}
            />
            {errors.filename && (
              <p className="text-sm text-red-500">{errors.filename}</p>
            )}
          </div>

       
          <div className="space-y-3">
            <Label>{t("lessons.export.format.label")}</Label>
            <RadioGroup value={exportFormat} onValueChange={setExportFormat}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excel" id="excel" />
                <Label htmlFor="excel" className="cursor-pointer">
                  <FileText className="inline mr-2 h-4 w-4" />
                  {t("lessons.export.format.excel")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="cursor-pointer">
                  <Download className="inline mr-2 h-4 w-4" />
                  {t("lessons.export.format.pdf")}
                </Label>
              </div>
            </RadioGroup>
          </div>

      
          <div className="flex justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setOpen(false);
                setConfirmExport(false);
                setErrors({});
              }}
            >
              {t("lessons.export.buttons.cancel")}
            </Button>

            {hasIssues && !confirmExport ? (
              <Button
                onClick={() => setConfirmExport(true)}
                variant="destructive"
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                {t("lessons.export.issues.continueAnyway")}
              </Button>
            ) : (
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  t("lessons.export.buttons.exporting")
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    {t("lessons.export.buttons.export", {
                      format: exportFormat.toUpperCase(),
                    })}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
