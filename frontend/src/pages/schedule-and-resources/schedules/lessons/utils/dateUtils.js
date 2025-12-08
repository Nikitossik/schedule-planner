import { startOfWeek, endOfWeek, format } from "date-fns";

/**
 * Утилиты для работы с датами календаря
 */

/**
 * Вычисляет период для загрузки уроков на основе текущего вида
 */
export const getDateRange = (date, view) => {
  // Используем понедельник как начало недели (weekStartsOn: 1)
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

/**
 * Форматирует время в формат HH:MM:SS
 */
export const formatTime = (date) => {
  return date.toTimeString().split(" ")[0]; // Получаем HH:MM:SS
};
