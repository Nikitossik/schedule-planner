"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { enUS, pl } from "react-day-picker/locale";

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  modal = false,
  minDate,
  maxDate,
  locale, // Опциональный проп для переопределения
}) {
  const [open, setOpen] = React.useState(false);
  const { i18n } = useTranslation();

  // Автоматически определяем локаль на основе текущего языка i18n
  const getCalendarLocale = () => {
    if (locale) return locale; // Если передана явно, используем её

    console.log("LANG:", i18n.language);

    switch (i18n.language) {
      case "pl":
        return pl;
      case "en":
      default:
        return enUS;
    }
  };

  const calendarLocale = getCalendarLocale();

  // Преобразуем строковое значение в объект Date правильно (без проблем с часовыми поясами)
  const selectedDate =
    value && value !== "" ? new Date(value + "T00:00:00") : undefined;
  const isValid = selectedDate && !isNaN(selectedDate?.getTime());

  // Определяем месяц для отображения в календаре
  const defaultMonth = isValid ? selectedDate : new Date();

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between font-normal"
        >
          {isValid
            ? selectedDate.toLocaleDateString(i18n.language)
            : placeholder}
          <ChevronDownIcon className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto overflow-hidden p-0" align="start">
        <Calendar
          mode="single"
          locale={calendarLocale}
          selected={isValid ? selectedDate : undefined}
          defaultMonth={defaultMonth}
          captionLayout="dropdown"
          disabled={(date) => {
            if (minDate && date < new Date(minDate + "T00:00:00")) return true;
            if (maxDate && date > new Date(maxDate + "T00:00:00")) return true;
            return false;
          }}
          onSelect={(date) => {
            if (date) {
              // Форматируем дату правильно, избегая проблем с часовыми поясами
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              onChange(`${year}-${month}-${day}`);
              setOpen(false);
            }
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
