import React, { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, User, Repeat } from "lucide-react";
import { useEntityMutation } from "@/hooks/useEntityMutation";
import { toast } from "sonner";

// Shared components
import { GroupSelector } from "@/components/lesson-forms/shared/GroupSelector";
import { ProfessorSelector } from "@/components/lesson-forms/shared/ProfessorSelector";
import { SubjectSelector } from "@/components/lesson-forms/shared/SubjectSelector";
import { LessonTypeSelector } from "@/components/lesson-forms/shared/LessonTypeSelector";
import {
  DaysOfWeekSelector,
  useDaysOfWeek,
} from "@/components/lesson-forms/shared/DaysOfWeekSelector";
import { DateTimeSection } from "@/components/lesson-forms/shared/DateTimeSection";
import { LocationSection } from "@/components/lesson-forms/shared/LocationSection";
import { FormActions } from "@/components/lesson-forms/shared/FormActions";
import { UnavailabilityWarningDialog } from "@/components/lesson-forms/shared/UnavailabilityWarningDialog";

// Hooks
import { useLessonFormData } from "@/components/lesson-forms/hooks/useLessonFormData";
import { useLessonFilters } from "@/components/lesson-forms/hooks/useLessonFilters";
import { useUnavailabilityCheck } from "@/components/lesson-forms/hooks/useUnavailabilityCheck";

export function RecurringLessonForm({
  template,
  schedule,
  onSave,
  onCancel,
  onDelete,
  isEdit = false,
}) {
  const { t } = useTranslation();

  const [showUnavailabilityWarning, setShowUnavailabilityWarning] =
    useState(false);
  const [pendingFormData, setPendingFormData] = useState(null);
  const [userEditedName, setUserEditedName] = useState(false); // Флаг что пользователь сам ввел имя

  const createRecurringTemplate = useEntityMutation(
    "recurring_template",
    "create"
  );
  const updateRecurringTemplate = useEntityMutation(
    "recurring_template",
    "patch"
  );

  // Получаем сегодняшнюю дату для валидации
  const today = useMemo(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }, []);

  // Управление данными формы и состоянием
  const {
    formMethods,
    startTimeDate,
    setStartTimeDate,
    endTimeDate,
    setEndTimeDate,
    watchedStartTime,
    watchedEndTime,
    isSubmitting,
  } = useLessonFormData({
    initialData: template,
    isEdit,
    onSave: null, // Мы используем свой submitForm
    schedule,
    formType: "recurring",
  });

  const {
    watch,
    setValue,
    handleSubmit,
    register,
    formState: { errors },
  } = formMethods;

  // Отслеживаемые поля
  const watchedGroupIds = watch("group_ids");
  const watchedWorkloadId = watch("workload_id");
  const watchedIsOnline = watch("is_online");
  const watchedStartDate = watch("start_date");
  const watchedDaysOfWeek = watch("days_of_week");
  const watchedSubjectAssignmentId = watch("subject_assignment_id");

  // Загрузка и фильтрация данных (без фильтрации комнат по времени для recurring)
  const { groups, workloads, assignments, rooms } = useLessonFilters({
    selectedGroupIds: watchedGroupIds,
    selectedWorkloadId: watchedWorkloadId,
    isEdit,
    initialGroup: template?.groups?.[0] || template?.group,
    // Для recurring templates не фильтруем комнаты по времени
    selectedDate: null,
    startTime: null,
    endTime: null,
    isOnline: watchedIsOnline,
  });

  // Получаем дни недели
  const daysOfWeek = useDaysOfWeek();

  // Проверка недоступности профессора
  const { unavailabilityInfo } = useUnavailabilityCheck({
    workloads,
    selectedWorkloadId: watchedWorkloadId,
    selectedDaysOfWeek: watchedDaysOfWeek,
  });

  // Дополнительный эффект для установки workload_id когда данные workloads загружены
  // Используем useState чтобы отслеживать, была ли начальная инициализация
  const [isWorkloadInitialized, setIsWorkloadInitialized] = useState(false);

  useEffect(() => {
    if (!isEdit || !template?.workload_id) return;

    // Если уже инициализировали - не перезаписываем выбор пользователя
    if (isWorkloadInitialized) return;

    const templateWorkloadId = template.workload_id.toString();

    // Если workload_id уже установлен корректно - помечаем как инициализированный
    if (watchedWorkloadId === templateWorkloadId) {
      setIsWorkloadInitialized(true);
      return;
    }

    // Ждем пока workloads загрузятся
    if (workloads.length === 0) return;

    const workloadExists = workloads.find(
      (w) => w.id.toString() === templateWorkloadId
    );

    if (workloadExists) {
      setValue("workload_id", templateWorkloadId);
      setIsWorkloadInitialized(true);
    } else {
      console.error("[RecurringLessonForm] Workload not found:", {
        templateWorkloadId,
        availableWorkloads: workloads.map((w) => ({
          id: w.id,
          study_form: w.study_form?.form,
        })),
      });
    }
  }, [
    isEdit,
    template?.workload_id,
    workloads,
    watchedWorkloadId,
    setValue,
    isWorkloadInitialized,
  ]);

  // Автоматическое обновление названия шаблона (только если пользователь не вводил свое)
  useEffect(() => {
    // Не генерируем автоматически если:
    // - В режиме редактирования
    // - Пользователь сам ввел имя
    // - Не выбраны все необходимые поля
    if (isEdit || userEditedName) return;

    const hasRequiredFields =
      watchedWorkloadId &&
      watchedSubjectAssignmentId &&
      watchedGroupIds &&
      watchedGroupIds.length > 0;

    if (hasRequiredFields) {
      const selectedWorkload = workloads.find(
        (w) => w.id.toString() === watchedWorkloadId
      );
      const selectedAssignment = assignments.find(
        (a) => a.id.toString() === watchedSubjectAssignmentId
      );

      // Всегда используем watchedGroupIds для recurring lessons
      const selectedGroups = groups.filter((g) =>
        watchedGroupIds.includes(g.id)
      );

      if (selectedWorkload && selectedGroups.length > 0 && selectedAssignment) {
        const subjectName = selectedAssignment.subject?.name || "Subject";
        const groupNames = selectedGroups.map((g) => g.name).join(", ");
        const generatedName = `${subjectName} - ${groupNames}`;
        setValue("name", generatedName);
      }
    }
  }, [
    watchedWorkloadId,
    watchedGroupIds,
    watchedSubjectAssignmentId,
    workloads,
    groups,
    assignments,
    setValue,
    isEdit,
    userEditedName,
  ]);

  // Функция submit
  const submitForm = async (data) => {
    try {
      // Форматируем время
      const formatTime = (date) => {
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${hours}:${minutes}:${seconds}`;
      };

      // Преобразуем данные для API
      const transformedData = {
        ...data,
        schedule_id: schedule?.id || parseInt(data.schedule_id),
        group_ids: data.group_ids || [],
        subject_assignment_id: data.subject_assignment_id
          ? parseInt(data.subject_assignment_id)
          : null,
        room_id: data.room_id ? parseInt(data.room_id) : null,
        start_time: formatTime(startTimeDate),
        end_time: formatTime(endTimeDate),
        days_of_week: JSON.stringify(data.days_of_week || []),
      };

      // Удаляем workload_id
      delete transformedData.workload_id;

      if (isEdit) {
        await updateRecurringTemplate.mutateAsync({
          id: template.id,
          data: transformedData,
        });
        toast.success(t("recurringLessons.form.messages.updated"));
      } else {
        await createRecurringTemplate.mutateAsync(transformedData);
        toast.success(t("recurringLessons.form.messages.created"));
      }

      onSave?.();
    } catch (error) {
      toast.error(
        error.message || t("recurringLessons.form.messages.saveFailed")
      );
    }
  };

  const handleFormSubmit = async (data) => {
    // Если есть конфликт с недоступными днями - показываем предупреждение
    if (unavailabilityInfo) {
      setPendingFormData(data);
      setShowUnavailabilityWarning(true);
      return;
    }

    await submitForm(data);
  };

  const handleConfirmWithUnavailability = async () => {
    setShowUnavailabilityWarning(false);
    if (pendingFormData) {
      await submitForm(pendingFormData);
      setPendingFormData(null);
    }
  };

  const handleCancelUnavailabilityWarning = () => {
    setShowUnavailabilityWarning(false);
    setPendingFormData(null);
  };

  return (
    <>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            {isEdit
              ? t("recurringLessons.form.title.edit")
              : t("recurringLessons.form.title.add")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Template Name */}
          <Card>
            <CardContent className="pt-3 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  {t("recurringLessons.form.fields.name")}
                </label>
                <Input
                  {...register("name")}
                  placeholder={t(
                    "recurringLessons.form.placeholders.templateName"
                  )}
                  onChange={(e) => {
                    // Если пользователь вводит что-то вручную - отключаем автогенерацию
                    if (e.target.value.trim()) {
                      setUserEditedName(true);
                    } else {
                      setUserEditedName(false);
                    }
                    // Вызываем стандартный onChange от register
                    setValue("name", e.target.value);
                  }}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Group Selection */}
          <Card>
            <CardContent className="pt-3 space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("lessons.form.sections.groupSelection")}
              </h3>

              <GroupSelector
                value={watchedGroupIds}
                onChange={(value) =>
                  setValue("group_ids", value, { shouldValidate: true })
                }
                groups={groups}
                error={errors.group_ids?.message}
              />
            </CardContent>
          </Card>

          {/* Professor & Subject Selection */}
          <Card>
            <CardContent className="pt-3 space-y-4">
              <h3 className="text-lg font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("lessons.form.sections.professorSubject")}
              </h3>

              <ProfessorSelector
                value={watchedWorkloadId ? watchedWorkloadId.toString() : ""}
                onChange={(value) => {
                  setValue("workload_id", value ? parseInt(value) : null, {
                    shouldValidate: true,
                  });
                }}
                workloads={workloads}
                selectedGroupIds={watchedGroupIds}
                error={errors.workload_id?.message}
              />

              <SubjectSelector
                value={
                  watchedSubjectAssignmentId
                    ? watchedSubjectAssignmentId.toString()
                    : ""
                }
                onChange={(value) =>
                  setValue(
                    "subject_assignment_id",
                    value ? parseInt(value) : null,
                    {
                      shouldValidate: true,
                    }
                  )
                }
                assignments={assignments}
                selectedWorkloadId={watchedWorkloadId}
                error={errors.subject_assignment_id?.message}
              />
            </CardContent>
          </Card>

          {/* Lesson Type */}
          <LessonTypeSelector
            value={watch("lesson_type")}
            onChange={(value) =>
              setValue("lesson_type", value, { shouldValidate: true })
            }
            error={errors.lesson_type}
          />

          {/* Days of Week */}
          <DaysOfWeekSelector
            value={watchedDaysOfWeek}
            onChange={(value) =>
              setValue("days_of_week", value, { shouldValidate: true })
            }
            error={errors.days_of_week?.message}
          />

          {/* Date Range and Time */}
          <DateTimeSection
            mode="range"
            startDate={watchedStartDate}
            onStartDateChange={(value) =>
              setValue("start_date", value, { shouldValidate: true })
            }
            endDate={watch("end_date")}
            onEndDateChange={(value) =>
              setValue("end_date", value, { shouldValidate: true })
            }
            startTimeDate={startTimeDate}
            setStartTimeDate={setStartTimeDate}
            endTimeDate={endTimeDate}
            setEndTimeDate={setEndTimeDate}
            minDate={today}
            errors={errors}
          />

          {/* Location */}
          <LocationSection
            isOnline={watchedIsOnline}
            onIsOnlineChange={(checked) =>
              setValue("is_online", checked, { shouldValidate: true })
            }
            roomId={watch("room_id")}
            onRoomChange={(value) =>
              setValue("room_id", value, { shouldValidate: true })
            }
            rooms={rooms}
            error={errors.room_id?.message}
            requireDateTime={false}
          />

          {/* Form Actions */}
          <FormActions
            isEdit={isEdit}
            isSubmitting={isSubmitting}
            onCancel={onCancel}
            onDelete={onDelete}
            deleteId={template?.id}
            showCancelOnCreate={true}
          />
        </form>
      </DialogContent>

      {/* Unavailability Warning Dialog */}
      <UnavailabilityWarningDialog
        open={showUnavailabilityWarning}
        onOpenChange={setShowUnavailabilityWarning}
        unavailabilityInfo={unavailabilityInfo}
        daysOfWeek={daysOfWeek}
        onConfirm={handleConfirmWithUnavailability}
        onCancel={handleCancelUnavailabilityWarning}
      />
    </>
  );
}
