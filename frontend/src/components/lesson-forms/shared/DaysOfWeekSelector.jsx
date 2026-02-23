import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "lucide-react";

export function DaysOfWeekSelector({ value = [], onChange, error }) {
  const { t, i18n } = useTranslation();

  const daysOfWeek = useMemo(() => {
    const locale = i18n?.language === "pl" ? "pl" : "en";

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(2024, 0, 1 + index);
      return {
        value: index,
        short: date.toLocaleDateString(locale, { weekday: "short" }),
        full: date.toLocaleDateString(locale, { weekday: "long" }),
      };
    });
  }, [i18n?.language]);

  const toggleDay = (dayValue) => {
    let currentDays = value || [];
    if (typeof currentDays === "string") {
      try {
        currentDays = JSON.parse(currentDays);
      } catch {
        currentDays = [];
      }
    }

    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter((day) => day !== dayValue)
      : [...currentDays, dayValue].sort();

    onChange(newDays);
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          {t("recurringLessons.form.sections.daysOfWeek")}
        </h3>

        <div className="grid grid-cols-7 gap-2">
          {daysOfWeek.map((day) => (
            <div
              key={day.value}
              className="flex flex-col items-center space-y-2"
            >
              <label className="text-sm font-medium">{day.short}</label>
              <Checkbox
                checked={(value || []).includes(day.value)}
                onCheckedChange={() => toggleDay(day.value)}
              />
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
      </CardContent>
    </Card>
  );
}

export function useDaysOfWeek() {
  const { i18n } = useTranslation();

  return useMemo(() => {
    const locale = i18n?.language === "pl" ? "pl" : "en";

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(2024, 0, 1 + index); 
      return {
        value: index,
        short: date.toLocaleDateString(locale, { weekday: "short" }),
        full: date.toLocaleDateString(locale, { weekday: "long" }),
      };
    });
  }, [i18n?.language]);
}
