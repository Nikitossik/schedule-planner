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

const createSchema = (t) =>
  z.object({
    name: z.string().min(1, t("faculties.form.validation.nameRequired")),
  });

export default function FacultyForm({
  defaultValues,
  isEdit = false,
  onSubmit,
  showButtons = true,
  isLoading = false,
}) {
  const { t } = useTranslation();
  const form = useForm({
    resolver: zodResolver(createSchema(t)),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form
        id="faculty-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className={`space-y-6 ${showButtons ? "max-w-xl" : ""}`}
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("faculties.form.fields.name.label")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("faculties.form.fields.name.placeholder")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {showButtons && (
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? t("faculties.form.buttons.saving")
              : isEdit
              ? t("faculties.form.buttons.update")
              : t("faculties.form.buttons.create")}
          </Button>
        )}
      </form>
    </Form>
  );
}
