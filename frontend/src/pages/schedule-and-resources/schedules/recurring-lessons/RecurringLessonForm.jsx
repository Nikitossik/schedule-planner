import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  BookOpen,
  Users,
  Laptop,
  Building2,
  FlaskConical,
  MessageSquare,
  Presentation,
  Repeat,
} from "lucide-react";
import { toast } from "sonner";
import { useEntityList } from "@/hooks/useEntityList";
import { useEntityMutation } from "@/hooks/useEntityMutation";

export function RecurringLessonForm({
  template,
  schedule,
  onSave,
  onCancel,
  onDelete,
  isEdit = false,
}) {
  const { t } = useTranslation();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const createRecurringTemplate = useEntityMutation(
    "recurring_template",
    "create"
  );
  const updateRecurringTemplate = useEntityMutation(
    "recurring_template",
    "patch"
  );

  // Получаем сегодняшнюю дату для валидации
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Получаем дату окончания семестра
  const semesterEndDate = schedule?.semester?.end_date || null;

  // Трансформируем данные шаблона для формы
  const getDefaultValues = useCallback(() => {
    if (template && isEdit) {
      // Конвертируем days_of_week из JSON строки в массив
      let daysOfWeek = template.days_of_week || [];
      if (typeof daysOfWeek === "string") {
        try {
          daysOfWeek = JSON.parse(daysOfWeek);
        } catch {
          daysOfWeek = [];
        }
      }

      return {
        name: template.name || "",
        schedule_id: schedule?.id || template.schedule?.id,
        group_id: template.group?.id?.toString() || "",
        subject_assignment_id: template.subject_assignment_id?.toString() || "",
        room_id: template.room?.id?.toString() || "",
        is_online: template.is_online || false,
        lesson_type: template.lesson_type || "lecture",
        days_of_week: daysOfWeek,
        start_time: template.start_time || "",
        end_time: template.end_time || "",
        start_date:
          template.start_date || new Date().toISOString().split("T")[0],
        end_date: template.end_date || semesterEndDate || "",
        workload_id: template.workload?.id?.toString() || "",
      };
    }

    // Для создания шаблона - дефолтные значения
    return {
      name: "",
      schedule_id: schedule?.id,
      group_id: "",
      subject_assignment_id: "",
      room_id: "",
      is_online: false,
      lesson_type: "lecture",
      days_of_week: [],
      start_time: "",
      end_time: "",
      start_date: new Date().toISOString().split("T")[0],
      end_date: semesterEndDate || "",
      workload_id: "",
    };
  }, [template, schedule, isEdit, semesterEndDate]);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    register,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: getDefaultValues(),
  });

  // Сбрасываем форму когда меняется шаблон
  useEffect(() => {
    reset(getDefaultValues());
  }, [template, getDefaultValues, reset]);

  // Отслеживаемые поля для каскадной фильтрации
  const watchedGroupId = watch("group_id");
  const watchedWorkloadId = watch("workload_id");
  const watchedIsOnline = watch("is_online");
  const watchedStartDate = watch("start_date");
  const watchedEndDate = watch("end_date");
  const watchedStartTime = watch("start_time");
  const watchedEndTime = watch("end_time");
  const watchedDaysOfWeek = watch("days_of_week");

  // 1. Группы: фильтруем по semester_id и direction_id из schedule
  const { data: groupsData } = useEntityList("group", {
    filters: schedule
      ? {
          semester_ids: [schedule.semester.id],
          direction_ids: [schedule.direction.id],
        }
      : {},
    pagination: { loadAll: true },
  });
  const groups = groupsData?.items || [];

  // Получаем выбранную группу для следующего фильтра
  const selectedGroup = groups.find((g) => g.id === parseInt(watchedGroupId));

  // 2. Workloads: фильтруем по семестру, направлению из schedule и study_form из группы
  const { data: workloadsData } = useEntityList("professor_workload", {
    filters:
      schedule && (selectedGroup || (isEdit && template?.group))
        ? {
            semester_ids: [schedule.semester.id],
            direction_ids: [schedule.direction.id],
            study_forms: [
              (selectedGroup || (isEdit && template?.group))?.study_form?.form,
            ],
          }
        : {},
    pagination: { loadAll: true },
  });
  const workloads = workloadsData?.items || [];

  // 3. Subject assignments: фильтруем по выбранному workload_id
  const currentWorkloadId =
    watchedWorkloadId || (isEdit && template?.workload?.id);
  const { data: assignmentsData } = useEntityList("subject_assignment", {
    filters: currentWorkloadId
      ? {
          workload_id: currentWorkloadId,
        }
      : {},
    pagination: { loadAll: true },
  });
  const assignments = assignmentsData?.items || [];

  // 4. Комнаты: загружаем все комнаты (без фильтрации по времени для шаблонов)
  const { data: roomsData } = useEntityList("room", {
    pagination: { loadAll: true },
  });
  const rooms = roomsData?.items || [];

  // Дни недели для селектора (используем встроенные возможности JS)
  const { i18n } = useTranslation();
  const daysOfWeek = useMemo(() => {
    const locale = i18n?.language === "pl" ? "pl" : "en";

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(2024, 0, 1 + index); // Начинаем с понедельника
      const dayName = date.toLocaleDateString(locale, { weekday: "short" });

      return {
        value: index,
        short: dayName,
      };
    });
  }, [i18n?.language]);

  // Очистка зависимых полей при изменении родительских
  useEffect(() => {
    if (!isEdit && setValue) {
      setValue("workload_id", "");
      setValue("subject_assignment_id", "");
    }
  }, [watchedGroupId, setValue, isEdit]);

  useEffect(() => {
    if (!isEdit && setValue) {
      setValue("subject_assignment_id", "");
    }
  }, [watchedWorkloadId, setValue, isEdit]);

  // Обновление названия шаблона на основе выбранных данных
  const watchedSubjectAssignmentId = watch("subject_assignment_id");

  useEffect(() => {
    if (
      !isEdit &&
      watchedWorkloadId &&
      watchedGroupId &&
      watchedSubjectAssignmentId
    ) {
      const selectedWorkload = workloads.find(
        (w) => w.id.toString() === watchedWorkloadId
      );
      const selectedGroup = groups.find(
        (g) => g.id.toString() === watchedGroupId
      );
      const selectedAssignment = assignments.find(
        (a) => a.id.toString() === watchedSubjectAssignmentId
      );

      if (selectedWorkload && selectedGroup && selectedAssignment) {
        const subjectName = selectedAssignment.subject?.name || "Subject";
        const groupName = selectedGroup.name || "Group";
        const generatedName = `${subjectName} - ${groupName}`;
        setValue("name", generatedName);
      }
    }
  }, [
    watchedWorkloadId,
    watchedGroupId,
    watchedSubjectAssignmentId,
    workloads,
    groups,
    assignments,
    setValue,
    isEdit,
  ]);

  // Дополнительный эффект для установки workload_id когда данные workloads загружены
  useEffect(() => {
    if (
      isEdit &&
      template?.workload?.id &&
      workloads.length > 0 &&
      !watchedWorkloadId
    ) {
      const workloadExists = workloads.find(
        (w) => w.id === template.workload.id
      );
      if (workloadExists) {
        setValue("workload_id", template.workload.id.toString());
      }
    }
  }, [isEdit, template, workloads, watchedWorkloadId, setValue]);

  // Функции для работы с днями недели
  const toggleDayOfWeek = (dayValue) => {
    // Конвертируем в массив, если пришла строка (JSON)
    let currentDays = watchedDaysOfWeek || [];
    if (typeof currentDays === "string") {
      try {
        currentDays = JSON.parse(currentDays);
      } catch {
        currentDays = [];
      }
    }

    const newDays = currentDays.includes(dayValue)
      ? currentDays.filter((day) => day !== dayValue)
      : [...currentDays, dayValue].sort();
    setValue("days_of_week", newDays);
  };

  const handleFormSubmit = async (data) => {
    try {
      // Преобразуем данные для API
      const transformedData = {
        ...data,
        schedule_id: parseInt(data.schedule_id),
        group_id: data.group_id ? parseInt(data.group_id) : null,
        subject_assignment_id: data.subject_assignment_id
          ? parseInt(data.subject_assignment_id)
          : null,
        room_id: data.room_id ? parseInt(data.room_id) : null,
        days_of_week: JSON.stringify(data.days_of_week || []),
      };

      // Удаляем workload_id из данных, он нужен только для UI
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

  const lessonTypes = [
    {
      value: "lecture",
      label: t("lessons.form.lessonType.lecture"),
      icon: Presentation,
    },
    {
      value: "practice",
      label: t("lessons.form.lessonType.practice"),
      icon: Laptop,
    },
    {
      value: "lab",
      label: t("lessons.form.lessonType.lab"),
      icon: FlaskConical,
    },
    {
      value: "seminar",
      label: t("lessons.form.lessonType.seminar"),
      icon: MessageSquare,
    },
  ];

  return (
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
                {...register("name", {
                  required: t("recurringLessons.form.validation.nameRequired"),
                })}
                placeholder={t(
                  "recurringLessons.form.placeholders.templateName"
                )}
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

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4" />
                {t("lessons.form.fields.group")}
              </label>
              <Select
                value={watch("group_id")}
                onValueChange={(value) => setValue("group_id", value)}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("lessons.form.placeholders.selectGroup")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {groups.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {t("lessons.form.messages.noGroups")}
                    </div>
                  ) : (
                    groups.map((group) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                        {group.study_form && (
                          <Badge variant="outline" className="ml-2">
                            {group.study_form.form}
                          </Badge>
                        )}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.group_id && (
                <p className="text-sm text-red-500">
                  {errors.group_id.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Professor & Subject Selection */}
        <Card>
          <CardContent className="pt-3 space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <User className="h-4 w-4" />
              {t("lessons.form.sections.professorSubject")}
            </h3>

            {/* Workload selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <User className="h-4 w-4" />
                {t("lessons.form.fields.professor")}
              </label>
              <Select
                value={watch("workload_id")}
                onValueChange={(value) => setValue("workload_id", value)}
                disabled={!watchedGroupId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      watchedGroupId
                        ? t("lessons.form.placeholders.selectProfessor")
                        : t("lessons.form.placeholders.selectGroupFirst")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {workloads.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {!watchedGroupId
                        ? t("lessons.form.messages.selectGroupFirst")
                        : t("lessons.form.messages.noProfessors")}
                    </div>
                  ) : (
                    workloads.map((workload) => (
                      <SelectItem
                        key={workload.id}
                        value={workload.id.toString()}
                      >
                        {workload?.professor.name} {workload?.professor.surname}
                        <span className="text-sm text-gray-500 ml-2">
                          ({workload.assigned_hours}h)
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.workload_id && (
                <p className="text-sm text-red-500">
                  {errors.workload_id.message}
                </p>
              )}
            </div>

            {/* Subject assignment selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                {t("lessons.form.fields.subject")}
              </label>
              <Select
                value={watch("subject_assignment_id")}
                onValueChange={(value) =>
                  setValue("subject_assignment_id", value)
                }
                disabled={!watchedWorkloadId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      watchedWorkloadId
                        ? t("lessons.form.placeholders.selectSubject")
                        : t("lessons.form.placeholders.selectProfessorFirst")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {assignments.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">
                      {!watchedWorkloadId
                        ? t("lessons.form.messages.selectProfessorFirst")
                        : t("lessons.form.messages.noSubjects")}
                    </div>
                  ) : (
                    assignments.map((assignment) => (
                      <SelectItem
                        key={assignment.id}
                        value={assignment.id.toString()}
                      >
                        <div className="flex items-center">
                          <BookOpen className="h-4 w-4 mr-2" />
                          {assignment.subject?.name} ({assignment.subject?.code}
                          )
                          <span className="text-sm text-gray-500 ml-2">
                            {assignment.hours_per_subject}h
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {errors.subject_assignment_id && (
                <p className="text-sm text-red-500">
                  {errors.subject_assignment_id.message}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lesson Type */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-medium">
              {t("lessons.form.sections.lessonType")}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {lessonTypes.map((type) => {
                const IconComponent = type.icon;
                return (
                  <Button
                    key={type.value}
                    type="button"
                    variant={
                      watch("lesson_type") === type.value
                        ? "default"
                        : "outline"
                    }
                    size="sm"
                    onClick={() => setValue("lesson_type", type.value)}
                    className="justify-start"
                  >
                    <IconComponent className="h-4 w-4 mr-2" />
                    {type.label}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Days of Week Selection */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              {t("recurringLessons.form.sections.daysOfWeek")}
            </h3>

            <div className="grid grid-cols-7 gap-2">
              {daysOfWeek.map((day) => (
                <div
                  key={day.value}
                  className="flex flex-col items-center space-y-2"
                >
                  <label className="text-sm font-medium">{day.short}</label>
                  <Checkbox
                    checked={(watchedDaysOfWeek || []).includes(day.value)}
                    onCheckedChange={() => toggleDayOfWeek(day.value)}
                  />
                </div>
              ))}
            </div>

            {errors.days_of_week && (
              <p className="text-sm text-red-500">
                {errors.days_of_week.message}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Date Range and Time */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t("recurringLessons.form.sections.dateTimeRange")}
            </h3>

            <div className="space-y-4">
              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("recurringLessons.form.fields.startDate")}
                </label>
                <DatePicker
                  value={watch("start_date")}
                  onChange={(value) => setValue("start_date", value)}
                  modal={true}
                  placeholder={t(
                    "recurringLessons.form.placeholders.selectStartDate"
                  )}
                  disabled={[(date) => date < today]}
                />
                {errors.start_date && (
                  <p className="text-sm text-red-500">
                    {errors.start_date.message}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("recurringLessons.form.fields.endDate")}
                </label>
                <DatePicker
                  value={watch("end_date")}
                  onChange={(value) => setValue("end_date", value)}
                  modal={true}
                  placeholder={t(
                    "recurringLessons.form.placeholders.selectEndDate"
                  )}
                  disabled={[
                    (date) => date < today,
                    (date) =>
                      watchedStartDate && date <= new Date(watchedStartDate),
                  ]}
                />
                {errors.end_date && (
                  <p className="text-sm text-red-500">
                    {errors.end_date.message}
                  </p>
                )}
              </div>

              {/* Time Range */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Start time */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("lessons.form.fields.startTime")}
                  </label>
                  <Input
                    type="time"
                    step="1"
                    {...register("start_time", {
                      required: t("lessons.form.validation.startTimeRequired"),
                    })}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                  {errors.start_time && (
                    <p className="text-sm text-red-500">
                      {errors.start_time.message}
                    </p>
                  )}
                </div>

                {/* End time */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    {t("lessons.form.fields.endTime")}
                  </label>
                  <Input
                    type="time"
                    step="1"
                    {...register("end_time", {
                      required: t("lessons.form.validation.endTimeRequired"),
                    })}
                    className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
                  />
                  {errors.end_time && (
                    <p className="text-sm text-red-500">
                      {errors.end_time.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              {t("lessons.form.sections.location")}
            </h3>

            {/* Online toggle */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_online"
                checked={watchedIsOnline}
                onCheckedChange={(checked) => setValue("is_online", checked)}
              />
              <label htmlFor="is_online" className="text-sm font-medium">
                {t("lessons.form.fields.onlineLesson")}
              </label>
            </div>

            {/* Room (if not online) */}
            {!watchedIsOnline && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {t("lessons.form.fields.room")}
                </label>
                <Select
                  value={watch("room_id")}
                  onValueChange={(value) => setValue("room_id", value)}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("lessons.form.placeholders.selectRoom")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {rooms.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        {t("lessons.form.messages.noRooms")}
                      </div>
                    ) : (
                      rooms.map((room) => (
                        <SelectItem key={room.id} value={room.id.toString()}>
                          <div className="flex items-center">
                            <Building2 className="h-4 w-4 mr-2" />
                            {room.number}
                            <span className="text-sm text-gray-500 ml-2">
                              (capacity: {room.capacity})
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.room_id && (
                  <p className="text-sm text-red-500">
                    {errors.room_id.message}
                  </p>
                )}
              </div>
            )}

            {watchedIsOnline && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700 flex items-center gap-2">
                  <Laptop className="h-4 w-4" />
                  {t("lessons.form.messages.onlineLesson")}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <DialogFooter className="flex justify-between">
          <div>
            {isEdit && onDelete && (
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
              >
                {t("recurringLessons.form.buttons.delete")}
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              {t("recurringLessons.form.buttons.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>{t("recurringLessons.form.buttons.saving")}</>
              ) : (
                <>
                  {template && isEdit
                    ? t("recurringLessons.form.buttons.update")
                    : t("recurringLessons.form.buttons.create")}
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
