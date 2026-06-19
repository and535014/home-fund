import {
  Home,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";
import { MonthSwitcher } from "./month-switcher";
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";

export type DashboardNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  active: boolean;
};

export type HomeDashboardLayoutProps = {
  canCreateOwnRecords: boolean;
  children: ReactNode;
  createExpenseHref?: string;
  createIncomeHref?: string;
  createRecordDialogContent?: ReactNode;
  currentMonth: string;
  displayName: string;
  headerActions?: ReactNode;
  headerDescription?: string;
  mobileFooterActions?: ReactNode;
  navigationItems: DashboardNavigationItem[];
  sidebarFooterActions?: ReactNode;
  showCreateRecordActions?: boolean;
  showMonthSwitcher?: boolean;
  subtitle?: string;
  title?: string;
};

export function HomeDashboardLayout({
  canCreateOwnRecords,
  children,
  createExpenseHref = "/?create=expense",
  createIncomeHref = "/?create=income",
  createRecordDialogContent,
  currentMonth,
  displayName,
  headerActions,
  headerDescription,
  mobileFooterActions,
  navigationItems,
  sidebarFooterActions,
  showCreateRecordActions = true,
  showMonthSwitcher = true,
  subtitle = "2026 年 6 月",
  title = "家庭資金總覽",
}: HomeDashboardLayoutProps) {
  const canShowCreateActions = canCreateOwnRecords && showCreateRecordActions;
  const contentTopPadding = headerDescription
    ? "pt-44 sm:pt-36"
    : "pt-32 sm:pt-28";

  return (
    <SidebarProvider className="min-h-screen bg-background text-foreground">
      <DashboardSidebar
        displayName={displayName}
        navigationItems={navigationItems}
        sidebarFooterActions={sidebarFooterActions}
      />
      <SidebarInset className="min-w-0 pb-28 md:pb-0">
        <header className="fixed inset-x-0 top-0 z-20 border-b border-border bg-background/95 px-4 py-4 backdrop-blur md:left-(--sidebar-width) sm:px-6 lg:px-8">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {!showMonthSwitcher ? (
                <p className="text-label text-muted-foreground">{subtitle}</p>
              ) : null}
              <h2 className="mt-1 text-heading text-foreground">
                {title}
              </h2>
              {headerDescription ? (
                <p className="mt-1 max-w-2xl text-caption text-muted-foreground">
                  {headerDescription}
                </p>
              ) : null}
            </div>
            <div className="flex w-full flex-wrap gap-2 sm:w-auto">
              {showMonthSwitcher ? (
                <MonthSwitcher currentMonth={currentMonth} />
              ) : null}
              {headerActions}
              {canShowCreateActions ? (
                <Button asChild className="hidden md:inline-flex" variant="secondary">
                  <a href={createIncomeHref}>
                    <TrendingUp aria-hidden="true" size={18} />
                    <span>新增收入</span>
                  </a>
                </Button>
              ) : null}
              {canShowCreateActions ? (
                <Button asChild className="hidden md:inline-flex">
                  <a href={createExpenseHref}>
                    <TrendingDown aria-hidden="true" size={18} />
                    <span>新增支出</span>
                  </a>
                </Button>
              ) : null}
            </div>
          </div>
        </header>

        <div className={`mx-auto min-h-screen w-full max-w-7xl px-4 pb-5 ${contentTopPadding} sm:px-6 lg:px-8`}>
          {children}
        </div>

        {canShowCreateActions || mobileFooterActions ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-12px_30px_rgba(0,0,0,0.28)] backdrop-blur md:hidden">
          <div className="mx-auto flex max-w-md items-center gap-2">
                {mobileFooterActions}
                {canShowCreateActions ? (
                <Button asChild className="h-12 min-w-0 flex-1 px-3" size="lg" variant="secondary">
                  <a href={createIncomeHref}>
                    <TrendingUp aria-hidden="true" size={18} />
                    <span className="truncate">收入</span>
                  </a>
                </Button>
                ) : null}
                {canShowCreateActions ? (
                <Button asChild className="h-12 min-w-0 flex-1 px-3" size="lg">
                  <a href={createExpenseHref}>
                    <TrendingDown aria-hidden="true" size={18} />
                    <span className="truncate">支出</span>
                  </a>
                </Button>
                ) : null}
          </div>
        </div>
        ) : null}
      </SidebarInset>
      {createRecordDialogContent}
    </SidebarProvider>
  );
}

function DashboardSidebar({
  displayName,
  navigationItems,
  sidebarFooterActions,
}: {
  displayName: string;
  navigationItems: DashboardNavigationItem[];
  sidebarFooterActions?: ReactNode;
}) {
  return (
    <Sidebar className="min-h-svh border-r border-border">
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3">
          <Card className="grid size-10 place-items-center border-0 bg-primary py-0 text-primary-foreground">
            <Home aria-hidden="true" size={20} />
          </Card>
          <div className="min-w-0">
            <p className="text-label text-muted-foreground">家庭共用金</p>
            <h1 className="text-subheading text-foreground">月報工作台</h1>
            <p className="mt-1 truncate text-caption text-muted-foreground">
              {displayName}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    className="h-10 rounded-button text-label"
                    isActive={item.active}
                  >
                    <a
                      aria-current={item.active ? "page" : undefined}
                      href={item.href}
                    >
                      <item.icon aria-hidden="true" size={18} />
                      <span>{item.label}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      {sidebarFooterActions ? (
        <SidebarFooter className="border-t border-sidebar-border px-4 py-4">
          {sidebarFooterActions}
        </SidebarFooter>
      ) : null}
    </Sidebar>
  );
}
