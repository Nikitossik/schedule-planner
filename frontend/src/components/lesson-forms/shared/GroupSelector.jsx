import React from "react";
import { useTranslation } from "react-i18next";
import {
  MultiSelect,
  MultiSelectTrigger,
  MultiSelectValue,
  MultiSelectContent,
  MultiSelectItem,
  MultiSelectGroup,
} from "@/components/ui/multi-select";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

export function GroupSelector({
  value,
  onChange,
  groups = [],
  isLoading = false,
  error,
  disabled = false,
  placeholder,
}) {
  const { t } = useTranslation();

  // Определяем placeholder
  const getPlaceholder = () => {
    if (isLoading) return t("common.loading");
    if (placeholder) return placeholder;
    return t("lessons.form.placeholders.selectGroups");
  };

  // Обработка значений для мульти-селекта
  const handleMultiChange = (selectedValues) => {
    // Конвертируем строковые ID в числа
    const numericValues = selectedValues.map((val) => parseInt(val));
    onChange(numericValues);
  };

  // Конвертируем значение для мульти-селекта в строки (только для UI)
  const multiValue = Array.isArray(value)
    ? value.map((id) => id.toString())
    : [];

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium flex items-center gap-2">
        <Users className="h-4 w-4" />
        {t("lessons.form.fields.groups")}
      </label>
      <MultiSelect values={multiValue} onValuesChange={handleMultiChange}>
        <MultiSelectTrigger disabled={disabled || isLoading}>
          <MultiSelectValue placeholder={getPlaceholder()} />
        </MultiSelectTrigger>
        <MultiSelectContent search={false}>
          <MultiSelectGroup>
            {groups.length === 0 ? (
              <div className="p-2 text-sm text-muted-foreground text-center">
                {t("lessons.form.messages.noGroups")}
              </div>
            ) : (
              groups.map((group) => (
                <MultiSelectItem
                  key={group.id}
                  value={group.id.toString()}
                  badgeLabel={group.name}
                >
                  <div className="flex items-center gap-2">
                    <span>{group.name}</span>
                  </div>
                </MultiSelectItem>
              ))
            )}
          </MultiSelectGroup>
        </MultiSelectContent>
      </MultiSelect>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
