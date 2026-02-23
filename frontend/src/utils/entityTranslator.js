import { useTranslation } from "react-i18next";


const ENTITY_TRANSLATION_MAP = {
  
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

 
  "academic year": "entities.academicYear",
  "subject assignment": "entities.subjectAssignment",
  "study form": "entities.studyForm",
  "professor contract": "entities.professorContract",
  "professor workload": "entities.professorWorkload",

  
  professor: "entities.professor",
  student: "entities.student",


  "professor profile": "entities.professorProfile",
  "student profile": "entities.studentProfile",
};

export function useEntityTranslator() {
  const { t } = useTranslation();

  const translateEntity = (entityName) => {
    if (!entityName) return "";

 
    const normalizedName = entityName.toLowerCase().trim();

   
    const translationKey = ENTITY_TRANSLATION_MAP[normalizedName];

    return translationKey ? t(translationKey) : entityName;
  };

  return { translateEntity };
}
