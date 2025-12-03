import React from "react";
import { useTranslation } from "react-i18next";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Laptop,
  FlaskConical,
  MessageSquare,
  Presentation,
} from "lucide-react";

const LESSON_TYPES = [
  {
    value: "lecture",
    translationKey: "lessons.form.lessonType.lecture",
    icon: Presentation,
  },
  {
    value: "practice",
    translationKey: "lessons.form.lessonType.practice",
    icon: Laptop,
  },
  {
    value: "lab",
    translationKey: "lessons.form.lessonType.lab",
    icon: FlaskConical,
  },
  {
    value: "seminar",
    translationKey: "lessons.form.lessonType.seminar",
    icon: MessageSquare,
  },
  {
    value: "project",
    translationKey: "lessons.form.lessonType.project",
    icon: Presentation,
  },
];

export function LessonTypeSelector({ value, onChange, error }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="text-lg font-medium">
          {t("lessons.form.sections.lessonType")}
        </h3>
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue
              placeholder={t("lessons.form.placeholders.selectLessonType")}
            />
          </SelectTrigger>
          <SelectContent>
            {LESSON_TYPES.map((type) => {
              const IconComponent = type.icon;
              return (
                <SelectItem key={type.value} value={type.value}>
                  <div className="flex items-center">
                    <IconComponent className="h-4 w-4 mr-2" />
                    {t(type.translationKey)}
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
        {error && <p className="text-sm text-red-500">{error.message}</p>}
      </CardContent>
    </Card>
  );
}
