import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export function Breadcrumbs() {
  const location = useLocation();
  const { t } = useTranslation();

  const pathMap = {
    dashboard: t("navigation.dashboard"),
    users: t("navigation.users"),
    new: t("common.add"),
    edit: t("common.edit"),
    groups: t("navigation.groups"),
    faculties: t("navigation.faculties"),
    subjects: t("navigation.subjects"),
    classrooms: t("navigation.classrooms"),
    schedule: t("navigation.schedule"),
    schedules: t("navigation.schedule"),
    directions: t("breadcrumbs.directions"),
    contracts: t("breadcrumbs.contracts"),
    workloads: t("breadcrumbs.workloads"),
    "academic-management": t("breadcrumbs.academicManagement"),
    "academic-years-semesters": t("breadcrumbs.academicYearsSemesters"),
    "faculties-directions": t("breadcrumbs.facultiesDirections"),
    holidays: t("breadcrumbs.holidays"),
  };

  const segments = location.pathname
    .split("/")
    .filter(Boolean)
    .filter((segment) => !/^\d+$/.test(segment)); // пропускаем числовые ID

  const breadcrumbItems = segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const isLast = index === segments.length - 1;

    const label = pathMap[segment] || segment;

    return (
      <React.Fragment key={href}>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          {isLast ? (
            <BreadcrumbPage>{label}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link to={href}>{label}</Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
      </React.Fragment>
    );
  });

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link to="/">{t("breadcrumbs.home")}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {breadcrumbItems}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
