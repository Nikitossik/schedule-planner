import React from "react";
import { useTranslation } from "react-i18next";
import {
  Users,
  User,
  MapPin,
  Clock,
  Laptop,
  FlaskConical,
  MessageSquare,
  Presentation,
} from "lucide-react";

export function EventComponent({ event, groupBy }) {
  const { t } = useTranslation();

  // Иконки для типов занятий
  const getLessonTypeIcon = (type) => {
    const iconMap = {
      lecture: Presentation,
      practice: Laptop,
      lab: FlaskConical,
      seminar: MessageSquare,
      project: Presentation,
    };
    return iconMap[type] || Presentation;
  };

  // Праздники теперь отображаются в заголовках дней календаря

  const { resource } = event;
  const isGroupedByGroup = groupBy === "group";
  const isGroupedByProfessor = groupBy === "professor";
  const isGroupedByRoom = groupBy === "room";

  return (
    <div className="rbc-event-content transition-colors duration-200">
      <div className="rbc-event-title font-medium">{resource.subject}</div>
      <div className="rbc-event-details text-xs space-y-0.5 mt-1">
        {!isGroupedByGroup && (
          <div className="flex items-center gap-1 group-info">
            <Users className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{resource.groups}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          {(() => {
            const LessonTypeIcon = getLessonTypeIcon(resource.type);
            return <LessonTypeIcon className="h-3 w-3 flex-shrink-0" />;
          })()}
          <span className="truncate">
            {t(`lessons.form.lessonType.${resource.type}`)}
          </span>
        </div>
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
      </div>
    </div>
  );
}
