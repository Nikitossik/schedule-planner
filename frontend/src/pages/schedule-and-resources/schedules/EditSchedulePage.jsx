import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import { useEntityQuery } from "@/hooks/useEntityQuery";
import { useEntityMutation } from "@/hooks/useEntityMutation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Repeat } from "lucide-react";
import ScheduleForm from "./ScheduleForm";
import { LessonsList } from "./lessons";
import { RecurringLessonsPage } from "./recurring-lessons";

export default function EditSchedulePage() {
  const { t } = useTranslation();
  const { scheduleId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("calendar");

  const {
    data: schedule,
    isLoading,
    isError,
    refetch,
  } = useEntityQuery("schedule", scheduleId);
  const updateSchedule = useEntityMutation("schedule", "patch");

  const handleSubmit = (values) => {
    // При редактировании отправляем только имя, semester_id не меняется
    const updateData = {
      name: values.name,
    };

    updateSchedule.mutate(
      { id: scheduleId, data: updateData },
      {
        onSuccess: () => {
          toast.success(t("schedules.messages.updateSuccess"));
        },
        onError: (err) => {
          toast.error(err.message || t("schedules.messages.updateError"));
        },
      }
    );
  };

  if (isLoading)
    return <div className="p-4">{t("schedules.editPage.loading")}</div>;
  if (isError)
    return (
      <div className="p-4 text-red-500">{t("schedules.editPage.error")}</div>
    );

  return (
    <div className="container mx-auto py-3 space-y-6">
      <h1 className="text-2xl font-bold mb-6">
        {t("schedules.editPage.title")}
      </h1>

      {/* Main schedule form */}
      <Card>
        <CardHeader>
          <CardTitle>{t("schedules.editPage.scheduleInfo")}</CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleForm
            isEdit
            defaultValues={schedule}
            onSubmit={handleSubmit}
            isLoading={updateSchedule.isPending}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Tabs section */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-96">
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {t("schedules.tabs.calendar")}
          </TabsTrigger>
          <TabsTrigger value="recurring" className="flex items-center gap-2">
            <Repeat className="w-4 h-4" />
            {t("schedules.tabs.recurringLessons")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="mt-6">
          <LessonsList schedule={schedule} onUpdate={refetch} />
        </TabsContent>

        <TabsContent value="recurring" className="mt-6">
          <RecurringLessonsPage scheduleId={scheduleId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
