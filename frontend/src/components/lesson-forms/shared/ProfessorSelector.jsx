import React from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User } from "lucide-react";

export function ProfessorSelector({
  value,
  onChange,
  workloads = [],
  selectedGroupIds, // Массив выбранных групп
  isProfessorAvailable,
  error,
  disabled = false,
}) {
  const { t } = useTranslation();

  // Проверяем, есть ли выбранные группы
  const hasSelectedGroups = selectedGroupIds && selectedGroupIds.length > 0;

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <User className="h-4 w-4" />
        {t("lessons.form.fields.professor")}
      </label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={!hasSelectedGroups || disabled}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={
              hasSelectedGroups
                ? t("lessons.form.placeholders.selectProfessor")
                : t("lessons.form.placeholders.selectGroupFirst")
            }
          />
        </SelectTrigger>
        <SelectContent>
          {workloads.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              {!hasSelectedGroups
                ? t("lessons.form.messages.selectGroupFirst")
                : t("lessons.form.messages.noProfessors")}
            </div>
          ) : (
            workloads.map((workload) => {
              const isAvailable = isProfessorAvailable
                ? isProfessorAvailable(workload)
                : true;
              return (
                <SelectItem key={workload.id} value={workload.id.toString()}>
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      backgroundColor:
                        workload.professor.professor_profile?.color,
                    }}
                  />
                  {workload?.professor.professor_profile?.academic_title}{" "}
                  {workload?.professor.name} {workload?.professor.surname}
                  <span className="text-sm text-gray-500">
                    ({workload?.assigned_hours}h)
                  </span>
                  <span className="text-sm text-gray-500">
                    ({workload?.study_form?.form})
                  </span>
                  {!isAvailable && (
                    <Badge variant="destructive" className="ml-2">
                      {t("lessons.form.messages.unavailable")}
                    </Badge>
                  )}
                </SelectItem>
              );
            })
          )}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
