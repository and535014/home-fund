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
import {
  SettingsLogoutButton,
  SettingsMobileNav,
  SettingsSidebarNav,
} from "./settings-sidebar-nav";

export default async function SettingsLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAuthenticatedMember();
  const displayName = session.profile.displayName;
  const canManageRecurringRules =
    session.profile.roles.includes("admin") ||
    session.profile.roles.includes("finance_manager");
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
    {
      href: "/settings/recurring",
      label: "週期事件",
      visible: canManageRecurringRules,
    },
    {
      href: "/settings/import",
      label: "CSV 匯入",
      visible: session.accessHints.actions.canImportLedgerRecords,
    },
  ].filter((item) => item.visible);

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:grid md:grid-cols-[18rem_minmax(0,1fr)]">
        <section className="shrink-0 border-b border-border bg-background/95 pt-4 md:hidden">
          <div className="flex min-w-0 items-center justify-between gap-3 px-4 pb-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-10">
                <AvatarImage alt={`${displayName} 的頭像`} src={session.profile.avatarUrl} />
                <AvatarFallback>{avatarFallbackFor(displayName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate text-body-strong text-foreground">
                  {displayName}
                </p>
              </div>
            </div>
            <div className="shrink-0">
              <SettingsLogoutButton />
            </div>
          </div>
          <SettingsMobileNav items={settingsItems} />
        </section>
        <Sidebar collapsible="none" className="hidden w-full border-r border-border bg-background md:flex">
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
        <main className="min-h-0 flex-1 overflow-hidden">
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
