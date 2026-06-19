import { APP_NAVIGATION_ICONS } from "@/components/layout/app-navigation-icons";
import type { AppNavigationItem } from "@/components/layout/authenticated-layout";
import type { HomeDashboardView } from "./home-access";

type VisibleNavigationItem = AppNavigationItem & {
  visible: boolean;
};

export function getVisibleDashboardNavigationItems(
  accessHints: HomeDashboardView["accessHints"],
): AppNavigationItem[] {
  const items = [
    {
      label: "月報",
      href: "/",
      icon: APP_NAVIGATION_ICONS.circleDollarSign,
      visible: accessHints.navigation.canOpenReports,
    },
    {
      label: "紀錄",
      href: "/records",
      icon: APP_NAVIGATION_ICONS.receiptText,
      visible: accessHints.navigation.canOpenRecords,
    },
    {
      label: "新增",
      href: "/?create=income",
      icon: APP_NAVIGATION_ICONS.plus,
      visible: accessHints.navigation.canOpenCreateRecord,
    },
    {
      label: "退款",
      href: "/reimbursements",
      icon: APP_NAVIGATION_ICONS.handCoins,
      visible: accessHints.navigation.canOpenReimbursements,
    },
    {
      label: "週期",
      href: "/recurring",
      icon: APP_NAVIGATION_ICONS.calendarClock,
      visible: accessHints.navigation.canOpenRecurring,
    },
    {
      label: "分類",
      href: "/categories",
      icon: APP_NAVIGATION_ICONS.tags,
      visible: accessHints.navigation.canOpenCategories,
    },
    {
      label: "成員",
      href: "/members",
      icon: APP_NAVIGATION_ICONS.users,
      visible: accessHints.navigation.canOpenMembers,
    },
  ] satisfies VisibleNavigationItem[];

  return items.filter((item) => item.visible);
}
