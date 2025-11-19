import { useTranslation } from "react-i18next";

// Маппинг английских названий сущностей на ключи переводов
const ENTITY_TRANSLATION_MAP = {
  // Основные сущности
  user: "entities.user",
  group: "entities.group",
  contract: "entities.contract",
  workload: "entities.workload",
  room: "entities.room",
  schedule: "entities.schedule",
  lesson: "entities.lesson",
  semester: "entities.semester",
  academicYear: "entities.academicYear",
  direction: "entities.direction",
  faculty: "entities.faculty",
  subject: "entities.subject",
  studyForm: "entities.studyForm",

  // Составные названия
  "academic year": "entities.academicYear",
  "subject assignment": "entities.subjectAssignment",
  "study form": "entities.studyForm",
  "professor contract": "entities.professorContract",
  "professor workload": "entities.professorWorkload",

  // Альтернативные варианты
  professor: "entities.professor",
  student: "entities.student",

  // Профили
  "professor profile": "entities.professorProfile",
  "student profile": "entities.studentProfile",
};

export function useEntityTranslator() {
  const { t } = useTranslation();

  const translateEntity = (entityName) => {
    if (!entityName) return "";

    // Нормализуем название (убираем пробелы, приводим к нижнему регистру)
    const normalizedName = entityName.toLowerCase().trim();

    // Ищем в маппинге
    const translationKey = ENTITY_TRANSLATION_MAP[normalizedName];

    // Если есть перевод - используем его, иначе возвращаем оригинал
    return translationKey ? t(translationKey) : entityName;
  };

  return { translateEntity };
}
