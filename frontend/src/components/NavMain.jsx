"use client";

import { ChevronRight } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function NavMain({ items }) {
  const location = useLocation();
  const { t } = useTranslation();

  // Функция для проверки активности группы
  const isGroupActive = (group) => {
    if (!group.items) return false;
    return group.items.some((item) => {
      if (item.url === "/users/") {
        return (
          location.pathname === "/" || location.pathname.startsWith("/users")
        );
      }
      return location.pathname.startsWith(item.url);
    });
  };

  // Функция для проверки активности конкретного элемента
  const isItemActive = (url) => {
    if (url === "/users/") {
      return (
        location.pathname === "/" || location.pathname.startsWith("/users")
      );
    }
    return location.pathname.startsWith(url);
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t("navigation.dashboard")}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          // Если у элемента есть подэлементы, используем выпадающий список
          if (item.items && item.items.length > 0) {
            const isActive = isGroupActive(item);

            return (
              <Collapsible
                key={item.title}
                asChild
                defaultOpen={isActive}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                      tooltip={item.title}
                      className={isActive ? "font-semibold" : ""}
                    >
                      {item.icon && <item.icon />}
                      <span>{item.title}</span>
                      <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {item.items.map((subItem) => (
                        <SidebarMenuSubItem key={subItem.title}>
                          <SidebarMenuSubButton
                            asChild
                            isActive={isItemActive(subItem.url)}
                          >
                            <a href={subItem.url}>
                              {subItem.icon && (
                                <subItem.icon className="size-4" />
                              )}
                              <span>{subItem.title}</span>
                            </a>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          } else {
            // Для элементов без подэлементов используем старую логику
            const isActive = isItemActive(item.url);

            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={isActive}>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
