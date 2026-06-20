import type { ReactNode } from "react";
import { requireAuthenticatedMember } from "@/auth/app-access";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { SettingsLogoutButton, SettingsSidebarNav } from "./settings-sidebar-nav";

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAuthenticatedMember();
  const displayName = session.profile.displayName;
  const settingsItems = [
    { href: "/settings/account", label: "帳號資訊", visible: true },
    {
      href: "/settings/members",
      label: "成員",
      visible: session.accessHints.navigation.canOpenMembers,
    },
    {
      href: "/settings/categories",
      label: "分類",
      visible: session.accessHints.navigation.canOpenCategories,
    },
  ].filter((item) => item.visible);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="grid min-h-0 flex-1 grid-cols-[18rem_minmax(0,1fr)] overflow-hidden">
        <Sidebar collapsible="none" className="w-full border-r border-border bg-background">
          <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-11">
                <AvatarImage alt={`${displayName} 的頭像`} src={session.profile.avatarUrl} />
                <AvatarFallback>{avatarFallbackFor(displayName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-body-strong text-foreground">
                  {displayName}
                </p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SettingsSidebarNav items={settingsItems} />
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="border-t border-sidebar-border px-4 py-4">
            <SettingsLogoutButton />
          </SidebarFooter>
        </Sidebar>
        <main className="min-h-0 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}

function avatarFallbackFor(displayName: string): string {
  const trimmed = displayName.trim();

  if (!trimmed) {
    return "?";
  }

  return trimmed.slice(0, 1).toUpperCase();
}
