import { startOfWeek, endOfWeek, format } from "date-fns";

export const getDateRange = (date, view) => {
  const weekStart = startOfWeek(date, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(date, { weekStartsOn: 1 });

  switch (view) {
    case "day":
      return {
        date_from: format(date, "yyyy-MM-dd"),
        date_to: format(date, "yyyy-MM-dd"),
      };
    case "week":
    default:
      return {
        date_from: format(weekStart, "yyyy-MM-dd"),
        date_to: format(weekEnd, "yyyy-MM-dd"),
      };
  }
};


export const formatTime = (date) => {
  return date.toTimeString().split(" ")[0]; 
};
