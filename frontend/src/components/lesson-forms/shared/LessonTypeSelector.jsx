import React from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
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
];

export function LessonTypeSelector({ value, onChange, error }) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        <h3 className="text-lg font-medium">
          {t("lessons.form.sections.lessonType")}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {LESSON_TYPES.map((type) => {
            const IconComponent = type.icon;
            return (
              <Button
                key={type.value}
                type="button"
                variant={value === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => onChange(type.value)}
                className="justify-start"
              >
                <IconComponent className="h-4 w-4 mr-2" />
                {t(type.translationKey)}
              </Button>
            );
          })}
        </div>
        {error && <p className="text-sm text-red-500">{error.message}</p>}
      </CardContent>
    </Card>
  );
}
