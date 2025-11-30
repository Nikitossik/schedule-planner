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
import { Users } from "lucide-react";

export function GroupSelector({
  value,
  onChange,
  groups = [],
  isLoading = false,
  error,
  disabled = false,
}) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Users className="h-4 w-4" />
        {t("lessons.form.fields.group")}
      </label>
      <Select
        value={value}
        onValueChange={onChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger>
          <SelectValue
            placeholder={
              isLoading
                ? t("common.loading")
                : t("lessons.form.placeholders.selectGroup")
            }
          />
        </SelectTrigger>
        <SelectContent>
          {groups.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              {t("lessons.form.messages.noGroups")}
            </div>
          ) : (
            groups.map((group) => (
              <SelectItem key={group.id} value={group.id.toString()}>
                {group.name}
                {group.study_form && (
                  <Badge variant="outline" className="ml-2">
                    {group.study_form.form}
                  </Badge>
                )}
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
