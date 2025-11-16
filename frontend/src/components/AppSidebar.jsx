import * as React from "react";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  DoorOpen,
  School,
  GalleryVerticalEnd,
  User,
  CalendarDays,
  Users,
  Settings,
  Compass,
  FileText,
  Scale,
  GraduationCap,
  Building2,
  UserCheck,
  Calendar,
} from "lucide-react";

import { NavMain } from "@/components/NavMain";
import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/NavUser";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }) {
  const { t } = useTranslation();

  const data = {
    navMain: [
      {
        title: t("sidebar.academicManagement"),
        icon: GraduationCap,
        items: [
          {
            title: t("sidebar.academicYearsSemesters"),
            url: "/academic-years-semesters/",
            icon: Calendar,
          },
          {
            title: t("sidebar.facultiesDirections"),
            url: "/faculties-directions/",
            icon: School,
          },
          {
            title: t("sidebar.subjects"),
            url: "/subjects/",
            icon: BookOpen,
          },
        ],
      },
      {
        title: t("sidebar.peopleManagement"),
        icon: Users,
        items: [
          {
            title: t("sidebar.users"),
            url: "/users/",
            icon: User,
          },
          {
            title: t("sidebar.groups"),
            url: "/groups/",
            icon: UserCheck,
          },
        ],
      },
      {
        title: t("sidebar.teachingLoad"),
        icon: Scale,
        items: [
          {
            title: t("sidebar.contracts"),
            url: "/contracts/",
            icon: FileText,
          },
          {
            title: t("sidebar.workloads"),
            url: "/workloads/",
            icon: Scale,
          },
        ],
      },
      {
        title: t("sidebar.scheduleResources"),
        icon: CalendarDays,
        items: [
          {
            title: t("sidebar.schedules"),
            url: "/schedules/",
            icon: Calendar,
          },
          {
            title: t("sidebar.classrooms"),
            url: "/classrooms/",
            icon: Building2,
          },
        ],
      },
    ],
  };

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenuButton size="lg">
          <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
            <GalleryVerticalEnd className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-medium">{t("app.name")}</span>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
