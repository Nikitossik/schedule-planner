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

const createSchema = (t) =>
  z.object({
    name: z.string().min(1, t("groups.form.validation.nameRequired")),
    study_form_id: z
      .string()
      .min(1, t("groups.form.validation.studyFormRequired")),
    academic_year_id: z
      .string()
      .min(1, t("groups.form.validation.academicYearRequired")),
    semester_id: z
      .string()
      .min(1, t("groups.form.validation.semesterRequired")),
  });

export default function GroupForm({
  id,
  defaultValues,
  isEdit = false,
  onSubmit,
  showButtons = true,
  isLoading = false,
}) {
  const { t } = useTranslation();

  // Преобразуем данные из API формата в формат формы
  const transformedDefaultValues = {
    name: defaultValues?.name || "",
    study_form_id: String(defaultValues?.study_form?.id ?? ""),
    academic_year_id: String(defaultValues?.academic_year?.id ?? ""),
    semester_id: String(defaultValues?.semester?.id ?? ""),
  };

  const form = useForm({
    resolver: zodResolver(createSchema(t)),
    defaultValues: transformedDefaultValues,
  });

  const watchedAcademicYearId = form.watch("academic_year_id");

  const { data: studyFormsData, isLoading: studyFormsLoading } =
    useEntityList("study_form");
  const studyForms = studyFormsData?.items || [];

  const { data: academicYearsData, isLoading: academicYearsLoading } =
    useEntityList("academic_year");
  const academicYears = academicYearsData?.items || [];

  const { data: semestersData, isLoading: semestersLoading } = useEntityList(
    "semester",
    watchedAcademicYearId
      ? { filters: { academic_year_ids: [watchedAcademicYearId] } }
      : {}
  );
  const semesters = semestersData?.items || [];

  // Обработчик для изменения академического года
  const handleAcademicYearChange = (value) => {
    form.setValue("academic_year_id", value);
    form.setValue("semester_id", ""); // Очищаем семестр при смене года
  };

  // Логирование для диагностики
  console.log("🔍 GroupForm - defaultValues (raw):", defaultValues);
  console.log("🔍 GroupForm - study_form object:", defaultValues?.study_form);
  console.log(
    "🔍 GroupForm - academic_year object:",
    defaultValues?.academic_year
  );
  console.log("🔍 GroupForm - semester object:", defaultValues?.semester);
  console.log(
    "🔍 GroupForm - transformedDefaultValues:",
    transformedDefaultValues
  );
  console.log("🔍 GroupForm - isEdit:", isEdit);
  console.log("🔍 GroupForm - watchedAcademicYearId:", watchedAcademicYearId);

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
              <FormLabel>{t("groups.form.fields.name")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("groups.form.placeholders.name")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="study_form_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("groups.form.fields.studyForm")}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("groups.form.placeholders.studyForm")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {studyFormsLoading ? (
                    <div className="p-2 text-sm">{t("common.loading")}</div>
                  ) : studyForms.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      {t("groups.form.noData.noStudyForms")}
                    </div>
                  ) : (
                    studyForms.map((studyForm) => (
                      <SelectItem
                        key={studyForm.id}
                        value={String(studyForm.id)}
                      >
                        {studyForm.direction?.name} {studyForm.form}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="academic_year_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("groups.form.fields.academicYear")}</FormLabel>
              <Select
                onValueChange={handleAcademicYearChange}
                value={field.value || ""}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("groups.form.placeholders.academicYear")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {academicYearsLoading ? (
                    <div className="p-2 text-sm">{t("common.loading")}</div>
                  ) : academicYears.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      {t("groups.form.noData.noAcademicYears")}
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
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="semester_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("groups.form.fields.semester")}</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value || ""}
                disabled={!watchedAcademicYearId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      watchedAcademicYearId
                        ? t("groups.form.placeholders.semester")
                        : t("groups.form.placeholders.selectAcademicYearFirst")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {semestersLoading ? (
                    <div className="p-2 text-sm">{t("common.loading")}</div>
                  ) : semesters.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      {watchedAcademicYearId
                        ? t("groups.form.noData.noSemesters")
                        : t("groups.form.placeholders.selectAcademicYearFirst")}
                    </div>
                  ) : (
                    semesters.map((semester) => (
                      <SelectItem key={semester.id} value={String(semester.id)}>
                        {t("groups.table.semesterFormat", {
                          number: semester.number,
                          period: t(`filterLabels.periods.${semester.period}`),
                        })}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {showButtons && (
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? t("common.buttons.saving")
              : isEdit
              ? t("common.buttons.update")
              : t("common.buttons.create")}
          </Button>
        )}
      </form>
    </Form>
  );
}
