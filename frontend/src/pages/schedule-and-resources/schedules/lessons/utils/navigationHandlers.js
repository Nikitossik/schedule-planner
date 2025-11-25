/**
 * Обработчики навигации календаря
 */

/**
 * Создает обработчик навигации к урокам с превышением часов
 */
export const createNavigateToLessonsHandler = (
  setCurrentDate,
  setCurrentView
) => {
  return (lessons) => {
    if (lessons && lessons.length > 0) {
      const firstLesson = lessons[0];
      const lessonDate = new Date(firstLesson.date);

      // Переключаем на день с первым уроком
      setCurrentDate(lessonDate);
      setCurrentView("day");

      // В будущем можно добавить подсветку конкретных уроков
      // setHighlightedLessons(lessons.map(l => l.id));
    }
  };
};

/**
 * Создает обработчик навигации к конфликту
 */
export const createNavigateToConflictHandler = (
  setCurrentDate,
  setCurrentView
) => {
  return (conflict) => {
    const firstLesson = conflict.lessons[0];
    const lessonDate = new Date(firstLesson.date);

    // Переключаем на день с конфликтом
    setCurrentDate(lessonDate);
    setCurrentView("day");

    // После изменения даты и вида, календарь автоматически обновится через useEffect
  };
};

/**
 * Создает обработчик выбора события
 */
export const createSelectEventHandler = (onEditLesson) => {
  return (event) => {
    if (onEditLesson) {
      onEditLesson(event.resource.lesson);
    }
  };
};

/**
 * Создает обработчик выбора слота
 */
export const createSelectSlotHandler = (onCreateLesson, isHolidayDate, t) => {
  return (slotInfo) => {
    // Проверяем, является ли выбранная дата праздником
    if (isHolidayDate && isHolidayDate(slotInfo.start)) {
      // Показываем уведомление о том, что нельзя создать занятие в праздничный день
      if (t) {
        alert(
          t(
            "lessons.holidayBlockedMessage",
            "На праздничный день нельзя назначать занятия"
          )
        );
      } else {
        alert("На праздничный день нельзя назначать занятия");
      }
      return;
    }

    if (onCreateLesson) {
      onCreateLesson({
        date: slotInfo.start.toISOString().split("T")[0],
        start_time: slotInfo.start.toTimeString().split(" ")[0],
        end_time: slotInfo.end.toTimeString().split(" ")[0],
      });
    }
  };
};

/**
 * Создает обработчик навигации календаря
 */
export const createNavigateHandler = (setCurrentDate) => {
  return (newDate, view) => {
    setCurrentDate(newDate);
    // refetch будет вызван автоматически через useEffect
  };
};

/**
 * Создает обработчик изменения вида календаря
 */
export const createViewChangeHandler = (setCurrentView) => {
  return (view) => {
    setCurrentView(view);
    // refetch будет вызван автоматически через useEffect
  };
};
