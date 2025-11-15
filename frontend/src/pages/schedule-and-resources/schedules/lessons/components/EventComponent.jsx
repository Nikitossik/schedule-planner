import React from "react";
import { useTranslation } from "react-i18next";
import { Users, User, MapPin, Clock } from "lucide-react";

// Функция для определения классов Tailwind для урока в зависимости от типа
export const getLessonTypeClasses = (lessonType) => {
  const classMap = {
    lecture: {
      background: "bg-blue-500",
      border: "border-blue-600",
      hover: "hover:bg-blue-600",
    },
    practice: {
      background: "bg-emerald-500",
      border: "border-emerald-600",
      hover: "hover:bg-emerald-600",
    },
    lab: {
      background: "bg-amber-500",
      border: "border-amber-600",
      hover: "hover:bg-amber-600",
    },
    seminar: {
      background: "bg-violet-500",
      border: "border-violet-600",
      hover: "hover:bg-violet-600",
    },
  };

  return classMap[lessonType] || classMap.lecture; // По умолчанию lecture
};

// Функция для получения классов при группировке ресурсов
export const getResourceGroupClasses = (resourceIndex) => {
  const classArray = [
    {
      background: "bg-blue-500",
      border: "border-blue-600",
      hover: "hover:bg-blue-600",
    },
    {
      background: "bg-emerald-500",
      border: "border-emerald-600",
      hover: "hover:bg-emerald-600",
    },
    {
      background: "bg-amber-500",
      border: "border-amber-600",
      hover: "hover:bg-amber-600",
    },
    {
      background: "bg-red-500",
      border: "border-red-600",
      hover: "hover:bg-red-600",
    },
    {
      background: "bg-violet-500",
      border: "border-violet-600",
      hover: "hover:bg-violet-600",
    },
    {
      background: "bg-cyan-500",
      border: "border-cyan-600",
      hover: "hover:bg-cyan-600",
    },
    {
      background: "bg-orange-500",
      border: "border-orange-600",
      hover: "hover:bg-orange-600",
    },
    {
      background: "bg-lime-500",
      border: "border-lime-600",
      hover: "hover:bg-lime-600",
    },
  ];

  return classArray[resourceIndex % classArray.length] || classArray[0];
};

// Функция для определения цвета урока в зависимости от типа (для Calendar eventPropGetter)
export const getLessonTypeColor = (lessonType) => {
  const colors = {
    lecture: {
      background: "#3b82f6", // blue-500
      border: "#2563eb", // blue-600
    },
    practice: {
      background: "#10b981", // emerald-500
      border: "#059669", // emerald-600
    },
    lab: {
      background: "#f59e0b", // amber-500
      border: "#d97706", // amber-600
    },
    seminar: {
      background: "#8b5cf6", // violet-500
      border: "#7c3aed", // violet-600
    },
  };

  return colors[lessonType] || colors.lecture; // По умолчанию lecture
};

// Функция для получения цвета при группировке ресурсов
export const getResourceGroupColor = (resourceIndex) => {
  const colors = [
    { background: "#3b82f6", border: "#2563eb" }, // blue
    { background: "#10b981", border: "#059669" }, // emerald
    { background: "#f59e0b", border: "#d97706" }, // amber
    { background: "#ef4444", border: "#dc2626" }, // red
    { background: "#8b5cf6", border: "#7c3aed" }, // violet
    { background: "#06b6d4", border: "#0891b2" }, // cyan
    { background: "#f97316", border: "#ea580c" }, // orange
    { background: "#84cc16", border: "#65a30d" }, // lime
  ];

  return colors[resourceIndex % colors.length] || colors[0];
};

export function EventComponent({ event, groupBy }) {
  const { t } = useTranslation();
  const { resource } = event;
  const isGroupedByGroup = groupBy === "group";
  const isGroupedByProfessor = groupBy === "professor";
  const isGroupedByRoom = groupBy === "room";

  // Получаем цвет предмета
  const subjectColor = resource.lesson.subject?.color || "#6b7280"; // fallback на серый

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
    borderLeftColor: darkenColor(subjectColor, 0.2),
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
