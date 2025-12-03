import { toast } from "sonner";
import { formatTime } from "./dateUtils";

/**
 * Обработчики событий календаря
 */

/**
 * Функция для поиска валидного subject_assignment для конкретного предмета
 */
export const findValidSubjectAssignment = (
  lessons,
  subjectId,
  targetAssignmentId
) => {
  console.log("Looking for valid assignment:", {
    subjectId,
    targetAssignmentId,
  });

  // Находим урок с целевым subject_assignment_id
  const lessonWithTargetAssignment = lessons.find(
    (lesson) => lesson.subject_assignment_id === parseInt(targetAssignmentId)
  );

  if (!lessonWithTargetAssignment) {
    console.log("No lesson found with target assignment ID");
    return null;
  }

  console.log(
    "Found lesson with target assignment:",
    lessonWithTargetAssignment
  );

  // Проверяем, что предмет совпадает
  if (lessonWithTargetAssignment.subject?.id === subjectId) {
    console.log("Subject matches!");
    return { id: parseInt(targetAssignmentId) }; // Возвращаем объект с ID
  }

  console.log("Subject mismatch:", {
    targetSubjectId: lessonWithTargetAssignment.subject?.id,
    requiredSubjectId: subjectId,
  });
  return null;
};

/**
 * Функция для создания полных данных урока как в форме
 */
export const buildFullLessonData = (lesson, schedule, updates = {}) => {
  console.log("Building full lesson data from:", lesson);
  console.log("Schedule from props:", schedule);

  return {
    schedule_id: lesson.schedule_id || schedule?.id,
    group_ids:
      lesson.group_ids || lesson.groups?.map((group) => group.id) || [],
    subject_assignment_id:
      lesson.subject_assignment_id || lesson.subject_assignment?.id,
    room_id: lesson.room_id || lesson.room?.id,
    is_online: lesson.is_online || false,
    date: lesson.date,
    start_time: lesson.start_time,
    end_time: lesson.end_time,
    lesson_type: lesson.lesson_type || "lecture",
    ...updates, // Применяем обновления поверх существующих данных
  };
};

/**
 * Создает обработчик перемещения события (drag)
 */
export const createEventDropHandler = (
  lessons,
  schedule,
  groupBy,
  onUpdateLesson,
  refetch,
  invalidateConflictsCache,
  invalidateWorkloadCache
) => {
  return ({ event, start, end, resourceId, isAllDay }) => {
    console.log("Event drop:", { event, start, end, resourceId, isAllDay });

    // Базовые обновления времени и даты
    const timeUpdates = {
      date: start.toISOString().split("T")[0],
      start_time: formatTime(start),
      end_time: formatTime(end),
    };

    // Если изменился ресурс, добавляем соответствующие поля
    if (resourceId && resourceId !== event.resourceId) {
      switch (groupBy) {
        case "group":
          if (resourceId !== "no-group") {
            // При перетаскивании в другую группу, заменяем все группы на одну целевую
            timeUpdates.group_ids = [parseInt(resourceId)];
          }
          break;
        case "professor":
          // Меняем subject_assignment при перетаскивании между преподавателями
          if (resourceId !== "no-assignment") {
            const currentSubjectId = event.resource.lesson.subject?.id;
            console.log("Attempting professor change:", {
              currentSubjectId,
              targetResourceId: resourceId,
              lesson: event.resource.lesson,
            });

            const validAssignment = findValidSubjectAssignment(
              lessons,
              currentSubjectId,
              resourceId
            );

            if (validAssignment) {
              console.log("Valid assignment found, updating...");
              timeUpdates.subject_assignment_id = parseInt(resourceId);
            } else {
              toast.error(
                "Cannot assign this lesson to the selected professor. The professor doesn't teach this subject."
              );
              return;
            }
          } else {
            toast.error("Cannot assign lesson to unassigned professor.");
            return;
          }
          break;
        case "room":
          if (resourceId === "online") {
            timeUpdates.is_online = true;
            timeUpdates.room_id = null;
          } else if (resourceId !== "no-room") {
            timeUpdates.is_online = false;
            timeUpdates.room_id = parseInt(resourceId);
          }
          break;
      }
    }

    // Создаем полные данные урока с обновлениями
    const fullLessonData = buildFullLessonData(
      event.resource.lesson,
      schedule,
      timeUpdates
    );

    console.log("Updating lesson with full data:", fullLessonData);

    onUpdateLesson.mutate(
      {
        id: event.resource.lesson.id,
        data: fullLessonData,
      },
      {
        onSuccess: () => {
          toast.success("Lesson updated successfully");
          refetch(); // Обновляем данные календаря
          invalidateConflictsCache(); // Обновляем конфликты
          invalidateWorkloadCache(); // Обновляем workload warnings
        },
        onError: (error) => {
          console.error("Failed to update lesson:", error);
          toast.error(
            "Failed to update lesson: " + (error.message || "Unknown error")
          );
        },
      }
    );
  };
};

/**
 * Создает обработчик изменения размера события (resize)
 */
export const createEventResizeHandler = (
  schedule,
  onUpdateLesson,
  refetch,
  invalidateConflictsCache,
  invalidateWorkloadCache
) => {
  return ({ event, start, end }) => {
    console.log("Event resize:", { event, start, end });

    // Обновления времени для resize
    const timeUpdates = {
      date: start.toISOString().split("T")[0],
      start_time: formatTime(start),
      end_time: formatTime(end),
    };

    // Создаем полные данные урока с обновлениями
    const fullLessonData = buildFullLessonData(
      event.resource.lesson,
      schedule,
      timeUpdates
    );

    console.log("Resizing lesson with full data:", fullLessonData);

    onUpdateLesson.mutate(
      {
        id: event.resource.lesson.id,
        data: fullLessonData,
      },
      {
        onSuccess: () => {
          toast.success("Lesson duration updated");
          refetch(); // Обновляем данные календаря
          invalidateConflictsCache(); // Обновляем конфликты
          invalidateWorkloadCache(); // Обновляем workload warnings
        },
        onError: (error) => {
          console.error("Failed to resize lesson:", error);
          toast.error(
            "Failed to resize lesson: " + (error.message || "Unknown error")
          );
        },
      }
    );
  };
};
