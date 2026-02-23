import { getResourceId } from "./resourceUtils";


export const transformLessonToEvent = (lesson, groupBy) => {
  const startDateTime = new Date(`${lesson.date}T${lesson.start_time}`);
  const endDateTime = new Date(`${lesson.date}T${lesson.end_time}`);

  const professorName = lesson.professor
    ? [
        lesson.professor.professor_profile?.academic_title,
        lesson.professor.name,
        lesson.professor.surname,
      ]
        .filter(Boolean)
        .join(" ")
        .trim()
    : "No professor";

  const subjectName = lesson.subject?.name || "Unknown Subject";
  const groupNames =
    lesson.groups?.map((group) => group.name).join(", ") || "Unknown Group";
  const location = lesson.is_online
    ? "Online"
    : lesson.room?.number || "No room";
  const timeStr = `${lesson.start_time?.slice(0, 5)} - ${lesson.end_time?.slice(
    0,
    5
  )}`;

  const title = `${subjectName} - ${groupNames}`;

  const details = `👨‍🏫 ${professorName}\n🏢 ${location}\n🕐 ${timeStr}`;

  return {
    id: lesson.id,
    title: title,
    start: startDateTime,
    end: endDateTime,
    resourceId: groupBy !== "none" ? getResourceId(lesson, groupBy) : undefined,
    resource: {
      lesson: lesson,
      type: lesson.lesson_type,
      isOnline: lesson.is_online,
      room: location,
      professor: professorName,
      subject: subjectName,
      groups: groupNames,
      timeStr: timeStr,
      details: details,
    },
  };
};


export const transformLessonsToEvents = (lessons, groupBy) => {
  return lessons.map((lesson) => transformLessonToEvent(lesson, groupBy));
};


export const darkenColor = (hex, factor = 0.2) => {
 
  const color = hex.replace("#", "");

  
  const num = parseInt(color, 16);
  const r = Math.max(0, Math.floor((num >> 16) * (1 - factor)));
  const g = Math.max(0, Math.floor(((num >> 8) & 0x00ff) * (1 - factor)));
  const b = Math.max(0, Math.floor((num & 0x0000ff) * (1 - factor)));

  
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
};
