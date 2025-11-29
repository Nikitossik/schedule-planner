import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, momentLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import moment from "moment";
import "moment/locale/pl";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./LessonsCalendar.css";

import { Users, User, MapPin } from "lucide-react";

moment.updateLocale("en", {
  week: {
    dow: 1, // Monday is the first day of the week
  },
});

import { useCalendarLessons } from "@/hooks/useCalendarLessons";
import { useEntityList } from "@/hooks/useEntityList";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConflictsDropdown } from "./components/ConflictsDropdown";
import { WorkloadWarningsDropdown } from "./components/WorkloadWarningsDropdown";
import { EventComponent } from "./components/EventComponent";

// Импортируем все утилиты
import {
  getDateRange,
  createResourcesFromLessons,
  transformLessonsToEvents,
  darkenColor,
  createEventDropHandler,
  createEventResizeHandler,
  createNavigateToLessonsHandler,
  createNavigateToConflictHandler,
  createSelectEventHandler,
  createSelectSlotHandler,
  createNavigateHandler,
  createViewChangeHandler,
  logDebugInfo,
} from "./utils";

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

// Локализованные сообщения для календаря
const getCalendarMessages = (t, language) => {
  const baseMessages = {
    allDay: t("lessons.calendar.navigation.allDay"),
    previous: t("lessons.calendar.navigation.previous"),
    next: t("lessons.calendar.navigation.next"),
    today: t("lessons.calendar.navigation.today"),
    week: t("lessons.calendar.navigation.week"),
    day: t("lessons.calendar.navigation.day"),
    date: t("lessons.calendar.navigation.date"),
    time: t("lessons.calendar.navigation.time"),
    event: t("lessons.calendar.navigation.event"),
    noEventsInRange: t("lessons.calendar.navigation.noEventsInRange"),
    showMore: (total) => t("lessons.calendar.navigation.showMore", { total }),
  };

  // Дополнительные сообщения для польского языка
  if (language === "pl") {
    return {
      ...baseMessages,
      month: "Miesiąc",
      agenda: "Agenda",
      work_week: "Tydzień roboczy",
    };
  }

  // Дополнительные сообщения для английского языка
  return {
    ...baseMessages,
    month: "Month",
    agenda: "Agenda",
    work_week: "Work Week",
  };
};

export function LessonsCalendar({
  schedule,
  onEditLesson,
  onUpdateLesson,
  onCreateLesson,
  refreshTrigger,
}) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();

  // Устанавливаем локаль для moment
  useEffect(() => {
    moment.locale(i18n.language === "pl" ? "pl" : "en");
  }, [i18n.language]);

  // Получаем локализованные сообщения
  const calendarMessages = getCalendarMessages(t, i18n.language);

  // Функции для инвалидации кеша
  const invalidateConflictsCache = () => {
    queryClient.invalidateQueries(["conflicts-summary", schedule?.id]);
  };

  const invalidateWorkloadCache = () => {
    queryClient.invalidateQueries(["local-workload-warnings", schedule?.id]);
  };

  // Состояние для навигации и вида календаря
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState("week");
  const [groupBy, setGroupBy] = useState("none");

  // Вычисляем период для загрузки уроков
  const dateRange = getDateRange(currentDate, currentView);

  // Загружаем уроки для данного расписания и периода
  const {
    data: lessonsData,
    isLoading,
    refetch,
  } = useCalendarLessons(schedule?.id, dateRange.date_from, dateRange.date_to);

  // Загружаем праздники для того же периода
  const { data: holidaysData, isLoading: holidaysLoading } = useEntityList(
    "university_holiday",
    {
      pagination: {
        loadAll: true,
      },
      filters: {
        date_from: dateRange.date_from,
        date_to: dateRange.date_to,
      },
    }
  );

  const holidays = holidaysData?.items || [];

  const lessons = lessonsData?.items || [];

  // Отладочная информация для праздников
  console.log("Holidays data:", holidays);
  console.log("Date range:", dateRange);

  // Создаем Set для быстрой проверки праздничных дат и мапу с информацией о праздниках
  const holidayDatesSet = useMemo(() => {
    const dates = new Set();
    const currentYear = new Date().getFullYear();

    holidays.forEach((h) => {
      const holidayDate = new Date(h.date);

      if (h.is_annual) {
        // Для ежегодных праздников создаем даты для текущего года и соседних лет
        for (let year = currentYear - 1; year <= currentYear + 1; year++) {
          const annualDate = new Date(
            year,
            holidayDate.getMonth(),
            holidayDate.getDate()
          );
          dates.add(format(annualDate, "yyyy-MM-dd"));
        }
      } else {
        // Для обычных праздников используем указанную дату
        dates.add(format(holidayDate, "yyyy-MM-dd"));
      }
    });

    console.log("Holiday dates set:", Array.from(dates));
    return dates;
  }, [holidays]);

  const holidayInfoMap = useMemo(() => {
    const map = new Map();
    const currentYear = new Date().getFullYear();

    holidays.forEach((h) => {
      const holidayDate = new Date(h.date);

      if (h.is_annual) {
        // Для ежегодных праздников создаем записи для текущего года и соседних лет
        for (let year = currentYear - 1; year <= currentYear + 1; year++) {
          const annualDate = new Date(
            year,
            holidayDate.getMonth(),
            holidayDate.getDate()
          );
          const dateKey = format(annualDate, "yyyy-MM-dd");
          map.set(dateKey, {
            ...h,
            date: format(annualDate, "yyyy-MM-dd"),
          });
        }
      } else {
        // Для обычных праздников используем указанную дату
        map.set(format(holidayDate, "yyyy-MM-dd"), h);
      }
    });

    console.log("Holiday info map:", map);
    return map;
  }, [holidays]);

  // Функция проверки праздника
  const isHolidayDate = useMemo(
    () => (date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      return holidayDatesSet.has(dateStr);
    },
    [holidayDatesSet]
  );

  // Функция получения информации о празднике
  const getHolidayInfo = useMemo(
    () => (date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      return holidayInfoMap.get(dateStr);
    },
    [holidayInfoMap]
  );

  // Создаем ресурсы и события
  const resources = createResourcesFromLessons(lessons, groupBy);
  const events = transformLessonsToEvents(lessons, groupBy);

  // Кастомные форматы календаря с поддержкой праздников
  const customFormats = useMemo(
    () => ({
      dayFormat: (date, culture, localizer) => {
        const dayNumber = localizer.format(date, "DD", culture);
        const holiday = getHolidayInfo(date);
        if (holiday) {
          const holidayName =
            holiday.name || t("holidays.defaultName", "Выходной день");
          return `${dayNumber} (${holidayName})`;
        }
        return dayNumber;
      },
      dayHeaderFormat: (date, culture, localizer) => {
        const dayHeader = localizer.format(date, "ddd DD", culture);
        const holiday = getHolidayInfo(date);
        if (holiday) {
          const holidayName =
            holiday.name || t("holidays.defaultName", "Выходной день");
          return `${dayHeader} (${holidayName})`;
        }
        return dayHeader;
      },
    }),
    [getHolidayInfo, t]
  );

  // Создаем обработчики
  const handleNavigateToLessons = createNavigateToLessonsHandler(
    setCurrentDate,
    setCurrentView
  );
  const handleNavigateToConflict = createNavigateToConflictHandler(
    setCurrentDate,
    setCurrentView
  );
  const handleSelectEvent = createSelectEventHandler(onEditLesson);
  const handleSelectSlot = useMemo(() => {
    return (slotInfo) => {
      // Блокируем создание событий в праздничные дни
      if (isHolidayDate(slotInfo.start)) {
        console.log("Blocked slot selection on holiday:", slotInfo.start);
        return false;
      }
      // Используем оригинальный обработчик для обычных дней
      return createSelectSlotHandler(
        onCreateLesson,
        isHolidayDate,
        t
      )(slotInfo);
    };
  }, [onCreateLesson, isHolidayDate, t]);
  const handleNavigate = createNavigateHandler(setCurrentDate);
  const handleViewChange = createViewChangeHandler(setCurrentView);

  const handleEventDrop = useMemo(() => {
    return (args) => {
      // Проверяем, не пытаемся ли мы сбросить событие на праздничный день
      if (args.start && isHolidayDate(args.start)) {
        console.log("Blocked event drop on holiday:", args.start);
        // Показываем уведомление пользователю
        if (t) {
          alert(
            t(
              "lessons.holidayBlockedMessage",
              "На праздничный день нельзя назначать занятия"
            )
          );
        }
        return false;
      }

      // Используем оригинальный обработчик для обычных дней
      return createEventDropHandler(
        lessons,
        schedule,
        groupBy,
        onUpdateLesson,
        refetch,
        invalidateConflictsCache,
        invalidateWorkloadCache
      )(args);
    };
  }, [
    lessons,
    schedule,
    groupBy,
    onUpdateLesson,
    refetch,
    invalidateConflictsCache,
    invalidateWorkloadCache,
    isHolidayDate,
    t,
  ]);

  const handleEventResize = useMemo(() => {
    return (args) => {
      // Проверяем, не пытаемся ли мы изменить размер события на праздничный день
      if (
        (args.start && isHolidayDate(args.start)) ||
        (args.end && isHolidayDate(args.end))
      ) {
        console.log("Blocked event resize on holiday:", args.start || args.end);
        // Показываем уведомление пользователю
        if (t) {
          alert(
            t(
              "lessons.holidayBlockedMessage",
              "На праздничный день нельзя назначать занятия"
            )
          );
        }
        return false;
      }

      // Используем оригинальный обработчик для обычных дней
      return createEventResizeHandler(
        schedule,
        onUpdateLesson,
        refetch,
        invalidateConflictsCache,
        invalidateWorkloadCache
      )(args);
    };
  }, [
    schedule,
    onUpdateLesson,
    refetch,
    invalidateConflictsCache,
    invalidateWorkloadCache,
    isHolidayDate,
    t,
  ]);

  // Рефетч данных при изменении refreshTrigger
  useEffect(() => {
    if (refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  // Рефетч при изменении даты или вида календаря
  useEffect(() => {
    refetch();
  }, [currentDate, currentView, refetch]);

  // Отладочная информация
  useEffect(() => {
    logDebugInfo(currentView, groupBy, lessons, resources, events);
  }, [lessons, groupBy, currentView, resources, events]);

  if (isLoading) {
    return (
      <div className="h-[700px] bg-background border rounded-lg p-4 flex items-center justify-center">
        <div className="text-muted-foreground">
          {t("lessons.calendar.loading")}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-background flex justify-between gap-4 flex-wrap border rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold">
            {t("lessons.calendar.title")}
          </h3>
          <Select value={groupBy} onValueChange={setGroupBy}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">
                <span className="flex items-center gap-2">
                  {t("lessons.calendar.groupOptions.none")}
                </span>
              </SelectItem>
              <SelectItem value="group">
                <span className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("lessons.calendar.groupOptions.group")}
                </span>
              </SelectItem>
              <SelectItem value="professor">
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {t("lessons.calendar.groupOptions.professor")}
                </span>
              </SelectItem>
              <SelectItem value="room">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t("lessons.calendar.groupOptions.room")}
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <WorkloadWarningsDropdown
            onNavigateToLessons={handleNavigateToLessons}
          />
          <ConflictsDropdown onNavigateToConflict={handleNavigateToConflict} />
        </div>
      </div>

      <div className="h-[700px] max-w-[1240px] relative bg-background border rounded-lg p-4">
        <div className="mb-2 pb-2 border-b border-border">
          <div className="text-sm text-muted-foreground text-center">
            {t("lessons.calendar.lessonsScheduled", { count: lessons.length })}
            {resources &&
              ` • ${t("lessons.calendar.resourcesCount", {
                count: resources.length,
                type: groupBy,
              })}`}
          </div>
        </div>

        <div className="h-[calc(100%-60px)]">
          <DnDCalendar
            culture={i18n.language}
            localizer={localizer}
            events={events}
            resources={resources}
            resourceIdAccessor="resourceId"
            resourceTitleAccessor="resourceTitle"
            startAccessor="start"
            endAccessor="end"
            titleAccessor="title"
            views={["week", "day"]}
            view={currentView}
            date={currentDate}
            onView={handleViewChange}
            onNavigate={handleNavigate}
            step={30}
            timeslots={2}
            formats={customFormats}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            selectRangeFormat={() => false}
            longPressThreshold={10}
            popup
            showMultiDayTimes
            scrollToTime={new Date(1970, 1, 1, 8)}
            min={new Date(1970, 1, 1, 8, 0, 0)}
            max={new Date(1970, 1, 1, 22, 0, 0)}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            resizable
            draggableAccessor={(event) => {
              return !event.isHoliday;
            }}
            components={{
              event: (eventProps) => (
                <EventComponent {...eventProps} groupBy={groupBy} />
              ),
            }}
            eventPropGetter={(event) => {
              // Стили для уроков
              const subjectColor =
                event.resource?.lesson?.subject?.color || "#000";
              const borderColor = darkenColor(subjectColor, 0.2);

              return {
                style: {
                  backgroundColor: subjectColor,
                  borderColor: borderColor,
                  color: "white",
                  fontSize: "12px",
                },
              };
            }}
            dayPropGetter={(date) => {
              if (isHolidayDate(date)) {
                return {
                  className: "holiday-day",
                  style: {
                    cursor: "not-allowed",
                    pointerEvents: "none",
                  },
                };
              }
              return {};
            }}
            slotPropGetter={(date) => {
              if (isHolidayDate(date)) {
                return {
                  className: "holiday-slot",
                  style: {
                    cursor: "not-allowed",
                    pointerEvents: "none",
                  },
                };
              }
              return {};
            }}
            messages={calendarMessages}
          />
        </div>
      </div>
    </>
  );
}
