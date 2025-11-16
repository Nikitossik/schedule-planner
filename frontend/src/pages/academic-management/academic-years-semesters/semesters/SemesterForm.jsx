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
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { useEntityList } from "@/hooks/useEntityList";

export const SemesterForm = ({
  defaultValues,
  isEdit = false,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation();

  // Создаем схему динамически в зависимости от режима
  const createSchema = (isEditMode) => {
    const baseSchema = {
      name: z.string().min(1, t("semesters.form.validation.nameRequired")),
      number: z.coerce
        .number()
        .int()
        .min(1, t("semesters.form.validation.numberRequired")),
      period: z.enum(["winter", "spring", "summer"], {
        errorMap: () => ({
          message: t("semesters.form.validation.periodRequired"),
        }),
      }),
      start_date: z
        .string()
        .min(1, t("semesters.form.validation.startDateRequired")),
      end_date: z
        .string()
        .min(1, t("semesters.form.validation.endDateRequired")),
    };

    // Добавляем academic_year_id только при создании
    if (!isEditMode) {
      baseSchema.academic_year_id = z
        .string()
        .min(1, t("semesters.form.validation.academicYearRequired"));
    }

    return z.object(baseSchema).refine(
      (data) => {
        if (data.start_date && data.end_date) {
          return new Date(data.end_date) >= new Date(data.start_date);
        }
        return true;
      },
      {
        message: t("semesters.form.validation.endDateAfterStart"),
        path: ["end_date"],
      }
    );
  };

  const form = useForm({
    resolver: zodResolver(createSchema(isEdit)),
    defaultValues,
  });

  const { data: academicYears, isLoading: isLoadingYears } =
    useEntityList("academic_year");

  console.log(academicYears);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("semesters.form.fields.name.label")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("semesters.form.fields.name.placeholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("semesters.form.fields.number.label")}</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max="8" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="period"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("semesters.form.fields.period.label")}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          "semesters.form.fields.period.placeholder"
                        )}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="winter">
                      {t("semesters.form.fields.period.winter")}
                    </SelectItem>
                    <SelectItem value="summer">
                      {t("semesters.form.fields.period.summer")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Academic Year только при создании */}
        {!isEdit && (
          <FormField
            control={form.control}
            name="academic_year_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("semesters.form.fields.academicYear.label")}
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t(
                          "semesters.form.fields.academicYear.placeholder"
                        )}
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingYears ? (
                      <div className="p-2 text-sm">
                        {t("semesters.form.loading")}
                      </div>
                    ) : academicYears?.items?.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">
                        {t("semesters.form.noAcademicYears")}
                      </div>
                    ) : (
                      academicYears?.items?.map((year) => (
                        <SelectItem key={year.id} value={String(year.id)}>
                          {year.name}{" "}
                          {year.is_current &&
                            t("semesters.form.fields.academicYear.current")}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("semesters.form.fields.startDate.label")}
                </FormLabel>
                <FormControl>
                  <DatePicker
                    modal={true}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t(
                      "semesters.form.fields.startDate.placeholder"
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("semesters.form.fields.endDate.label")}
                </FormLabel>
                <FormControl>
                  <DatePicker
                    modal={true}
                    value={field.value}
                    onChange={field.onChange}
                    minDate={form.watch("start_date")}
                    placeholder={t("semesters.form.fields.endDate.placeholder")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading
              ? t("semesters.form.buttons.saving")
              : isEdit
              ? t("semesters.form.buttons.update")
              : t("semesters.form.buttons.create")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t("semesters.form.buttons.cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
