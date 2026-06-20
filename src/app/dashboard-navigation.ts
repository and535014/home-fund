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
      label: "總覽",
      href: "/",
      icon: APP_NAVIGATION_ICONS.circleDollarSign,
      visible: accessHints.navigation.canOpenReports,
    },
    {
      label: "搜尋",
      href: "/search",
      icon: APP_NAVIGATION_ICONS.search,
      visible: accessHints.navigation.canOpenReports,
    },
    {
      label: "退款",
      href: "/reimbursements",
      icon: APP_NAVIGATION_ICONS.handCoins,
      visible: accessHints.navigation.canOpenReimbursements,
    },
    {
      label: "設定",
      href: "/settings",
      icon: APP_NAVIGATION_ICONS.settings,
      visible:
        accessHints.navigation.canOpenReports ||
        accessHints.navigation.canOpenCategories ||
        accessHints.navigation.canOpenMembers,
    },
  ] satisfies VisibleNavigationItem[];

  return items.filter((item) => item.visible);
}
