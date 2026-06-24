import type { CSSProperties, ReactNode } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import type { AppNavigationIconName } from "./app-navigation-icons";
import { AuthenticatedMobileNav } from "./authenticated-mobile-nav";
import { AuthenticatedSidebarNav } from "./authenticated-sidebar-nav";
import { RecordCreateSidebarButton } from "./record-create-sidebar-button";

export type AppNavigationItem = {
  label: string;
  href: string;
  icon: AppNavigationIconName;
};

export type AuthenticatedLayoutProps = {
  account?: {
    displayName: string;
    avatarUrl?: string;
  };
  accountOverride?: {
    displayName: string;
    avatarUrl?: string;
  };
  canCreateRecord?: boolean;
  children: ReactNode;
  navigation: AppNavigationItem[];
};

export async function AuthenticatedLayout({
  canCreateRecord = false,
  children,
  navigation,
}: AuthenticatedLayoutProps) {
  return (
    <SidebarProvider
      className="h-svh min-h-0 overflow-hidden bg-background text-foreground"
      defaultOpen={false}
      style={{
        "--sidebar-width": "4.25rem",
        "--sidebar-width-icon": "4.25rem",
      } as CSSProperties}
    >
      <AuthenticatedSidebar
        canCreateRecord={canCreateRecord}
        navigationItems={navigation}
      />
      <SidebarInset className="h-svh min-h-0 min-w-0 overflow-hidden">
        {children}
      </SidebarInset>
      <AuthenticatedMobileNav
        canCreateRecord={canCreateRecord}
        navigationItems={navigation}
      />
    </SidebarProvider>
  );
}

function AuthenticatedSidebar({
  canCreateRecord,
  navigationItems,
}: {
  canCreateRecord: boolean;
  navigationItems: AppNavigationItem[];
}) {
  return (
    <Sidebar className="min-h-svh border-r border-border" collapsible="icon">
      <SidebarContent>
        <SidebarGroup className="p-3">
          <SidebarGroupContent>
            <AuthenticatedSidebarNav navigationItems={navigationItems} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="items-center border-t border-sidebar-border px-3 pb-6 pt-3">
        {canCreateRecord ? <RecordCreateSidebarButton /> : null}
      </SidebarFooter>
    </Sidebar>
  );
}
