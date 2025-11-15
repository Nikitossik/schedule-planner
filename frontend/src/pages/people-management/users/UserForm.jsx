// components/users/UserForm.jsx
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
  z
    .object({
      name: z.string().min(1),
      surname: z.string().min(1),
      email: z.string().email(),
      password: z.string().optional(),
      role: z.enum(["admin", "coordinator", "user"]),
      user_type: z.union([
        z.literal(""),
        z.literal("student"),
        z.literal("professor"),
      ]),
      academic_year_id: z.string().optional(),
      semester_id: z.string().optional(),
      group_id: z.string().optional(),
    })
    .refine((data) => !data.password || data.password.length >= 6, {
      path: ["password"],
      message: t("users.form.validation.passwordLength"),
    });

export function UserForm({
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
    surname: defaultValues?.surname || "",
    email: defaultValues?.email || "",
    password: "",
    role: defaultValues?.role || "",
    user_type: defaultValues?.user_type || "",
    academic_year_id: String(
      defaultValues?.student_profile?.academic_year?.id ?? ""
    ),
    semester_id: String(defaultValues?.student_profile?.semester?.id ?? ""),
    group_id: String(defaultValues?.student_profile?.group?.id ?? ""),
  };

  const form = useForm({
    resolver: zodResolver(createSchema(t)),
    defaultValues: transformedDefaultValues,
  });

  const role = form.watch("role");
  const userType = form.watch("user_type");
  const watchedAcademicYearId = form.watch("academic_year_id");
  const watchedSemesterId = form.watch("semester_id");

  // Загружаем академические годы
  const { data: academicYearsData, isLoading: academicYearsLoading } =
    useEntityList("academic_year");
  const academicYears = academicYearsData?.items || [];

  // Загружаем семестры для выбранного академического года
  const { data: semestersData, isLoading: semestersLoading } = useEntityList(
    "semester",
    watchedAcademicYearId
      ? { filters: { academic_year_ids: [watchedAcademicYearId] } }
      : {} // 🔥 Изменили на null чтобы не загружать если нет года
  );
  const semesters = semestersData?.items || [];

  // Загружаем группы для выбранного семестра
  const { data: groupsData, isLoading: groupsLoading } = useEntityList(
    "group",
    watchedSemesterId ? { filters: { semester_ids: [watchedSemesterId] } } : {} // 🔥 Изменили на null чтобы не загружать если нет семестра
  );
  const groups = groupsData?.items || [];

  // Очищаем зависимые поля при изменении родительских
  const handleAcademicYearChange = (value) => {
    form.setValue("academic_year_id", value);
    form.setValue("semester_id", ""); // Очищаем семестр при смене года
    form.setValue("group_id", ""); // Очищаем группу при смене года
  };

  const handleSemesterChange = (value) => {
    form.setValue("semester_id", value);
    form.setValue("group_id", ""); // Очищаем группу при смене семестра
  };

  return (
    <Form {...form}>
      <form
        id="user-form"
        onSubmit={form.handleSubmit(onSubmit)}
        className={`space-y-6 ${showButtons ? "max-w-xl" : ""}`}
      >
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("users.form.sections.basicInfo")}
          </h3>
          {["name", "surname", "email", "password"].map((field) => (
            <FormField
              key={field}
              control={form.control}
              name={field}
              render={({ field: f }) => (
                <FormItem>
                  <FormLabel>{t(`users.form.fields.${field}`)}</FormLabel>
                  <FormControl>
                    <Input
                      type={field === "password" ? "password" : "text"}
                      placeholder={t(`users.form.placeholders.${field}`)}
                      {...f}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-medium">
            {t("users.form.sections.roleAndType")}
          </h3>

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t("users.form.fields.role")}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isEdit}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={t("users.form.placeholders.role")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {["admin", "coordinator", "user"].map((role) => (
                      <SelectItem key={role} value={role}>
                        {t(`users.form.roles.${role}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {role === "user" && (
            <FormField
              control={form.control}
              name="user_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("users.form.fields.userType")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEdit}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("users.form.placeholders.userType")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">
                        {t("users.form.userTypes.student")}
                      </SelectItem>
                      <SelectItem value="professor">
                        {t("users.form.userTypes.professor")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {role === "user" && userType === "student" && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              {t("users.form.sections.studentProfile")}
            </h3>

            <FormField
              control={form.control}
              name="academic_year_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("users.form.fields.academicYear")}</FormLabel>
                  <Select
                    onValueChange={handleAcademicYearChange}
                    value={field.value || ""}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={t("users.form.placeholders.academicYear")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYearsLoading ? (
                        <div className="p-2 text-sm">{t("common.loading")}</div>
                      ) : academicYears.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          {t("users.form.noData.noAcademicYears")}
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
                  <FormLabel>{t("users.form.fields.semester")}</FormLabel>
                  <Select
                    onValueChange={handleSemesterChange}
                    value={field.value || ""}
                    disabled={!watchedAcademicYearId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          watchedAcademicYearId
                            ? t("users.form.placeholders.semester")
                            : t(
                                "users.form.placeholders.selectAcademicYearFirst"
                              )
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {semestersLoading ? (
                        <div className="p-2 text-sm">{t("common.loading")}</div>
                      ) : semesters.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          {watchedAcademicYearId
                            ? t("users.form.noData.noSemesters")
                            : t(
                                "users.form.placeholders.selectAcademicYearFirst"
                              )}
                        </div>
                      ) : (
                        semesters.map((semester) => (
                          <SelectItem
                            key={semester.id}
                            value={String(semester.id)}
                          >
                            {t("users.form.semesterFormat", {
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
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="group_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t("users.form.fields.group")}</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value || ""}
                    disabled={!watchedSemesterId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue
                        placeholder={
                          watchedSemesterId
                            ? t("users.form.placeholders.group")
                            : t("users.form.placeholders.selectSemesterFirst")
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {groupsLoading ? (
                        <div className="p-2 text-sm">{t("common.loading")}</div>
                      ) : groups.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground">
                          {watchedSemesterId
                            ? t("users.form.noData.noGroups")
                            : t("users.form.placeholders.selectSemesterFirst")}
                        </div>
                      ) : (
                        groups.map((g) => (
                          <SelectItem key={g.id} value={String(g.id)}>
                            {g.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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
