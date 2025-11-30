import { useState, useEffect, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

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
  // Состояния для TimePicker
  const [startTimeDate, setStartTimeDate] = useState(new Date());
  const [endTimeDate, setEndTimeDate] = useState(new Date());

  // Функция для получения дефолтных значений
  const getDefaultValues = useCallback(() => {
    if (initialData && isEdit) {
      const baseValues = {
        schedule_id: schedule?.id || initialData.schedule?.id,
        group_id: initialData.group?.id?.toString() || "",
        subject_assignment_id:
          initialData.subject_assignment_id?.toString() || "",
        room_id: initialData.room?.id?.toString() || "",
        is_online: initialData.is_online || false,
        lesson_type: initialData.lesson_type || "lecture",
        workload_id: initialData.workload?.id?.toString() || "",
      };

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
      group_id: "",
      subject_assignment_id: "",
      room_id: "",
      is_online: false,
      lesson_type: "lecture",
      workload_id: "",
    };

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
    defaultValues: getDefaultValues(),
  });

  const { reset, setValue, formState } = formMethods;

  // Сбрасываем форму когда меняются данные
  useEffect(() => {
    reset(getDefaultValues());

    // Устанавливаем время для TimePicker
    if (initialData?.start_time) {
      const [hours, minutes, seconds] = initialData.start_time.split(":");
      const date = new Date();
      date.setHours(
        parseInt(hours),
        parseInt(minutes),
        parseInt(seconds || "0")
      );
      setStartTimeDate(date);
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
    }
  }, [initialData, getDefaultValues, reset]);

  // Вычисляем время в формате HH:MM:SS из Date объектов
  const watchedStartTime = useMemo(() => {
    const hours = String(startTimeDate.getHours()).padStart(2, "0");
    const minutes = String(startTimeDate.getMinutes()).padStart(2, "0");
    const seconds = String(startTimeDate.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, [startTimeDate]);

  const watchedEndTime = useMemo(() => {
    const hours = String(endTimeDate.getHours()).padStart(2, "0");
    const minutes = String(endTimeDate.getMinutes()).padStart(2, "0");
    const seconds = String(endTimeDate.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, [endTimeDate]);

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
          schedule_id: parseInt(data.schedule_id),
          group_id: data.group_id ? parseInt(data.group_id) : null,
          subject_assignment_id: data.subject_assignment_id
            ? parseInt(data.subject_assignment_id)
            : null,
          room_id: data.room_id ? parseInt(data.room_id) : null,
          start_time: formatTime(startTimeDate),
          end_time: formatTime(endTimeDate),
        };

        // Дополнительные трансформации для recurring
        if (formType === "recurring") {
          transformedData.days_of_week =
            typeof data.days_of_week === "string"
              ? data.days_of_week
              : JSON.stringify(data.days_of_week || []);
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
    [startTimeDate, endTimeDate, formatTime, onSave, isEdit, formType]
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
