import React from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen } from "lucide-react";

export function SubjectSelector({
  value,
  onChange,
  assignments = [],
  selectedWorkloadId,
  error,
  disabled = false,
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <BookOpen className="h-4 w-4" />
        {t("lessons.form.fields.subject")}
      </label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={!selectedWorkloadId || disabled}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={
              selectedWorkloadId
                ? t("lessons.form.placeholders.selectSubject")
                : t("lessons.form.placeholders.selectProfessorFirst")
            }
          />
        </SelectTrigger>
        <SelectContent>
          {assignments.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              {!selectedWorkloadId
                ? t("lessons.form.messages.selectProfessorFirst")
                : t("lessons.form.messages.noSubjects")}
            </div>
          ) : (
            assignments.map((assignment) => (
              <SelectItem key={assignment.id} value={assignment.id.toString()}>
                <div className="flex items-center">
                  <BookOpen className="h-4 w-4 mr-2" />
                  {assignment.subject?.name}
                  <span className="text-sm text-gray-500 ml-2">
                    {assignment.hours_per_subject}h
                  </span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
