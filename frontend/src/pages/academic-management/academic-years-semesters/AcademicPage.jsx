import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { AcademicYearsPage } from "./academic-years/AcademicYearsPage";
import { SemestersPage } from "./semesters/SemestersPage";

export default function AcademicPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("academic-years");

  return (
    <div className="container mx-auto py-3">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {t("pages.academicYearsSemesters.title")}
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-96 grid-cols-2">
          <TabsTrigger value="academic-years">
            {t("pages.academicYearsSemesters.tabs.academicYears")}
          </TabsTrigger>
          <TabsTrigger value="semesters">
            {t("pages.academicYearsSemesters.tabs.semesters")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="semesters" className="mt-2">
          <SemestersPage />
        </TabsContent>

        <TabsContent value="academic-years" className="mt-2">
          <AcademicYearsPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
