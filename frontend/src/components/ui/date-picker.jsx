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
  locale,
  captionLayout = "dropdown",
  hideYear = false,
  fromYear,
  toYear,
  disabled,
  ...props
}) {
  const [open, setOpen] = React.useState(false);
  const { i18n } = useTranslation();

  const getCalendarLocale = () => {
    if (locale) return locale; 

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

  const selectedDate =
    value && value !== "" ? new Date(value + "T00:00:00") : undefined;
  const isValid = selectedDate && !isNaN(selectedDate?.getTime());

  const defaultMonth = isValid ? selectedDate : new Date();

  const currentYear = new Date().getFullYear();
  const yearFrom = fromYear ?? currentYear;
  const yearTo = toYear ?? currentYear + 10;

  return (
    <Popover open={open} onOpenChange={setOpen} modal={modal}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between font-normal"
        >
          {isValid
            ? captionLayout === "dropdown-months"
              ? 
                selectedDate.toLocaleDateString(i18n.language, {
                  day: "2-digit",
                  month: "2-digit",
                })
              : 
                selectedDate.toLocaleDateString(i18n.language)
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
          captionLayout={captionLayout}
          hideYear={hideYear}
          fromYear={yearFrom}
          toYear={yearTo}
          disabled={[
            
            ...(minDate
              ? [(date) => date < new Date(minDate + "T00:00:00")]
              : []),
            ...(maxDate
              ? [(date) => date > new Date(maxDate + "T00:00:00")]
              : []),
            ...(disabled
              ? Array.isArray(disabled)
                ? disabled
                : [disabled]
              : []),
          ].filter(Boolean)}
          onSelect={(date) => {
            if (date) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              onChange(`${year}-${month}-${day}`);
              setOpen(false);
            }
          }}
          {...props}
        />
      </PopoverContent>
    </Popover>
  );
}
