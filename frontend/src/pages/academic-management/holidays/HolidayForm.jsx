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

const createSchema = (isEdit, t) => {
  if (isEdit) {
    return z.object({
      name: z.string().optional(),
    });
  }

  return z.object({
    name: z.string().optional(),
    is_annual: z.boolean().default(false),
    date: z.string().min(1, t("holidays.form.validation.dateRequired")),
  });
};

export default function HolidayForm({
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
    is_annual: defaultValues?.is_annual || false,
    date: defaultValues?.date || "",
  };

  const form = useForm({
    resolver: zodResolver(createSchema(isEdit, t)),
    defaultValues: transformedDefaultValues,
  });

  // Отслеживаем значение is_annual для условного рендеринга
  const watchedIsAnnual = form.watch("is_annual");

  // Обработчик отправки формы
  const handleFormSubmit = (data) => {
    const submitData = {
      name: data.name || undefined,
    };

    if (!isEdit && data.date) {
      // Для создания добавляем дату и is_annual
      submitData.date = data.date; // Уже в YYYY-MM-DD формате от DatePicker
      submitData.is_annual = data.is_annual;
    }

    console.log("📝 Holiday form submission data:", submitData);
    onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form
        id="holiday-form"
        onSubmit={form.handleSubmit(handleFormSubmit)}
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
          name="is_annual"
          render={({ field }) => (
            <FormItem
              className={`flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 ${
                isEdit ? "bg-gray-50" : ""
              }`}
            >
              <FormControl>
                <Checkbox
                  checked={
                    isEdit ? defaultValues?.is_annual || false : field.value
                  }
                  onCheckedChange={isEdit ? undefined : field.onChange}
                  disabled={isEdit}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel className={isEdit ? "text-muted-foreground" : ""}>
                  {t("holidays.form.fields.isAnnual")}
                </FormLabel>
                <FormDescription>
                  {isEdit
                    ? t("holidays.form.descriptions.isAnnualDisabled")
                    : t("holidays.form.descriptions.isAnnual")}
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem>
              <FormLabel className={isEdit ? "text-muted-foreground" : ""}>
                {t("holidays.form.fields.date")}
              </FormLabel>
              <FormControl>
                {isEdit ? (
                  <DatePicker
                    modal={true}
                    value={defaultValues?.date || ""}
                    disabled={true}
                    placeholder={t("holidays.form.placeholders.date")}
                  />
                ) : (
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
                )}
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
