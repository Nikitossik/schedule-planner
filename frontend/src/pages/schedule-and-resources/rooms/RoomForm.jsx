import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
    number: z.string().min(1, t("rooms.form.validation.numberRequired")),
    capacity: z
      .union([z.string(), z.number(), z.null()])
      .optional()
      .transform((val) => {
        if (val === "" || val === null || val === undefined) return null;
        const num = typeof val === 'string' ? Number(val) : val;
        return isNaN(num) ? null : num;
      })
      .refine(
        (val) => val === null || (typeof val === 'number' && val > 0),
        {
          message: t("rooms.form.validation.capacityMin"),
        }
      ),
  });

export default function RoomForm({
  id,
  defaultValues,
  isEdit = false,
  onSubmit,
  showButtons = true,
  isLoading = false,
}) {
  const { t } = useTranslation();
  const form = useForm({
    resolver: zodResolver(createSchema(t)),
    defaultValues: {
      number: defaultValues?.number || "",
      capacity: defaultValues?.capacity || "",
    },
  });

  return (
    <Form {...form}>
      <form
        id={id}
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 max-w-xl"
      >
        <FormField
          control={form.control}
          name="number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("rooms.form.fields.number")}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder={t("rooms.form.placeholders.number")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="capacity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("rooms.form.fields.capacity")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  {...field}
                  placeholder={t("rooms.form.placeholders.capacity")}
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
