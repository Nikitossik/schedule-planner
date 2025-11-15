import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { FacultiesPage } from "./faculties/FacultiesPage";
import { DirectionsPage } from "./directions/DirectionsPage";

const FacultiesDirectionsPage = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("faculties");

  return (
    <div className="container mx-auto py-3">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">
          {t("pages.facultiesDirections.title")}
        </h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-96 grid-cols-2">
          <TabsTrigger value="faculties">
            {t("pages.facultiesDirections.tabs.faculties")}
          </TabsTrigger>
          <TabsTrigger value="directions">
            {t("pages.facultiesDirections.tabs.directions")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="faculties" className="mt-2">
          <FacultiesPage showBreadcrumbs={false} />
        </TabsContent>

        <TabsContent value="directions" className="mt-2">
          <DirectionsPage showBreadcrumbs={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FacultiesDirectionsPage;
