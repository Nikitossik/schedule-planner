/**
 * Утилиты для работы с ресурсами календаря
 */

/**
 * Получает ID ресурса для урока на основе типа группировки
 */
export const getResourceId = (lesson, groupBy) => {
  switch (groupBy) {
    case "group":
      return lesson.group?.id?.toString() || "no-group";
    case "professor":
      // Используем subject_assignment_id как ресурс, так как преподаватель привязан через него
      const assignmentId =
        lesson.subject_assignment?.id || lesson.subject_assignment_id;
      return assignmentId?.toString() || "no-assignment";
    case "room":
      if (lesson.is_online) return "online";
      return lesson.room?.id?.toString() || "no-room";
    default:
      return null;
  }
};

/**
 * Получает заголовок ресурса для урока на основе типа группировки
 */
export const getResourceTitle = (lesson, groupBy) => {
  switch (groupBy) {
    case "group":
      return lesson.group?.name || "No Group";
    case "professor":
      const professor = lesson.professor;
      const subject = lesson.subject?.name || "Unknown Subject";
      const professorName = professor
        ? `${professor.professor_profile?.academic_title} ${professor.name} ${professor.surname}`.trim()
        : "No Professor";
      return `${professorName} (${subject})`;
    case "room":
      if (lesson.is_online) return "Online";
      return lesson.room?.number || "No Room";
    default:
      return "";
  }
};

/**
 * Создает список ресурсов из массива уроков
 */
export const createResourcesFromLessons = (lessons, groupBy) => {
  if (groupBy === "none") return undefined;

  const resourceMap = new Map();

  lessons.forEach((lesson) => {
    const resourceId = getResourceId(lesson, groupBy);
    if (resourceId && !resourceMap.has(resourceId)) {
      resourceMap.set(resourceId, {
        resourceId: resourceId,
        resourceTitle: getResourceTitle(lesson, groupBy),
      });
    }
  });

  return Array.from(resourceMap.values()).sort((a, b) =>
    a.resourceTitle.localeCompare(b.resourceTitle)
  );
};
