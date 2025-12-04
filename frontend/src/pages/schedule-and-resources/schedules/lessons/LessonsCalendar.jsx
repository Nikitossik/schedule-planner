import React, { useState, useEffect, useContext } from "react";
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
import { useQueryClient } from "@tanstack/react-query";
import { ScheduleDataContext } from "@/contexts/ScheduleDataContext";
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
    queryClient.invalidateQueries(["combined-warnings", schedule?.id]);
  };

  // Получаем даты начала и конца семестра для ограничения календаря
  const semesterStart = schedule?.semester?.start_date;
  const semesterEnd = schedule?.semester?.end_date;

  // Состояние для навигации и вида календаря
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();

    // Если есть данные семестра - проверяем границы
    if (semesterStart && semesterEnd) {
      const semesterStartDate = new Date(semesterStart);
      const semesterEndDate = new Date(semesterEnd);

      // Если сегодня в пределах семестра - используем сегодня
      if (today >= semesterStartDate && today <= semesterEndDate) {
        return today;
      }
      // Если сегодня до начала семестра - используем начало семестра
      else if (today < semesterStartDate) {
        return semesterStartDate;
      }
      // Если сегодня после конца семестра - используем конец семестра
      else {
        return semesterEndDate;
      }
    }

    // Если нет данных семестра - используем сегодня
    return today;
  });
  const [currentView, setCurrentView] = useState("week");
  const [groupBy, setGroupBy] = useState("none");

  // Вычисляем период для загрузки уроков
  const dateRange = getDateRange(currentDate, currentView);

  // Получаем данные из контекста (с защитой от отсутствия провайдера)
  const scheduleDataContext = useContext(ScheduleDataContext);
  const scheduleData = scheduleDataContext || {
    expandedHolidays: [],
    filterHolidaysByDateRange: () => [],
  };
  const { expandedHolidays, filterHolidaysByDateRange } = scheduleData;

  // Загружаем уроки для данного расписания и периода
  const {
    data: lessonsData,
    isLoading,
    refetch,
  } = useCalendarLessons(schedule?.id, dateRange.date_from, dateRange.date_to);

  const lessons = lessonsData?.items || [];

  // Фильтруем праздники для текущего периода календаря
  const holidaysForPeriod = useMemo(() => {
    return (
      filterHolidaysByDateRange(dateRange.date_from, dateRange.date_to) || []
    );
  }, [filterHolidaysByDateRange, dateRange.date_from, dateRange.date_to]);

  // Создаем Set для быстрой проверки праздничных дат и мапу с информацией о праздниках
  const holidayDatesSet = useMemo(() => {
    const dates = new Set();
    if (holidaysForPeriod && Array.isArray(holidaysForPeriod)) {
      holidaysForPeriod.forEach((holiday) => {
        if (holiday && holiday.date) {
          dates.add(holiday.date);
        }
      });
    }
    return dates;
  }, [holidaysForPeriod]);

  const holidayInfoMap = useMemo(() => {
    const map = new Map();
    if (holidaysForPeriod && Array.isArray(holidaysForPeriod)) {
      holidaysForPeriod.forEach((holiday) => {
        if (holiday && holiday.date) {
          map.set(holiday.date, holiday);
        }
      });
    }
    return map;
  }, [holidaysForPeriod]);

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
            holiday.names && holiday.names.length > 0
              ? holiday.names.join(", ")
              : "Dzień wolny";
          return `${dayNumber} (${holidayName})`;
        }
        return dayNumber;
      },
      dayHeaderFormat: (date, culture, localizer) => {
        const dayHeader = localizer.format(date, "ddd DD", culture);
        const holiday = getHolidayInfo(date);
        if (holiday) {
          const holidayName =
            holiday.names && holiday.names.length > 0
              ? holiday.names.join(", ")
              : "Dzień wolny";
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
  const handleNavigate = useMemo(() => {
    return (newDate) => {
      // Если нет данных о семестре - используем обычную навигацию
      if (!semesterStart || !semesterEnd) {
        return createNavigateHandler(setCurrentDate)(newDate);
      }

      const semesterStartDate = new Date(semesterStart);
      const semesterEndDate = new Date(semesterEnd);

      // Проверяем, находится ли новая дата в пределах семестра
      if (newDate >= semesterStartDate && newDate <= semesterEndDate) {
        setCurrentDate(newDate);
      }
      // Если дата выходит за пределы - устанавливаем граничную дату
      else if (newDate < semesterStartDate) {
        setCurrentDate(semesterStartDate);
      } else if (newDate > semesterEndDate) {
        setCurrentDate(semesterEndDate);
      }
    };
  }, [semesterStart, semesterEnd]);
  const handleViewChange = createViewChangeHandler(setCurrentView);

  const handleEventDrop = useMemo(() => {
    return (args) => {
      // Проверяем, не пытаемся ли мы сбросить событие на праздничный день
      if (args.start && isHolidayDate(args.start)) {
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

  // Обновляем currentDate когда загружаются данные семестра
  useEffect(() => {
    if (semesterStart && semesterEnd) {
      const today = new Date();
      const semesterStartDate = new Date(semesterStart);
      const semesterEndDate = new Date(semesterEnd);

      // Если текущая дата вне семестра - корректируем её
      if (currentDate < semesterStartDate) {
        setCurrentDate(semesterStartDate);
      } else if (currentDate > semesterEndDate) {
        setCurrentDate(semesterEndDate);
      }
    }
  }, [semesterStart, semesterEnd, currentDate]);

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
            min={
              semesterStart
                ? (() => {
                    const startDate = new Date(semesterStart);
                    startDate.setHours(8, 0, 0, 0);
                    return startDate;
                  })()
                : new Date(1970, 1, 1, 8, 0, 0)
            }
            max={
              semesterEnd
                ? (() => {
                    const endDate = new Date(semesterEnd);
                    endDate.setHours(23, 0, 0, 0);
                    return endDate;
                  })()
                : new Date(1970, 1, 1, 23, 0, 0)
            }
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
              // Стили для уроков - используем цвет преподавателя
              const professorColor =
                event.resource?.lesson?.professor?.professor_profile?.color;
              const borderColor = darkenColor(professorColor, 0.2);

              return {
                style: {
                  backgroundColor: professorColor,
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
                };
              }
              return {};
            }}
            slotPropGetter={(date) => {
              if (isHolidayDate(date)) {
                return {
                  className: "holiday-slot",
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
