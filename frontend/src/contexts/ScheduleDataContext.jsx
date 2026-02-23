import React, { createContext, useContext, useMemo } from "react";
import { useEntityList } from "@/hooks/useEntityList";
import { useEntityQuery } from "@/hooks/useEntityQuery";
import { format } from "date-fns";

export const ScheduleDataContext = createContext(null);

export function ScheduleDataProvider({ schedule, children }) {
 
  const { data: fullSchedule, isLoading: isLoadingSchedule } = useEntityQuery(
    "schedule",
    schedule?.id,
    !!schedule?.id,
    {
      
      staleTime: 3 * 60 * 1000,
      cacheTime: 10 * 60 * 1000,
    }
  );


  const groups = fullSchedule?.groups || [];
  const workloads = fullSchedule?.workloads || [];


  const { data: roomsData, isLoading: isLoadingRooms } = useEntityList("room", {
    pagination: { loadAll: true },

    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });


  const semesterStart =
    fullSchedule?.semester?.start_date || schedule?.semester?.start_date;
  const semesterEnd =
    fullSchedule?.semester?.end_date || schedule?.semester?.end_date;

  const { data: expandedHolidaysData, isLoading: isLoadingHolidays } =
    useEntityList("university_holiday/expanded", {
      enabled: !!(semesterStart && semesterEnd),
      filters:
        semesterStart && semesterEnd
          ? {
              start_date: semesterStart,
              end_date: semesterEnd,
            }
          : {},
      pagination: { loadAll: true },
    });


  console.log("DEBUG ScheduleDataContext holidays:", {
    semesterStart,
    semesterEnd,
    expandedHolidaysData,
    isLoadingHolidays,
    enabled: !!(semesterStart && semesterEnd),
  });
  console.log("🎉 Type check - isArray:", Array.isArray(expandedHolidaysData));
  console.log(
    "🎉 Final expandedHolidays:",
    Array.isArray(expandedHolidaysData)
      ? expandedHolidaysData
      : expandedHolidaysData?.items || []
  );


  const filterHolidaysByDateRange = useMemo(() => {
    return (startDate, endDate) => {
      const holidays = expandedHolidaysData?.items || [];
      if (!holidays.length || !startDate || !endDate) return [];

      const startStr = format(new Date(startDate), "yyyy-MM-dd");
      const endStr = format(new Date(endDate), "yyyy-MM-dd");

      return holidays.filter((holiday) => {
        const holidayDate = holiday.date;
        return holidayDate >= startStr && holidayDate <= endStr;
      });
    };
  }, [expandedHolidaysData]);

  const value = {
  
    schedule: fullSchedule || schedule,

    
    groups,
    workloads,
    isLoadingGroups: isLoadingSchedule,
    isLoadingWorkloads: isLoadingSchedule,

    rooms: roomsData?.items || [],
    isLoadingRooms,

    expandedHolidays: expandedHolidaysData?.items || [],
    filterHolidaysByDateRange,
    isLoadingHolidays,


    isLoading: isLoadingSchedule || isLoadingRooms || isLoadingHolidays,
  };

  return (
    <ScheduleDataContext.Provider value={value}>
      {children}
    </ScheduleDataContext.Provider>
  );
}


export function useScheduleData() {
  const context = useContext(ScheduleDataContext);

  if (!context) {
    throw new Error("useScheduleData must be used within ScheduleDataProvider");
  }

  return context;
}
