"use client";

import * as React from "react";
import { Clock } from "lucide-react";
import { Label } from "@/components/ui/label";
import { TimePickerInput } from "./time-picker-input";
import { useTranslation } from "react-i18next";

export function TimePicker({
  date,
  setDate,
  showHours = true,
  showMinutes = true,
  showSeconds = false,
}) {
  const { t } = useTranslation();
  const minuteRef = React.useRef(null);
  const hourRef = React.useRef(null);
  const secondRef = React.useRef(null);

  // Determine navigation based on what's visible
  const getNextFocus = (current) => {
    if (current === "hours" && showMinutes) return minuteRef;
    if (current === "hours" && showSeconds) return secondRef;
    if (current === "minutes" && showSeconds) return secondRef;
    return null;
  };

  const getPrevFocus = (current) => {
    if (current === "seconds" && showMinutes) return minuteRef;
    if (current === "seconds" && showHours) return hourRef;
    if (current === "minutes" && showHours) return hourRef;
    return null;
  };

  return (
    <div className="flex items-end gap-2">
      {showHours && (
        <div className="grid gap-1 text-center">
          <Label htmlFor="hours" className="text-xs">
            {t("timePicker.hours")}
          </Label>
          <TimePickerInput
            picker="hours"
            date={date}
            setDate={setDate}
            ref={hourRef}
            onRightFocus={() => getNextFocus("hours")?.current?.focus()}
          />
        </div>
      )}
      {showMinutes && (
        <div className="grid gap-1 text-center">
          <Label htmlFor="minutes" className="text-xs">
            {t("timePicker.minutes")}
          </Label>
          <TimePickerInput
            picker="minutes"
            date={date}
            setDate={setDate}
            ref={minuteRef}
            onLeftFocus={() => getPrevFocus("minutes")?.current?.focus()}
            onRightFocus={() => getNextFocus("minutes")?.current?.focus()}
          />
        </div>
      )}
      {showSeconds && (
        <div className="grid gap-1 text-center">
          <Label htmlFor="seconds" className="text-xs">
            {t("timePicker.seconds")}
          </Label>
          <TimePickerInput
            picker="seconds"
            date={date}
            setDate={setDate}
            ref={secondRef}
            onLeftFocus={() => getPrevFocus("seconds")?.current?.focus()}
          />
        </div>
      )}
      <div className="flex h-10 items-center">
        <Clock className="ml-2 h-4 w-4" />
      </div>
    </div>
  );
}
