"use client";

import { usePathname, useSearchParams } from "next/navigation";
import {
  CalendarClock,
  CircleDollarSign,
  HandCoins,
  Home,
  ListChecks,
  Plus,
  ReceiptText,
  Repeat,
  Search,
  Settings,
  Tags,
  Users,
  type LucideIcon,
} from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { APP_NAVIGATION_ICONS } from "./app-navigation-icons";
import type { AppNavigationItem } from "./authenticated-layout";

const navigationIcons: Record<AppNavigationItem["icon"], LucideIcon> = {
  [APP_NAVIGATION_ICONS.calendarClock]: CalendarClock,
  [APP_NAVIGATION_ICONS.circleDollarSign]: CircleDollarSign,
  [APP_NAVIGATION_ICONS.handCoins]: HandCoins,
  [APP_NAVIGATION_ICONS.home]: Home,
  [APP_NAVIGATION_ICONS.listChecks]: ListChecks,
  [APP_NAVIGATION_ICONS.plus]: Plus,
  [APP_NAVIGATION_ICONS.receiptText]: ReceiptText,
  [APP_NAVIGATION_ICONS.repeat]: Repeat,
  [APP_NAVIGATION_ICONS.search]: Search,
  [APP_NAVIGATION_ICONS.settings]: Settings,
  [APP_NAVIGATION_ICONS.tags]: Tags,
  [APP_NAVIGATION_ICONS.users]: Users,
};

export function AuthenticatedSidebarNav({
  navigationItems,
}: {
  navigationItems: AppNavigationItem[];
}) {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const currentHref = searchParams && searchParams.size > 0
    ? `${pathname}?${searchParams.toString()}`
    : pathname;

  return (
    <SidebarMenu>
      {navigationItems.map((item) => {
        const active = isActiveNavigationItem(item.href, pathname, currentHref);
        const Icon = navigationIcons[item.icon];

        return (
          <SidebarMenuItem key={item.label}>
            <SidebarMenuButton
              asChild
              className="h-10 rounded-button text-label"
              isActive={active}
            >
              <a
                aria-current={active ? "page" : undefined}
                href={item.href}
              >
                <Icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}

function isActiveNavigationItem(
  href: string,
  pathname: string,
  currentHref: string,
): boolean {
  if (href.includes("?")) {
    return currentHref === href;
  }

  if (href !== "/" && pathname.startsWith(`${href}/`)) {
    return true;
  }

  return pathname === href;
}
