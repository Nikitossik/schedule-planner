import React from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Laptop, Building2 } from "lucide-react";

export function LocationSection({
  isOnline,
  onIsOnlineChange,
  roomId,
  onRoomChange,
  rooms = [],
  error,
  disabled = false,
  requireDateTime = false,
  hasDateTime = false,
}) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <MapPin className="h-4 w-4" />
          {t("lessons.form.sections.location")}
        </h3>

        {/* Room selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {t("lessons.form.fields.room")}
          </label>
          <Select
            value={roomId || "no-room"}
            onValueChange={(value) => {
              if (value === "no-room") {
                onRoomChange(null);
              } else {
                onRoomChange(value);
                // Если выбран кабинет, убираем онлайн
                if (isOnline) {
                  onIsOnlineChange(false);
                }
              }
            }}
            disabled={disabled || (requireDateTime && !hasDateTime)}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={
                  requireDateTime && !hasDateTime
                    ? t("lessons.form.placeholders.setDateTimeFirst")
                    : t("lessons.form.placeholders.selectRoom")
                }
              />
            </SelectTrigger>
            <SelectContent>
              {/* Опция "Без кабинета" */}
              <SelectItem value="no-room">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2 opacity-50" />
                  {t("lessons.form.options.noRoom")}
                </div>
              </SelectItem>
              {rooms.length === 0 ? (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  {requireDateTime && !hasDateTime
                    ? t("lessons.form.messages.setDateTimeForRooms")
                    : t("lessons.form.messages.noRooms")}
                </div>
              ) : (
                rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id.toString()}>
                    <div className="flex items-center">
                      <Building2 className="h-4 w-4 mr-2" />
                      {room.number}
                      <span className="text-sm text-gray-500 ml-2">
                        (capacity: {room.capacity})
                      </span>
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>

        {/* Online toggle */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="is_online"
            checked={isOnline}
            onCheckedChange={(checked) => {
              onIsOnlineChange(checked);
              // Если выбран онлайн, убираем кабинет
              if (checked && roomId) {
                onRoomChange(null);
              }
            }}
          />
          <label htmlFor="is_online" className="text-sm font-medium">
            {t("lessons.form.fields.onlineLesson")}
          </label>
        </div>

        {isOnline && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700 flex items-center gap-2">
              <Laptop className="h-4 w-4" />
              {t("lessons.form.messages.onlineLesson")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
