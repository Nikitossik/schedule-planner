"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { useAuth } from "@/contexts/AuthContext";
import { useEntityQuery } from "@/hooks/useEntityQuery";
import { useTranslation } from "react-i18next";

export function NavUser() {
  const { isMobile } = useSidebar();
  const { user: authUser, logout } = useAuth();
  const { t } = useTranslation();

  // Загружаем полные данные пользователя из API
  const {
    data: fullUserData,
    isLoading,
    error,
  } = useEntityQuery("user", authUser?.id);

  console.log("NavUser Debug:", {
    authUser,
    userId: Number(authUser?.id),
    enabled: !!Number(authUser?.id),
    fullUserData,
    isLoading,
    error,
  });

  // Используем полные данные если они загружены, иначе данные из контекста
  const user = fullUserData || authUser;

  if (!user || isLoading) {
    return null;
  }

  const displayName =
    user.name && user.surname
      ? `${user.name} ${user.surname}`
      : user.name || user.email || t("navUser.defaultUserName");

  const initials =
    user.name && user.surname
      ? `${user.name[0]}${user.surname[0]}`.toUpperCase()
      : user.name
      ? user.name.slice(0, 2).toUpperCase()
      : "U";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{user.email}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {user.role}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout}>
              <LogOut />
              {t("navUser.logOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
