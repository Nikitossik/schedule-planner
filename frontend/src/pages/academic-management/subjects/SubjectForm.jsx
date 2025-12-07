import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect } from "react";
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
const createSchema = (isEdit, t) => {
  if (isEdit) {
    return z.object({
      name: z.string().min(1, t("subjects.form.validation.nameRequired")),
      direction_id: z.string().optional(),
      academic_year_id: z.string().optional(),
      semester_id: z.string().optional(),
      allocated_hours: z
        .number()
        .int()
        .positive(t("subjects.form.validation.allocatedHoursPositive"))
        .optional(),
    });
  }

  return z.object({
    name: z.string().min(1, t("subjects.form.validation.nameRequired")),
    direction_id: z
      .string()
      .min(1, t("subjects.form.validation.directionRequired")),
    academic_year_id: z
      .string()
      .min(1, t("subjects.form.validation.academicYearRequired")),
    semester_id: z
      .string()
      .min(1, t("subjects.form.validation.semesterRequired")),
    allocated_hours: z
      .number()
      .int()
      .positive(t("subjects.form.validation.allocatedHoursPositive")),
  });
};

export default function SubjectForm({
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
    direction_id: String(defaultValues?.direction?.id ?? ""),
    academic_year_id: String(defaultValues?.academic_year?.id ?? ""),
    semester_id: String(defaultValues?.semester?.id ?? ""),
    allocated_hours: isEdit ? defaultValues?.allocated_hours || 0 : undefined,
  };

  const form = useForm({
    resolver: zodResolver(createSchema(isEdit, t)),
    defaultValues: transformedDefaultValues,
  });

  const watchedAcademicYearId = form.watch("academic_year_id");

  const { data: directionsData, isLoading: directionsLoading } =
    useEntityList("direction");
  const directions = directionsData?.items || [];

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

  // Обработчик отправки формы
  const handleFormSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form
        id="subject-form"
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className={`space-y-6 ${showButtons ? "max-w-xl" : ""}`}
      >
        {isEdit && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              {t("subjects.form.editNote")}
            </p>
          </div>
        )}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("subjects.form.fields.name")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("subjects.form.placeholders.name")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="direction_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("subjects.form.fields.direction")}</FormLabel>
              {isEdit ? (
                <FormControl>
                  <Input
                    value={defaultValues?.direction?.name || ""}
                    disabled={true}
                    className="bg-gray-50"
                    readOnly
                  />
                </FormControl>
              ) : (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("subjects.form.placeholders.direction")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {directionsLoading ? (
                      <div className="p-2 text-sm">{t("common.loading")}</div>
                    ) : directions.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        {t("subjects.form.noDirections")}
                      </div>
                    ) : (
                      directions.map((direction) => (
                        <SelectItem
                          key={direction.id}
                          value={String(direction.id)}
                        >
                          {direction.name}
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
          name="academic_year_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("subjects.form.fields.academicYear")}</FormLabel>
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
                <Select
                  onValueChange={handleAcademicYearChange}
                  value={field.value || ""}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("subjects.form.placeholders.academicYear")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYearsLoading ? (
                      <div className="p-2 text-sm">{t("common.loading")}</div>
                    ) : academicYears.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        {t("subjects.form.noAcademicYears")}
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
              <FormLabel>{t("subjects.form.fields.semester")}</FormLabel>
              {isEdit ? (
                <FormControl>
                  <Input
                    value={
                      defaultValues?.semester
                        ? t("subjects.table.semesterFormat", {
                            number: defaultValues.semester.number,
                            period: t(
                              `filterLabels.periods.${defaultValues.semester.period}`
                            ),
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
                  value={field.value || ""}
                  disabled={!watchedAcademicYearId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        watchedAcademicYearId
                          ? t("subjects.form.placeholders.semester")
                          : t("subjects.form.placeholders.academicYear")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {semestersLoading ? (
                      <div className="p-2 text-sm">{t("common.loading")}</div>
                    ) : semesters.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        {watchedAcademicYearId
                          ? t("subjects.form.noSemesters")
                          : t("subjects.form.placeholders.academicYear")}
                      </div>
                    ) : (
                      semesters.map((semester) => (
                        <SelectItem
                          key={semester.id}
                          value={String(semester.id)}
                        >
                          {t("subjects.table.semesterFormat", {
                            number: semester.number,
                            period: t(
                              `filterLabels.periods.${semester.period}`
                            ),
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
          name="allocated_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("subjects.form.fields.allocatedHours")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  placeholder={t("subjects.form.placeholders.allocatedHours")}
                  {...field}
                  value={field.value || ""}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </FormControl>
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
