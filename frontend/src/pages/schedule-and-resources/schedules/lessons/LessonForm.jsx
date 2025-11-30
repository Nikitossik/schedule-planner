import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Users, User } from "lucide-react";

// Shared components
import { GroupSelector } from "@/components/lesson-forms/shared/GroupSelector";
import { ProfessorSelector } from "@/components/lesson-forms/shared/ProfessorSelector";
import { SubjectSelector } from "@/components/lesson-forms/shared/SubjectSelector";
import { LessonTypeSelector } from "@/components/lesson-forms/shared/LessonTypeSelector";
import { DateTimeSection } from "@/components/lesson-forms/shared/DateTimeSection";
import { LocationSection } from "@/components/lesson-forms/shared/LocationSection";
import { FormActions } from "@/components/lesson-forms/shared/FormActions";

// Hooks
import { useLessonFormData } from "@/components/lesson-forms/hooks/useLessonFormData";
import { useLessonFilters } from "@/components/lesson-forms/hooks/useLessonFilters";
import { useUnavailabilityCheck } from "@/components/lesson-forms/hooks/useUnavailabilityCheck";

export function LessonForm({
  lesson,
  schedule,
  onSave,
  onCancel,
  onDelete,
  isEdit = false,
}) {
  const { t } = useTranslation();

  // Управление данными формы и состоянием
  const {
    formMethods,
    startTimeDate,
    setStartTimeDate,
    endTimeDate,
    setEndTimeDate,
    watchedStartTime,
    watchedEndTime,
    handleFormSubmit,
    isSubmitting,
  } = useLessonFormData({
    initialData: lesson,
    isEdit,
    onSave,
    schedule,
    formType: "lesson",
  });

  const {
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = formMethods;

  // Отслеживаемые поля
  const watchedGroupId = watch("group_id");
  const watchedWorkloadId = watch("workload_id");
  const watchedIsOnline = watch("is_online");
  const watchedDate = watch("date");

  // Загрузка и фильтрация данных
  const { groups, workloads, assignments, rooms, disabledDayMatchers } =
    useLessonFilters({
      selectedGroupId: watchedGroupId,
      selectedWorkloadId: watchedWorkloadId,
      selectedDate: watchedDate,
      startTime: watchedStartTime,
      endTime: watchedEndTime,
      isOnline: watchedIsOnline,
      isEdit,
      currentLessonId: lesson?.id,
      initialGroup: lesson?.group,
    });

  // Проверка доступности профессора
  const { isProfessorAvailable } = useUnavailabilityCheck({
    workloads,
    selectedWorkloadId: watchedWorkloadId,
    selectedDate: watchedDate,
  });

  // Дополнительный эффект для установки workload_id когда данные workloads загружены
  useEffect(() => {
    // Проверяем что мы в режиме редактирования и есть данные урока
    if (!isEdit || !lesson?.workload?.id) return;

    const lessonWorkloadId = lesson.workload.id.toString();

    // Если workload_id уже установлен корректно - ничего не делаем
    if (watchedWorkloadId === lessonWorkloadId) return;

    // Ждем пока workloads загрузятся
    if (workloads.length === 0) return;

    // Ищем workload урока в отфильтрованном списке
    const workloadExists = workloads.find(
      (w) => w.id.toString() === lessonWorkloadId
    );

    if (workloadExists) {
      setValue("workload_id", lessonWorkloadId);
    } else {
      console.error("[LessonForm] Workload not found:", {
        lessonWorkloadId,
        availableWorkloads: workloads.map((w) => ({
          id: w.id,
          study_form: w.study_form?.form,
        })),
        lessonData: lesson,
      });
    }
  }, [
    isEdit,
    lesson?.workload?.id,
    workloads,
    watchedWorkloadId,
    setValue,
    lesson,
  ]);

  // Очистка зависимых полей при изменении родительских (ТОЛЬКО при создании нового урока)
  useEffect(() => {
    // В режиме редактирования не очищаем поля автоматически
    if (isEdit) return;

    setValue("workload_id", "");
    setValue("subject_assignment_id", "");
  }, [watchedGroupId, setValue, isEdit]);

  useEffect(() => {
    // В режиме редактирования не очищаем поля автоматически
    if (isEdit) return;

    setValue("subject_assignment_id", "");
  }, [watchedWorkloadId, setValue, isEdit]);

  // Очистка комнаты при изменении даты/времени (если не онлайн)
  useEffect(() => {
    if (!isEdit && !watchedIsOnline) {
      setValue("room_id", "");
    }
  }, [
    watchedDate,
    watchedStartTime,
    watchedEndTime,
    watchedIsOnline,
    setValue,
    isEdit,
  ]);

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          {isEdit ? t("lessons.form.title.edit") : t("lessons.form.title.add")}
        </DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Group Selection */}
        <Card>
          <CardContent className="pt-3 space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t("lessons.form.sections.groupSelection")}
            </h3>

            <GroupSelector
              value={watchedGroupId}
              onChange={(value) =>
                setValue("group_id", value, { shouldValidate: true })
              }
              groups={groups}
              error={errors.group_id?.message}
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
              value={watchedWorkloadId}
              onChange={(value) =>
                setValue("workload_id", value, { shouldValidate: true })
              }
              workloads={workloads}
              selectedGroupId={watchedGroupId}
              isProfessorAvailable={isProfessorAvailable}
              error={errors.workload_id?.message}
            />

            <SubjectSelector
              value={watch("subject_assignment_id")}
              onChange={(value) =>
                setValue("subject_assignment_id", value, {
                  shouldValidate: true,
                })
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

        {/* Date and Time */}
        <DateTimeSection
          mode="single"
          date={watchedDate}
          onDateChange={(value) =>
            setValue("date", value, { shouldValidate: true })
          }
          startTimeDate={startTimeDate}
          setStartTimeDate={setStartTimeDate}
          endTimeDate={endTimeDate}
          setEndTimeDate={setEndTimeDate}
          disabledDates={disabledDayMatchers}
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
          requireDateTime={true}
          hasDateTime={!!(watchedDate && watchedStartTime && watchedEndTime)}
        />

        {/* Form Actions */}
        <FormActions
          isEdit={isEdit}
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          onDelete={onDelete}
          deleteId={lesson?.id}
          showCancelOnCreate={true}
        />
      </form>
    </DialogContent>
  );
}
