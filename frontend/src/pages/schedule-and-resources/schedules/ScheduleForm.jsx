import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useEntityList } from "@/hooks/useEntityList";
import { useEffect } from "react";

const createSchema = (t, isEdit) => {
  if (isEdit) {
    // При редактировании только name обязательно
    return z.object({
      name: z.string().min(1, t("schedules.form.validation.nameRequired")),
      academic_year_id: z.string().optional(),
      semester_id: z.string().optional(),
      study_form_id: z.string().optional(),
    });
  }

  // При создании все поля обязательны
  return z.object({
    name: z.string().min(1, t("schedules.form.validation.nameRequired")),
    academic_year_id: z
      .string()
      .min(1, t("schedules.form.validation.academicYearRequired")),
    semester_id: z
      .string()
      .min(1, t("schedules.form.validation.semesterRequired")),
    study_form_id: z
      .string()
      .min(1, t("schedules.form.validation.studyFormRequired")),
  });
};

export default function ScheduleForm({
  id,
  defaultValues,
  isEdit = false,
  isLoading = false,
  onSubmit,
  showButtons = true,
}) {
  const { t } = useTranslation();

  const transformedDefaultValues = {
    name: defaultValues?.name || "",
    academic_year_id: String(defaultValues?.semester?.academic_year?.id ?? ""),
    semester_id: String(defaultValues?.semester?.id ?? ""),
    study_form_id: String(defaultValues?.study_form?.id ?? ""),
  };

  const form = useForm({
    resolver: zodResolver(createSchema(t, isEdit)),
    defaultValues: transformedDefaultValues,
  });

  // Следим за изменением академического года
  const watchedAcademicYearId = form.watch("academic_year_id");

  // Загружаем академические года
  const { data: academicYearsData, isLoading: isAcademicYearsLoading } =
    useEntityList("academic_year");
  const academicYears = academicYearsData?.items || [];

  // Загружаем семестры для выбранного академического года
  const { data: semestersData, isLoading: isSemestersLoading } = useEntityList(
    "semester",
    watchedAcademicYearId
      ? { filters: { academic_year_ids: [watchedAcademicYearId] } }
      : {}
  );
  const semesters = semestersData?.items || [];

  // Загружаем формы обучения
  const { data: studyFormsData, isLoading: isStudyFormsLoading } =
    useEntityList("study_form", {
      filters: {
        sort_by: "direction_name",
        desc: false,
        page: 1,
        pageSize: 100,
      },
    });
  const studyForms = studyFormsData?.items || [];

  // Очищаем семестр при смене академического года
  useEffect(() => {
    if (watchedAcademicYearId && !isEdit) {
      form.setValue("semester_id", "");
    }
  }, [watchedAcademicYearId, form, isEdit]);

  // Заполняем форму при редактировании
  useEffect(() => {
    if (isEdit && defaultValues) {
      const newValues = {
        name: defaultValues.name || "",
        academic_year_id: String(defaultValues.academic_year?.id ?? ""),
        semester_id: String(defaultValues.semester?.id ?? ""),
        study_form_id: String(defaultValues.study_form?.id ?? ""),
      };
      form.reset(newValues);
    }
  }, [defaultValues, isEdit, form]);

  return (
    <Form {...form}>
      <form
        id={id}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-xl"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("schedules.form.fields.name.label")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("schedules.form.fields.name.placeholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="academic_year_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("schedules.form.fields.academicYear.label")}
              </FormLabel>
              {isEdit ? (
                <FormControl>
                  <Input
                    value={defaultValues?.academic_year?.name || ""}
                    disabled={true}
                    className="bg-gray-50"
                    readOnly
                  />
                </FormControl>
              ) : (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t(
                        "schedules.form.fields.academicYear.placeholder"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {isAcademicYearsLoading ? (
                      <div className="p-2 text-sm">{t("common.loading")}</div>
                    ) : academicYears.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        {t("schedules.form.noData.noAcademicYears")}
                      </div>
                    ) : (
                      academicYears.map((year) => (
                        <SelectItem key={year.id} value={String(year.id)}>
                          {year.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="semester_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("schedules.form.fields.semester.label")}</FormLabel>
              {isEdit ? (
                <FormControl>
                  <Input
                    value={
                      defaultValues?.semester
                        ? t("schedules.table.columns.semesterFormat", {
                            number: defaultValues.semester.number,
                            period: defaultValues.semester.period,
                          })
                        : ""
                    }
                    disabled={true}
                    className="bg-gray-50"
                    readOnly
                  />
                </FormControl>
              ) : (
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={!watchedAcademicYearId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        watchedAcademicYearId
                          ? t("schedules.form.fields.semester.placeholder")
                          : t(
                              "schedules.form.fields.semester.placeholderDisabled"
                            )
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {isSemestersLoading ? (
                      <div className="p-2 text-sm">{t("common.loading")}</div>
                    ) : semesters.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        {watchedAcademicYearId
                          ? t("schedules.form.noData.noSemesters")
                          : t(
                              "schedules.form.fields.semester.placeholderDisabled"
                            )}
                      </div>
                    ) : (
                      semesters.map((semester) => (
                        <SelectItem
                          key={semester.id}
                          value={String(semester.id)}
                        >
                          {t("schedules.table.columns.semesterFormat", {
                            number: semester.number,
                            period: semester.period,
                          })}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="study_form_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t("schedules.form.fields.studyForm.label")}
              </FormLabel>
              {isEdit ? (
                <FormControl>
                  <Input
                    value={
                      defaultValues?.study_form
                        ? `${defaultValues.direction?.name} (${defaultValues.study_form.form})`
                        : ""
                    }
                    disabled={true}
                    className="bg-gray-50"
                    readOnly
                  />
                </FormControl>
              ) : (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t(
                        "schedules.form.fields.studyForm.placeholder"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {isStudyFormsLoading ? (
                      <div className="p-2 text-sm">{t("common.loading")}</div>
                    ) : studyForms.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        {t("schedules.form.noData.noStudyForms")}
                      </div>
                    ) : (
                      studyForms.map((studyForm) => (
                        <SelectItem
                          key={studyForm.id}
                          value={String(studyForm.id)}
                        >
                          {studyForm.direction?.name} ({studyForm.form})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {showButtons && (
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? t("schedules.form.buttons.saving")
              : isEdit
              ? t("schedules.form.buttons.update")
              : t("schedules.form.buttons.create")}
          </Button>
        )}
      </form>
    </Form>
  );
}
