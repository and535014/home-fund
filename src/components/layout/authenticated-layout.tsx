import { Home, LogOut } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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

export type AppNavigationItem = {
  label: string;
  href: string;
  icon: AppNavigationIconName;
};

export type AuthenticatedLayoutProps = {
  account?: {
    displayName: string;
  };
  accountOverride?: {
    displayName: string;
  };
  children: ReactNode;
  navigation: AppNavigationItem[];
};

export async function AuthenticatedLayout({
  account,
  accountOverride,
  children,
  navigation,
}: AuthenticatedLayoutProps) {
  const resolvedAccount = accountOverride ?? account;

  return (
    <SidebarProvider className="min-h-screen bg-background text-foreground">
      <AuthenticatedSidebar
        displayName={resolvedAccount?.displayName ?? ""}
        navigationItems={navigation}
      />
      <SidebarInset className="min-w-0 pb-28 md:pb-0">
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

function AuthenticatedSidebar({
  displayName,
  navigationItems,
}: {
  displayName: string;
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
        <div className="mb-3 flex min-w-0 items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback>{avatarFallbackFor(displayName)}</AvatarFallback>
          </Avatar>
          <p className="min-w-0 truncate text-label text-foreground">
            {displayName}
          </p>
        </div>
        <form action="/auth/logout" method="post">
          <Button className="w-full justify-start" type="submit" variant="ghost">
            <LogOut aria-hidden="true" size={18} />
            登出
          </Button>
        </form>
      </SidebarFooter>
    </Sidebar>
  );
}

function avatarFallbackFor(displayName: string): string {
  const trimmed = displayName.trim();

  if (!trimmed) {
    return "?";
  }

  return trimmed.slice(0, 1).toUpperCase();
}
