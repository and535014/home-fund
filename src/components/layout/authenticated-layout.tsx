import { Home } from "lucide-react";
import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import type { AppNavigationIconName } from "./app-navigation-icons";
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
  account,
  accountOverride,
  canCreateRecord = false,
  children,
  navigation,
}: AuthenticatedLayoutProps) {
  const resolvedAccount = accountOverride ?? account;

  return (
    <SidebarProvider className="min-h-screen bg-background text-foreground">
      <AuthenticatedSidebar
        canCreateRecord={canCreateRecord}
        navigationItems={navigation}
      />
      <SidebarInset className="min-w-0 pb-28 md:pb-0">
        {children}
      </SidebarInset>
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
    <Sidebar className="min-h-svh border-r border-border">
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3">
          <Card className="grid size-10 place-items-center border-0 bg-primary py-0 text-primary-foreground">
            <Home aria-hidden="true" size={20} />
          </Card>
          <div className="min-w-0">
            <h1 className="text-subheading text-foreground">家庭共用金</h1>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <AuthenticatedSidebarNav navigationItems={navigationItems} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border px-4 py-4">
        {canCreateRecord ? <RecordCreateSidebarButton /> : null}
      </SidebarFooter>
    </Sidebar>
  );
}
