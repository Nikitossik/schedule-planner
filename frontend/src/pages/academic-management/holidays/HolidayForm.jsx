import React from "react";
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

const createSchema = (isEdit, isDateRange, t) => {
  const baseSchema = {
    name: z.string().optional(),
    is_annual: z.boolean().default(false),
    is_date_range: z.boolean().default(false),
  };

  if (isEdit) {
    return z.object({
      ...baseSchema,
      date: z.string().optional(),
      start_date: z.string().optional(),
      end_date: z.string().optional(),
    });
  }

  if (isDateRange) {
    return z.object({
      ...baseSchema,
      start_date: z
        .string()
        .min(1, t("holidays.form.validation.startDateRequired")),
      end_date: z
        .string()
        .min(1, t("holidays.form.validation.endDateRequired")),
    });
  } else {
    return z.object({
      ...baseSchema,
      date: z.string().min(1, t("holidays.form.validation.dateRequired")),
    });
  }
};

export default function HolidayForm({
  defaultValues,
  isEdit = false,
  onSubmit,
  showButtons = true,
  isLoading = false,
}) {
  const { t } = useTranslation();

  const transformedDefaultValues = {
    name: defaultValues?.name || "",
    is_annual: defaultValues?.is_annual || false,
    is_date_range: defaultValues?.is_date_range || false,
    date: defaultValues?.date || "",
    start_date: defaultValues?.start_date || "",
    end_date: defaultValues?.end_date || "",
  };

  const form = useForm({
    resolver: zodResolver(
      createSchema(isEdit, transformedDefaultValues.is_date_range, t)
    ),
    defaultValues: transformedDefaultValues,
  });

  const watchedIsAnnual = form.watch("is_annual");
  const watchedIsDateRange = form.watch("is_date_range");

  const currentSchema = React.useMemo(() => {
    return createSchema(isEdit, watchedIsDateRange, t);
  }, [isEdit, watchedIsDateRange, t]);

  const validateFormData = (data) => {
    try {
      const validData = currentSchema.parse(data);
      return { success: true, data: validData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        
        error.errors.forEach((err) => {
          const fieldName = err.path[0];
          form.setError(fieldName, {
            type: "validation",
            message: err.message,
          });
        });
      }
      return { success: false, error };
    }
  };

  const handleFormSubmit = (data) => {
    const validation = validateFormData(data);

    if (!validation.success) {
      return; 
    }

    const submitData = {
      name: data.name || undefined,
      is_annual: data.is_annual,
      is_date_range: data.is_date_range,
    };

    if (data.is_date_range) {
      submitData.start_date = data.start_date;
      submitData.end_date = data.end_date;
    } else {
      submitData.date = data.date;
    }

    console.log("📝 Holiday form submission data:", submitData);
    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form
        id="holiday-form"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = form.getValues();
          handleFormSubmit(formData);
        }}
        className={`space-y-6 ${showButtons ? "max-w-xl" : ""}`}
      >
        {isEdit && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              {t("holidays.form.editNote")}
            </p>
          </div>
        )}

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("holidays.form.fields.name")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("holidays.form.placeholders.name")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_date_range"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>{t("holidays.form.fields.isDateRange")}</FormLabel>
                <FormDescription>
                  {t("holidays.form.descriptions.isDateRange")}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_annual"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>{t("holidays.form.fields.isAnnual")}</FormLabel>
                <FormDescription>
                  {t("holidays.form.descriptions.isAnnual")}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {watchedIsDateRange ? (
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("holidays.form.fields.startDate")}</FormLabel>
                  <FormControl>
                    <DatePicker
                      modal={true}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("holidays.form.placeholders.startDate")}
                      captionLayout={
                        watchedIsAnnual ? "dropdown-months" : "dropdown"
                      }
                      hideYear={watchedIsAnnual}
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
                  <FormLabel>{t("holidays.form.fields.endDate")}</FormLabel>
                  <FormControl>
                    <DatePicker
                      modal={true}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={t("holidays.form.placeholders.endDate")}
                      captionLayout={
                        watchedIsAnnual ? "dropdown-months" : "dropdown"
                      }
                      hideYear={watchedIsAnnual}
                      disabled={
                        form.watch("start_date")
                          ? [
                              (date) =>
                                date <= new Date(form.watch("start_date")),
                            ]
                          : []
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        ) : (
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("holidays.form.fields.date")}</FormLabel>
                <FormControl>
                  <DatePicker
                    modal={true}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("holidays.form.placeholders.date")}
                    captionLayout={
                      watchedIsAnnual ? "dropdown-months" : "dropdown"
                    }
                    hideYear={watchedIsAnnual}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
