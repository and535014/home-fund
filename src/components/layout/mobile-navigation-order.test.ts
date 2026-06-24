import { describe, expect, it } from "vitest";
import { APP_NAVIGATION_ICONS } from "./app-navigation-icons";
import type { AppNavigationItem } from "./authenticated-layout";
import {
  mobileNavigationLabel,
  orderMobileNavigationItems,
} from "./mobile-navigation-order";

const navigationItems: AppNavigationItem[] = [
  {
    href: "/",
    icon: APP_NAVIGATION_ICONS.home,
    label: "總覽",
  },
  {
    href: "/search",
    icon: APP_NAVIGATION_ICONS.search,
    label: "搜尋",
  },
  {
    href: "/settings/account",
    icon: APP_NAVIGATION_ICONS.settings,
    label: "設定",
  },
];

describe("mobile navigation order", () => {
  it("orders settings, home, then search", () => {
    expect(orderMobileNavigationItems(navigationItems).map((item) => item.href)).toEqual([
      "/settings/account",
      "/",
      "/search",
    ]);
  });

  it("renames the home item for mobile display", () => {
    expect(mobileNavigationLabel(navigationItems[0])).toBe("首頁");
    expect(mobileNavigationLabel(navigationItems[1])).toBe("搜尋");
    expect(mobileNavigationLabel(navigationItems[2])).toBe("設定");
  });
});
