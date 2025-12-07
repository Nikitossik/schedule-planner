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
    contract_id: z.coerce
      .number()
      .min(1, t("workloads.form.validation.contractRequired")),
    study_form_id: z.coerce
      .number()
      .min(1, t("workloads.form.validation.directionRequired")),
    assigned_hours: z
      .string()
      .refine((val) => val.trim() !== "", {
        message: t("workloads.form.validation.hoursEmpty"),
      })
      .refine((val) => val.trim() !== "0", {
        message: t("workloads.form.validation.hoursZero"),
      })
      .transform((val) => Number(val)),
  });

const WorkloadForm = ({
  defaultValues = {},
  isEdit = false,
  onSubmit,
  showButtons = true,
  isLoading = false,
}) => {
  const { t } = useTranslation();

  const form = useForm({
    resolver: zodResolver(createSchema(t)),
    defaultValues: {
      contract_id: defaultValues.contract_id || "",
      study_form_id: defaultValues.study_form_id || "",
      assigned_hours: defaultValues.assigned_hours || "",
    },
  });

  let { data: contracts = [], isLoading: loadingContracts } = useEntityList(
    "professor_contract",
    {
      filters: {
        page: 1,
        pageSize: 100,
      },
    }
  );

  let { data: studyForms = [], isLoading: loadingStudyForms } = useEntityList(
    "study_form",
    {
      filters: {
        sort_by: "direction_name",
        desc: false,
        page: 1,
        pageSize: 100,
      },
    }
  );

  contracts = contracts.items || [];
  studyForms = studyForms.items || [];

  const handleSubmit = (data) => {
    onSubmit({
      contract_id: Number(data.contract_id),
      study_form_id: Number(data.study_form_id),
      assigned_hours: data.assigned_hours === "" ? null : Number(data.assigned_hours),
    });
  };

  return (
    <Form {...form}>
      <form
        id="workload-form"
        onSubmit={form.handleSubmit(handleSubmit)}
        className={`space-y-6 ${showButtons ? "max-w-xl" : ""}`}
      >
        <FormField
          control={form.control}
          name="contract_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("workloads.form.fields.contract")}</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value ? String(field.value) : ""}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("workloads.form.placeholders.contract")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {loadingContracts ? (
                    <div className="p-2 text-sm">{t("common.loading")}</div>
                  ) : contracts.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      {t("workloads.form.noData.noContracts")}
                    </div>
                  ) : (
                    contracts.map((contract) => (
                      <SelectItem key={contract.id} value={String(contract.id)}>
                        <div className="flex flex-row items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{
                              backgroundColor:
                                contract.professor?.professor_profile?.color,
                            }}
                          />
                          <span>
                            {
                              contract.professor?.professor_profile
                                ?.academic_title
                            }{" "}
                            {contract.professor?.name}{" "}
                            {contract.professor?.surname} -{" "}
                            {contract.semester?.name}
                          </span>
                        </div>
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
          name="study_form_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("workloads.form.fields.direction")}</FormLabel>
              <Select
                onValueChange={(value) => field.onChange(Number(value))}
                value={field.value ? String(field.value) : ""}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={t("workloads.form.placeholders.direction")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {loadingStudyForms ? (
                    <div className="p-2 text-sm">{t("common.loading")}</div>
                  ) : studyForms.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      {t("workloads.form.noData.noStudyForms")}
                    </div>
                  ) : (
                    studyForms.map((sf) => (
                      <SelectItem key={sf.id} value={String(sf.id)}>
                        {(() => {
                          const form = sf.form;
                          const translatedForm = form === 'full-time' ? t('common.studyForms.fullTime') : 
                                                form === 'part-time' ? t('common.studyForms.partTime') : form;
                          return `${sf.direction?.name} (${translatedForm})`;
                        })()}
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
          name="assigned_hours"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("workloads.form.fields.assignedHours")}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  placeholder={t("workloads.form.placeholders.assignedHours")}
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
              ? t("common.buttons.update")
              : t("common.buttons.create")}
          </Button>
        )}
      </form>
    </Form>
  );
};

export default WorkloadForm;
