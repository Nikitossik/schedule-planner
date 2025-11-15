import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
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
import { Input } from "@/components/ui/input";
import { useEntityList } from "@/hooks/useEntityList";

const createSchema = (t) =>
  z.object({
    professor_profile_id: z.coerce
      .number()
      .min(1, t("contracts.form.validation.professorRequired")),
    academic_year_id: z.coerce
      .number()
      .min(1, t("contracts.form.validation.academicYearRequired")),
    semester_id: z.coerce
      .number()
      .min(1, t("contracts.form.validation.semesterRequired")),
    total_hours: z.coerce
      .number()
      .min(0, t("contracts.form.validation.hoursMin")),
  });

const ContractForm = ({
  defaultValues = {},
  isEdit = false,
  onSubmit,
  showButtons = true,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Преобразуем данные из API формата в формат формы
  const transformedDefaultValues = {
    professor_profile_id: defaultValues?.professor?.id || "",
    academic_year_id: defaultValues?.academic_year?.id || "",
    semester_id: defaultValues?.semester?.id || "",
    total_hours: defaultValues?.total_hours || "",
  };

  const form = useForm({
    resolver: zodResolver(createSchema(t)),
    defaultValues: transformedDefaultValues,
  });

  const watchedAcademicYearId = form.watch("academic_year_id");

  let { data: professors = [], isLoading: loadingProfessors } = useEntityList(
    "user",
    {
      filters: {
        user_roles: "user",
        user_types: "professor",
        desc: false,
        page: 1,
        pageSize: 10,
      },
    }
  );

  let { data: academicYears = [], isLoading: loadingAcademicYears } =
    useEntityList("academic_year");

  let { data: semesters = [], isLoading: loadingSemesters } = useEntityList(
    "semester",
    watchedAcademicYearId
      ? { filters: { academic_year_ids: [watchedAcademicYearId] } }
      : {}
  );

  professors = professors.items || [];
  academicYears = academicYears.items || [];
  semesters = semesters.items || [];

  // Обработчик для изменения академического года
  const handleAcademicYearChange = (value) => {
    form.setValue("academic_year_id", Number(value));
    form.setValue("semester_id", ""); // Очищаем семестр при смене года
  };

  // Логирование для диагностики
  console.log("🔍 ContractForm - defaultValues (raw):", defaultValues);
  console.log(
    "🔍 ContractForm - transformedDefaultValues:",
    transformedDefaultValues
  );
  console.log("🔍 ContractForm - isEdit:", isEdit);
  console.log(
    "🔍 ContractForm - watchedAcademicYearId:",
    watchedAcademicYearId
  );

  useEffect(() => {
    if (isEdit && defaultValues) {
      const newValues = {
        professor_profile_id: defaultValues?.professor?.id || "",
        academic_year_id: defaultValues?.academic_year?.id || "",
        semester_id: defaultValues?.semester?.id || "",
        total_hours: defaultValues?.total_hours || "",
      };
      form.reset(newValues);
    }
  }, [defaultValues, isEdit, form]);

  const handleSubmit = (data) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form
        id="contract-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className={`space-y-6 ${showButtons ? "max-w-xl" : ""}`}
      >
        {isEdit && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              {t("contracts.form.editNote")}
            </p>
          </div>
        )}
        <FormField
          control={form.control}
          name="professor_profile_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("contracts.form.fields.professor")}</FormLabel>
              {isEdit ? (
                <FormControl>
                  <Input
                    value={
                      defaultValues?.professor
                        ? `${defaultValues.professor.name} ${defaultValues.professor.surname}`
                        : ""
                    }
                    disabled={true}
                    className="bg-gray-50"
                    readOnly
                  />
                </FormControl>
              ) : (
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value ? String(field.value) : ""}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("contracts.form.placeholders.professor")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingProfessors ? (
                      <div className="p-2 text-sm">{t("common.loading")}</div>
                    ) : professors.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        {t("contracts.form.noData.noProfessors")}
                      </div>
                    ) : (
                      professors.map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>
                          {p.name + " " + p.surname}
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
              <FormLabel>{t("contracts.form.fields.academicYear")}</FormLabel>
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
                  value={field.value ? String(field.value) : ""}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t(
                        "contracts.form.placeholders.academicYear"
                      )}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingAcademicYears ? (
                      <div className="p-2 text-sm">{t("common.loading")}</div>
                    ) : academicYears.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        {t("contracts.form.noData.noAcademicYears")}
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
              <FormLabel>{t("contracts.form.fields.semester")}</FormLabel>
              {isEdit ? (
                <FormControl>
                  <Input
                    value={
                      defaultValues?.semester
                        ? t("contracts.table.semesterFormat", {
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
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value ? String(field.value) : ""}
                  disabled={!watchedAcademicYearId}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        watchedAcademicYearId
                          ? t("contracts.form.placeholders.semester")
                          : t(
                              "contracts.form.placeholders.selectAcademicYearFirst"
                            )
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingSemesters ? (
                      <div className="p-2 text-sm">{t("common.loading")}</div>
                    ) : semesters.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        {watchedAcademicYearId
                          ? t("contracts.form.noData.noSemesters")
                          : t(
                              "contracts.form.placeholders.selectAcademicYearFirst"
                            )}
                      </div>
                    ) : (
                      semesters.map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {t("contracts.table.semesterFormat", {
                            number: s.number,
                            period: t(`filterLabels.periods.${s.period}`),
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
          name="total_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("contracts.form.fields.hours")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  placeholder={t("contracts.form.placeholders.hours")}
                  min={0}
                  {...field}
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
              ? t("common.save")
              : t("common.add")}
          </Button>
        )}
      </form>
    </Form>
  );
};

export default ContractForm;
