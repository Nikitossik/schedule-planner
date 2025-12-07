import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

/**
 * Хук для управления данными формы урока
 */
export function useLessonFormData({
  initialData,
  isEdit,
  onSave,
  schedule,
  formType = "lesson", // "lesson" | "recurring"
}) {
  const { t } = useTranslation();

  // Validation schema
  const validationSchema = useMemo(() => {
    // Схема для групп - всегда множественные
    const groupsSchema = {
      group_ids: z
        .array(z.number())
        .min(1, t("lessons.form.validation.groupRequired")),
    };

    const baseSchema = {
      workload_id: z
        .union([z.number().min(1), z.null()])
        .refine((val) => val !== null, {
          message: t("lessons.form.validation.workloadRequired"),
        }),
      subject_assignment_id: z
        .union([z.number().min(1), z.null()])
        .refine((val) => val !== null, {
          message: t("lessons.form.validation.subjectRequired"),
        }),
      lesson_type: z
        .string()
        .min(1, t("lessons.form.validation.lessonTypeRequired")),
      is_online: z.boolean(),
    };

    // Всегда используем множественные группы для обеих форм
    const groupSchema = groupsSchema;

    // Валидация location: оба поля опциональны, можно не выбирать ни кабинет, ни онлайн
    const locationSchema = z.object({
      is_online: z.boolean(),
      room_id: z.union([z.string(), z.number(), z.null()]).optional(),
    });

    if (formType === "lesson") {
      return z
        .object({
          ...baseSchema,
          ...groupSchema,
          date: z.string().min(1, t("lessons.form.validation.dateRequired")),
          start_time: z
            .string()
            .min(1, t("lessons.form.validation.startTimeRequired")),
          end_time: z
            .string()
            .min(1, t("lessons.form.validation.endTimeRequired")),
          room_id: z.union([z.string(), z.number(), z.null()]).optional(),
        })
        .and(locationSchema);
    } else {
      // recurring
      return z
        .object({
          ...baseSchema,
          ...groupSchema,
          name: z.string().optional(),
          days_of_week: z
            .array(z.number())
            .min(1, t("recurringLessons.form.validation.daysRequired")),
          start_date: z
            .string()
            .min(1, t("recurringLessons.form.validation.startDateRequired")),
          end_date: z
            .string()
            .min(1, t("recurringLessons.form.validation.endDateRequired")),
          start_time: z
            .string()
            .min(1, t("lessons.form.validation.startTimeRequired")),
          end_time: z
            .string()
            .min(1, t("lessons.form.validation.endTimeRequired")),
          room_id: z.union([z.string(), z.number(), z.null()]).optional(),
        })
        .and(locationSchema)
        .refine(
          (data) => {
            if (!data.start_date || !data.end_date) return true;
            return new Date(data.start_date) <= new Date(data.end_date);
          },
          {
            message: t("recurringLessons.form.validation.endDateBeforeStart"),
            path: ["end_date"],
          }
        );
    }
  }, [formType, t]);

  // Состояния для TimePicker - null означает что время не выбрано
  const [startTimeDate, setStartTimeDate] = useState(null);
  const [endTimeDate, setEndTimeDate] = useState(null);

  // Функция для получения дефолтных значений
  const getDefaultValues = useCallback(() => {
    if (initialData && isEdit) {
      const baseValues = {
        schedule_id: schedule?.id || initialData.schedule?.id,
        subject_assignment_id: initialData.subject_assignment_id || null,
        room_id: initialData.room_id || initialData.room?.id || null,
        is_online: initialData.is_online || false,
        lesson_type: initialData.lesson_type || "lecture",
        // Для recurring templates workload_id хранится напрямую, для lessons - в объекте workload
        workload_id:
          initialData.workload_id || initialData.workload?.id || null,
      };

      // Всегда используем group_ids (массив групп)
      if (initialData.groups && Array.isArray(initialData.groups)) {
        // Новая структура: множественные группы
        baseValues.group_ids = initialData.groups.map((g) => g.id);
      } else if (initialData.group) {
        // Старая структура: одна группа - преобразуем в массив
        baseValues.group_ids = [initialData.group.id];
      } else {
        // По умолчанию - пустой массив
        baseValues.group_ids = [];
      }

      if (formType === "lesson") {
        return {
          ...baseValues,
          date: initialData.date || "",
          start_time: initialData.start_time || "",
          end_time: initialData.end_time || "",
        };
      } else {
        // recurring
        let daysOfWeek = initialData.days_of_week || [];
        if (typeof daysOfWeek === "string") {
          try {
            daysOfWeek = JSON.parse(daysOfWeek);
          } catch {
            daysOfWeek = [];
          }
        }

        return {
          ...baseValues,
          name: initialData.name || "",
          days_of_week: daysOfWeek,
          start_date: initialData.start_date || "",
          end_date: initialData.end_date || "",
          start_time: initialData.start_time || "",
          end_time: initialData.end_time || "",
        };
      }
    }

    // Дефолтные значения для создания
    const baseValues = {
      schedule_id: schedule?.id,
      subject_assignment_id: null,
      room_id: null,
      is_online: false,
      lesson_type: "lecture",
      workload_id: null,
    };

    // Добавляем поля для групп в зависимости от формы
    if (formType === "lesson") {
      baseValues.group_ids = [];
    } else {
      baseValues.group_ids = [];
    }

    if (formType === "lesson") {
      return {
        ...baseValues,
        date: initialData?.date || "",
        start_time: initialData?.start_time || "",
        end_time: initialData?.end_time || "",
      };
    } else {
      const semesterEndDate = schedule?.semester?.end_date || null;
      return {
        ...baseValues,
        name: "",
        days_of_week: [],
        start_date: new Date().toISOString().split("T")[0],
        end_date: semesterEndDate || "",
        start_time: "",
        end_time: "",
      };
    }
  }, [initialData, schedule, isEdit, formType]);

  const formMethods = useForm({
    resolver: zodResolver(validationSchema),
    defaultValues: getDefaultValues(),
    mode: "onChange",
    criteriaMode: "all",
    reValidateMode: "onChange",
  });

  const { reset, setValue, formState } = formMethods;

  // Сбрасываем форму когда меняются данные
  useEffect(() => {
    reset(getDefaultValues(), {
      keepErrors: false,
      keepDirty: false,
      keepValues: false,
      keepDefaultValues: false,
      keepIsSubmitted: false,
      keepTouched: false,
      keepIsValid: false,
      keepSubmitCount: false,
    });

    // Устанавливаем время для TimePicker в режиме редактирования или если есть предзаполненные данные (DnD)
    if (initialData?.start_time) {
      const [hours, minutes, seconds] = initialData.start_time.split(":");
      const date = new Date();
      date.setHours(
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds || "0")
      );
      setStartTimeDate(date);
    } else {
      // При создании без предзаполнения - сбрасываем в null
      setStartTimeDate(null);
    }

    if (initialData?.end_time) {
      const [hours, minutes, seconds] = initialData.end_time.split(":");
      const date = new Date();
      date.setHours(
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds || "0")
      );
      setEndTimeDate(date);
    } else {
      // При создании без предзаполнения - сбрасываем в null
      setEndTimeDate(null);
    }
  }, [initialData, getDefaultValues, reset]);

  // Вычисляем время в формате HH:MM:SS из Date объектов
  const watchedStartTime = useMemo(() => {
    if (!startTimeDate) return "";
    const hours = String(startTimeDate.getHours()).padStart(2, "0");
    const minutes = String(startTimeDate.getMinutes()).padStart(2, "0");
    const seconds = String(startTimeDate.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, [startTimeDate]);

  const watchedEndTime = useMemo(() => {
    if (!endTimeDate) return "";
    const hours = String(endTimeDate.getHours()).padStart(2, "0");
    const minutes = String(endTimeDate.getMinutes()).padStart(2, "0");
    const seconds = String(endTimeDate.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, [endTimeDate]);

  // Синхронизируем время с react-hook-form для валидации
  useEffect(() => {
    setValue("start_time", watchedStartTime, { shouldValidate: true });
  }, [watchedStartTime]); // Убрали setValue из зависимостей

  useEffect(() => {
    setValue("end_time", watchedEndTime, { shouldValidate: true });
  }, [watchedEndTime]); // Убрали setValue из зависимостей

  // Функция для форматирования времени
  const formatTime = useCallback((date) => {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, []);

  // Функция submit для обработки данных формы
  const handleFormSubmit = useCallback(
    async (data) => {
      try {
        // Базовые трансформации
        const transformedData = {
          ...data,
          schedule_id: schedule?.id || data.schedule_id,
          subject_assignment_id: data.subject_assignment_id || null,
          room_id: data.room_id || null,
          is_online: data.is_online || false,
          lesson_type: data.lesson_type || "lecture",
          start_time: formatTime(startTimeDate),
          end_time: formatTime(endTimeDate),
        };

        // Всегда используем group_ids для обеих форм
        transformedData.group_ids = data.group_ids || [];

        // Дополнительные трансформации для recurring
        if (formType === "recurring") {
          transformedData.days_of_week =
            typeof data.days_of_week === "string"
              ? data.days_of_week
              : JSON.stringify(data.days_of_week || []);
        } else {
          // Для обычных уроков добавляем дату
          transformedData.date = data.date;
        }

        // Удаляем workload_id из данных, он нужен только для UI
        delete transformedData.workload_id;

        await onSave(transformedData);

        const successMessage = isEdit
          ? formType === "lesson"
            ? "Lesson updated"
            : "Template updated"
          : formType === "lesson"
          ? "Lesson created"
          : "Template created";

        toast.success(successMessage);
      } catch (error) {
        const errorMessage =
          error.message ||
          (formType === "lesson"
            ? "Failed to save lesson"
            : "Failed to save template");
        toast.error(errorMessage);
      }
    },
    [startTimeDate, endTimeDate, formatTime, onSave, isEdit, formType, schedule]
  );

  return {
    formMethods,
    startTimeDate,
    setStartTimeDate,
    endTimeDate,
    setEndTimeDate,
    watchedStartTime,
    watchedEndTime,
    handleFormSubmit,
    isSubmitting: formState.isSubmitting,
  };
}
