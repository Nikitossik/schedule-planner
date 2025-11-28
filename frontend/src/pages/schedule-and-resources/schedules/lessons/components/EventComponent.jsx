import React from "react";
import { useTranslation } from "react-i18next";
import { Users, User, MapPin, Clock } from "lucide-react";

export function EventComponent({ event, groupBy }) {
  const { t } = useTranslation();

  // Праздники теперь отображаются в заголовках дней календаря

  const { resource } = event;
  const isGroupedByGroup = groupBy === "group";
  const isGroupedByProfessor = groupBy === "professor";
  const isGroupedByRoom = groupBy === "room";

  // Получаем цвет предмета
  const subjectColor = resource.lesson.subject?.color;

  // Функция для затемнения цвета
  const darkenColor = (hex, factor = 0.2) => {
    const color = hex.replace("#", "");
    const num = parseInt(color, 16);
    const r = Math.max(0, Math.floor((num >> 16) * (1 - factor)));
    const g = Math.max(0, Math.floor(((num >> 8) & 0x00ff) * (1 - factor)));
    const b = Math.max(0, Math.floor((num & 0x0000ff) * (1 - factor)));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  };

  // Всегда используем цвет предмета
  const backgroundStyle = {
    backgroundColor: subjectColor,
    borderLeftColor: subjectColor,
  };

  return (
    <div
      className="rbc-event-content text-white border-l-4 transition-colors duration-200"
      style={backgroundStyle}
    >
      <div className="rbc-event-title font-medium">
        {resource.subject}
        <span className="lesson-type-badge ml-1 px-1.5 py-0.5 text-xs rounded bg-opacity-20 font-normal">
          {t(`lessons.form.lessonType.${resource.type}`)}
        </span>
      </div>
      <div className="rbc-event-details text-xs space-y-0.5 mt-1">
        {!isGroupedByGroup && (
          <div className="flex items-center gap-1 group-info">
            <Users className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{resource.group}</span>
          </div>
        )}
        {!isGroupedByProfessor && (
          <div className="flex items-center gap-1 professor-info">
            <User className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{resource.professor}</span>
          </div>
        )}
        {!isGroupedByRoom && (
          <div className="flex items-center gap-1 room-info">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{resource.room}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3 flex-shrink-0" />
          <span>{resource.timeStr}</span>
        </div>
      </div>
    </div>
  );
}
