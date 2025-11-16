import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";

const createSchema = (t) =>
  z
    .object({
      name: z.string().min(1, t("academicYears.form.validation.nameRequired")),
      start_date: z
        .string()
        .min(1, t("academicYears.form.validation.startDateRequired")),
      end_date: z
        .string()
        .min(1, t("academicYears.form.validation.endDateRequired")),
      is_current: z.boolean().default(false),
    })
    .refine(
      (data) => {
        if (data.start_date && data.end_date) {
          return new Date(data.end_date) >= new Date(data.start_date);
        }
        return true;
      },
      {
        message: t("academicYears.form.validation.endDateAfterStart"),
        path: ["end_date"],
      }
    );

export const AcademicYearForm = ({
  defaultValues,
  isEdit = false,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const { t, i18n } = useTranslation();
  const form = useForm({
    resolver: zodResolver(createSchema(t)),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("academicYears.form.fields.name.label")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("academicYears.form.fields.name.placeholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {t("academicYears.form.fields.startDate.label")}
                </FormLabel>
                <FormControl>
                  <DatePicker
                    modal={true}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t(
                      "academicYears.form.fields.startDate.placeholder"
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
                  {t("academicYears.form.fields.endDate.label")}
                </FormLabel>
                <FormControl>
                  <DatePicker
                    modal={true}
                    value={field.value}
                    onChange={field.onChange}
                    minDate={form.watch("start_date")}
                    placeholder={t(
                      "academicYears.form.fields.endDate.placeholder"
                    )}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_current"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  {t("academicYears.form.fields.isCurrent.label")}
                </FormLabel>
                <FormDescription>
                  {t("academicYears.form.fields.isCurrent.description")}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <div className="flex gap-3 pt-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading
              ? t("academicYears.form.buttons.saving")
              : isEdit
              ? t("academicYears.form.buttons.update")
              : t("academicYears.form.buttons.create")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t("academicYears.form.buttons.cancel")}
          </Button>
        </div>
      </form>
    </Form>
  );
};
