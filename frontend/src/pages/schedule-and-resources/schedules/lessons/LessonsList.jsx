import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { LessonForm } from "./LessonForm";
import { LessonsCalendar } from "./LessonsCalendar";
import { ExportDialog } from "./components/ExportDialog";
import { SchedulePageProvider } from "@/contexts/SchedulePageContext";
import { useEntityMutation } from "@/hooks/useEntityMutation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function LessonsList({ schedule, onUpdate }) {
  return (
    <SchedulePageProvider schedule={schedule}>
      <LessonsListContent schedule={schedule} onUpdate={onUpdate} />
    </SchedulePageProvider>
  );
}

function LessonsListContent({ schedule, onUpdate }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  // const [viewMode, setViewMode] = useState("table");

  const createLesson = useEntityMutation("lesson", "create");
  const updateLesson = useEntityMutation("lesson", "patch");
  const deleteLesson = useEntityMutation("lesson", "delete");

  const handleCreate = (lessonData = {}) => {
    setEditingLesson(lessonData.date ? lessonData : null);
    setIsEditing(false);
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (lesson) => {
    setEditingLesson(lesson);
    setIsEditing(true);
    setIsCreateDialogOpen(true);
  };

  const handleSaveLesson = async (lessonData) => {
    try {
      if (isEditing) {
        console.log("Updating lesson:", lessonData);

        await updateLesson.mutateAsync({
          id: editingLesson.id,
          data: lessonData,
        });
        toast.success(t("lessons.messages.updateSuccess"));
      } else {
        await createLesson.mutateAsync({
          ...lessonData,
          schedule_id: schedule.id,
        });
        toast.success(t("lessons.messages.createSuccess"));
      }

      setRefreshTrigger((prev) => prev + 1); // Тригgerим обновление календаря

      // Инвалидируем кеши
      queryClient.invalidateQueries(["calendar-lessons", schedule?.id]);
      queryClient.invalidateQueries(["conflicts-summary", schedule?.id]);
      queryClient.invalidateQueries(["local-workload-warnings", schedule?.id]);

      setIsCreateDialogOpen(false);
      setEditingLesson(null);
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.message || t("lessons.messages.createError"));
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    try {
      await deleteLesson.mutateAsync({ id: lessonId });
      toast.success(t("lessons.messages.deleteSuccess"));
      setRefreshTrigger((prev) => prev + 1); // Тригgerим обновление календаря

      // Инвалидируем кеши
      queryClient.invalidateQueries(["calendar-lessons", schedule?.id]);
      queryClient.invalidateQueries(["conflicts-summary", schedule?.id]);
      queryClient.invalidateQueries(["local-workload-warnings", schedule?.id]);

      setIsCreateDialogOpen(false);
      setEditingLesson(null);
      setIsEditing(false);
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.message || t("lessons.messages.deleteError"));
    }
  };

  return (
    <div className="space-y-4">
      {/* Add lesson and export buttons */}
      <div className="flex items-center justify-between">
        <ExportDialog>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t("lessons.exportButton")}
          </Button>
        </ExportDialog>

        <Button onClick={() => handleCreate()}>
          <Plus className="h-4 w-4 mr-2" />
          {t("lessons.addButton")}
        </Button>
      </div>

      {/* Calendar view */}
      <LessonsCalendar
        schedule={schedule}
        onEditLesson={handleEdit}
        onUpdateLesson={updateLesson}
        onCreateLesson={(lessonData) => {
          // Создать урок с предзаполненными датой/временем
          handleCreate(lessonData);
        }}
        refreshTrigger={refreshTrigger}
      />

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <LessonForm
          lesson={editingLesson}
          schedule={schedule}
          isEdit={isEditing}
          onSave={handleSaveLesson}
          onDelete={handleDeleteLesson}
          onCancel={() => {
            setIsCreateDialogOpen(false);
            setEditingLesson(null);
            setIsEditing(false);
          }}
        />
      </Dialog>
    </div>
  );
}
