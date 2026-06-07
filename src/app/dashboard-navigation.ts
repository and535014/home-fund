import {
  CalendarClock,
  CircleDollarSign,
  HandCoins,
  Plus,
  ReceiptText,
  Tags,
  Users,
} from "lucide-react";
import type { DashboardNavigationItem } from "./home-dashboard-layout";
import type { HomeDashboardView } from "./home-access";

export function getVisibleDashboardNavigationItems(
  accessHints: HomeDashboardView["accessHints"],
  activeHref: string,
): DashboardNavigationItem[] {
  return [
    {
      label: "月報",
      href: "/",
      icon: CircleDollarSign,
      active: activeHref === "/",
      visible: accessHints.navigation.canOpenReports,
    },
    {
      label: "紀錄",
      href: "/records",
      icon: ReceiptText,
      active: activeHref === "/records",
      visible: accessHints.navigation.canOpenRecords,
    },
    {
      label: "新增",
      href: "/?create=income",
      icon: Plus,
      active: activeHref === "/?create=income",
      visible: accessHints.navigation.canOpenCreateRecord,
    },
    {
      label: "退款",
      href: "/reimbursements",
      icon: HandCoins,
      active: activeHref === "/reimbursements",
      visible: accessHints.navigation.canOpenReimbursements,
    },
    {
      label: "週期",
      href: "/recurring",
      icon: CalendarClock,
      active: activeHref === "/recurring",
      visible: accessHints.navigation.canOpenRecurring,
    },
    {
      label: "分類",
      href: "/categories",
      icon: Tags,
      active: activeHref === "/categories",
      visible: accessHints.navigation.canOpenCategories,
    },
    {
      label: "成員",
      href: "/members",
      icon: Users,
      active: activeHref === "/members",
      visible: accessHints.navigation.canOpenMembers,
    },
  ].filter((item) => item.visible);
}
