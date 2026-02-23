
export const createNavigateToLessonsHandler = (
  setCurrentDate,
  setCurrentView
) => {
  return (lessons) => {
    if (lessons && lessons.length > 0) {
      const firstLesson = lessons[0];
      const lessonDate = new Date(firstLesson.date);

    
      setCurrentDate(lessonDate);
      setCurrentView("day");
    }
  };
};


export const createNavigateToConflictHandler = (
  setCurrentDate,
  setCurrentView
) => {
  return (conflict) => {
    const firstLesson = conflict.lessons[0];
    const lessonDate = new Date(firstLesson.date);

  
    setCurrentDate(lessonDate);
    setCurrentView("day");

  };
};


export const createSelectEventHandler = (onEditLesson) => {
  return (event) => {
    if (onEditLesson) {
      onEditLesson(event.resource.lesson);
    }
  };
};


export const createSelectSlotHandler = (onCreateLesson, isHolidayDate, t) => {
  return (slotInfo) => {
    if (isHolidayDate && isHolidayDate(slotInfo.start)) {
      if (t) {
        alert(
          t(
            "lessons.holidayBlockedMessage"
          )
        );
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


export const createNavigateHandler = (setCurrentDate) => {
  return (newDate, view) => {
    setCurrentDate(newDate);
  };
};


export const createViewChangeHandler = (setCurrentView) => {
  return (view) => {
    setCurrentView(view);
  };
};
