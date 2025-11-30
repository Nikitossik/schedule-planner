import React from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/timepicker/time-picker";
import { Calendar, Clock } from "lucide-react";

export function DateTimeSection({
  mode = "single", // "single" | "range"
  // Single date mode
  date,
  onDateChange,
  // Date range mode
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  // Time fields (common)
  startTimeDate,
  setStartTimeDate,
  endTimeDate,
  setEndTimeDate,
  // Validation
  disabledDates = [],
  errors = {},
  // Additional props for range mode
  minDate,
}) {
  const { t } = useTranslation();

  // When start time changes, ensure end time is not before it
  const handleStartTimeChange = (newStartTime) => {
    setStartTimeDate(newStartTime);

    // If end time is before new start time, adjust it
    if (newStartTime && endTimeDate && endTimeDate <= newStartTime) {
      const adjustedEndTime = new Date(newStartTime);
      adjustedEndTime.setMinutes(adjustedEndTime.getMinutes() + 15); // Add 15 minutes minimum
      setEndTimeDate(adjustedEndTime);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {mode === "single"
            ? t("lessons.form.sections.dateTime")
            : t("recurringLessons.form.sections.dateTimeRange")}
        </h3>

        <div className="space-y-4">
          {/* Single date mode */}
          {mode === "single" && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                {t("lessons.form.fields.date")}
              </label>
              <DatePicker
                value={date}
                onChange={onDateChange}
                modal={true}
                placeholder={t("lessons.form.placeholders.selectDate")}
                disabled={disabledDates}
              />
              {errors.date && (
                <p className="text-sm text-red-500">{errors.date.message}</p>
              )}
            </div>
          )}

          {/* Date range mode */}
          {mode === "range" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("recurringLessons.form.fields.startDate")}
                </label>
                <DatePicker
                  value={startDate}
                  onChange={onStartDateChange}
                  modal={true}
                  placeholder={t(
                    "recurringLessons.form.placeholders.selectStartDate"
                  )}
                  disabled={minDate ? [(date) => date < minDate] : []}
                />
                {errors.start_date && (
                  <p className="text-sm text-red-500">
                    {errors.start_date.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("recurringLessons.form.fields.endDate")}
                </label>
                <DatePicker
                  value={endDate}
                  onChange={onEndDateChange}
                  modal={true}
                  placeholder={t(
                    "recurringLessons.form.placeholders.selectEndDate"
                  )}
                  disabled={[
                    ...(minDate ? [(date) => date < minDate] : []),
                    ...(startDate
                      ? [(date) => date <= new Date(startDate)]
                      : []),
                  ]}
                />
                {errors.end_date && (
                  <p className="text-sm text-red-500">
                    {errors.end_date.message}
                  </p>
                )}
              </div>
            </>
          )}

          {/* Time range (common for both modes) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("lessons.form.fields.startTime")}
              </label>
              <TimePicker
                date={startTimeDate}
                setDate={handleStartTimeChange}
                showSeconds={false}
              />
              {errors.start_time && (
                <p className="text-sm text-red-500">
                  {errors.start_time.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                {t("lessons.form.fields.endTime")}
              </label>
              <TimePicker
                date={endTimeDate}
                setDate={setEndTimeDate}
                showSeconds={false}
              />
              {errors.end_time && (
                <p className="text-sm text-red-500">
                  {errors.end_time.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
