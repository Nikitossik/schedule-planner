import React, { useState, useEffect, useContext } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format as dateFnsFormat, parse, startOfWeek, getDay } from "date-fns";
import { enUS, pl } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "./LessonsCalendar.css";

import { Users, User, MapPin } from "lucide-react";

const locales = {
  'en': enUS,
  'pl': pl,
};

const localizer = dateFnsLocalizer({
  format: dateFnsFormat,
  parse,
  startOfWeek: (date) => startOfWeek(date, { weekStartsOn: 1 }), 
  getDay,
  locales,
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

const DnDCalendar = withDragAndDrop(Calendar);

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

  if (language === "pl") {
    return {
      ...baseMessages,
      month: "Miesiąc",
      agenda: "Agenda",
      work_week: "Tydzień roboczy",
    };
  }

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

  const currentLocale = i18n.language === "pl" ? pl : enUS;

  const calendarMessages = getCalendarMessages(t, i18n.language);

  const invalidateConflictsCache = () => {
    queryClient.invalidateQueries(["conflicts-summary", schedule?.id]);
  };

  const invalidateWorkloadCache = () => {
    queryClient.invalidateQueries(["combined-warnings", schedule?.id]);
  };

  const semesterStart = schedule?.semester?.start_date;
  const semesterEnd = schedule?.semester?.end_date;

  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();

    if (semesterStart && semesterEnd) {
      const semesterStartDate = new Date(semesterStart);
      const semesterEndDate = new Date(semesterEnd);

      if (today >= semesterStartDate && today <= semesterEndDate) {
        return today;
      }
      else if (today < semesterStartDate) {
        return semesterStartDate;
      }
      else {
        return semesterEndDate;
      }
    }

    return today;
  });
  const [currentView, setCurrentView] = useState("week");
  const [groupBy, setGroupBy] = useState("none");

  const dateRange = getDateRange(currentDate, currentView);

  const scheduleDataContext = useContext(ScheduleDataContext);
  const scheduleData = scheduleDataContext || {
    expandedHolidays: [],
    filterHolidaysByDateRange: () => [],
  };
  const { expandedHolidays, filterHolidaysByDateRange } = scheduleData;

  const {
    data: lessonsData,
    isLoading,
    refetch,
  } = useCalendarLessons(schedule?.id, dateRange.date_from, dateRange.date_to);

  const lessons = lessonsData?.items || [];


  const holidaysForPeriod = useMemo(() => {
    return (
      filterHolidaysByDateRange(dateRange.date_from, dateRange.date_to) || []
    );
  }, [filterHolidaysByDateRange, dateRange.date_from, dateRange.date_to]);

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

  const isHolidayDate = useMemo(
    () => (date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      return holidayDatesSet.has(dateStr);
    },
    [holidayDatesSet]
  );

  const getHolidayInfo = useMemo(
    () => (date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      return holidayInfoMap.get(dateStr);
    },
    [holidayInfoMap]
  );

  const resources = createResourcesFromLessons(lessons, groupBy);
  const events = transformLessonsToEvents(lessons, groupBy);

  const customFormats = useMemo(
    () => ({
      dayFormat: (date) => {
        const dayNumber = dateFnsFormat(date, "dd", { locale: currentLocale });
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
      dayHeaderFormat: (date) => {
        const dayHeader = dateFnsFormat(date, "eee dd", { locale: currentLocale });
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
      timeGutterFormat: (date) => {
        return dateFnsFormat(date, "HH:mm", { locale: currentLocale });
      },
      eventTimeRangeFormat: ({ start, end }) => {
        return `${dateFnsFormat(
          start,
          "HH:mm",
          { locale: currentLocale }
        )} - ${dateFnsFormat(end, "HH:mm", { locale: currentLocale })}`;
      },
      eventTimeRangeStartFormat: (date) => {
        return dateFnsFormat(date, "HH:mm", { locale: currentLocale });
      },
      eventTimeRangeEndFormat: (date) => {
        return dateFnsFormat(date, "HH:mm", { locale: currentLocale });
      },
      selectRangeFormat: ({ start, end }) => {
        return `${dateFnsFormat(
          start,
          "HH:mm",
          { locale: currentLocale }
        )} - ${dateFnsFormat(end, "HH:mm", { locale: currentLocale })}`;
      },
      dayRangeHeaderFormat: ({ start, end }) => {
        const startMonth = dateFnsFormat(start, "LLLL", { locale: currentLocale });
        const endMonth = dateFnsFormat(end, "LLLL", { locale: currentLocale });
        const startDay = dateFnsFormat(start, "dd", { locale: currentLocale });
        const endDay = dateFnsFormat(end, "dd", { locale: currentLocale });
        const startYear = dateFnsFormat(start, "yyyy", { locale: currentLocale });
        const endYear = dateFnsFormat(end, "yyyy", { locale: currentLocale });
        
        if (startMonth === endMonth && startYear === endYear) {
          return `${startMonth} ${startDay} - ${endDay}, ${startYear}`;
        } else if (startYear === endYear) {
          return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${startYear}`;
        } else {
          return `${startMonth} ${startDay}, ${startYear} - ${endMonth} ${endDay}, ${endYear}`;
        }
      },
    }),
    [getHolidayInfo, t, currentLocale]
  );

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
      if (isHolidayDate(slotInfo.start)) {
        console.log("Blocked slot selection on holiday:", slotInfo.start);
        return false;
      }
      return createSelectSlotHandler(
        onCreateLesson,
        isHolidayDate,
        t
      )(slotInfo);
    };
  }, [onCreateLesson, isHolidayDate, t]);
  const handleNavigate = useMemo(() => {
    return (newDate) => {
      if (!semesterStart || !semesterEnd) {
        return createNavigateHandler(setCurrentDate)(newDate);
      }

      const semesterStartDate = new Date(semesterStart);
      const semesterEndDate = new Date(semesterEnd);

      if (newDate >= semesterStartDate && newDate <= semesterEndDate) {
        setCurrentDate(newDate);
      }
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
      if (args.start && isHolidayDate(args.start)) {
        return false;
      }

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
      if (
        (args.start && isHolidayDate(args.start)) ||
        (args.end && isHolidayDate(args.end))
      ) {
        return false;
      }

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

  useEffect(() => {
    if (refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  useEffect(() => {
    if (semesterStart && semesterEnd) {
      const today = new Date();
      const semesterStartDate = new Date(semesterStart);
      const semesterEndDate = new Date(semesterEnd);

      if (currentDate < semesterStartDate) {
        setCurrentDate(semesterStartDate);
      } else if (currentDate > semesterEndDate) {
        setCurrentDate(semesterEndDate);
      }
    }
  }, [semesterStart, semesterEnd, currentDate]);

  useEffect(() => {
    refetch();
  }, [currentDate, currentView, refetch]);

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
              const professorColor =
                event.resource?.lesson?.professor?.professor_profile?.color;
              const textColor =
                event.resource?.lesson?.professor?.professor_profile
                  ?.text_color;
              const borderColor = darkenColor(professorColor, 0.2);

              return {
                style: {
                  backgroundColor: professorColor,
                  borderColor: borderColor,
                  color: textColor,
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
