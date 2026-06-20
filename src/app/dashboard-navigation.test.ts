import { describe, expect, it } from "vitest";
import { buildAccessHints } from "@/modules/identity-access/access-hints";
import type { AuthenticatedMember } from "@/modules/identity-access/authorization";
import { getVisibleDashboardNavigationItems } from "./dashboard-navigation";

const members: AuthenticatedMember[] = [
  {
    id: "member-general",
    googleAccountLinked: true,
    roles: ["general_member"],
  },
  {
    id: "member-finance",
    googleAccountLinked: true,
    roles: ["finance_manager"],
  },
  {
    id: "member-admin",
    googleAccountLinked: true,
    roles: ["admin"],
  },
  {
    id: "member-unlinked",
    googleAccountLinked: false,
    roles: ["general_member"],
  },
];

describe("getVisibleDashboardNavigationItems", () => {
  it("does not expose standalone create-record navigation for any role", () => {
    for (const member of members) {
      const navigation = getVisibleDashboardNavigationItems(buildAccessHints(member));

      expect(navigation).not.toContainEqual(
        expect.objectContaining({
          label: "新增",
        }),
      );
      expect(navigation).not.toContainEqual(
        expect.objectContaining({
          label: "紀錄",
        }),
      );
      expect(navigation.every((item) => !item.href.includes("create="))).toBe(true);
      expect(navigation.every((item) => item.href !== "/records")).toBe(true);
    }
  });

  it("names the home navigation item as overview", () => {
    const navigation = getVisibleDashboardNavigationItems(
      buildAccessHints(members[0]),
    );

    expect(navigation).toContainEqual(
      expect.objectContaining({
        href: "/",
        icon: "home",
        label: "總覽",
      }),
    );
    expect(navigation).not.toContainEqual(
      expect.objectContaining({
        href: "/",
        label: "月報",
      }),
    );
  });

  it("uses the desktop product structure navigation", () => {
    const navigation = getVisibleDashboardNavigationItems(
      buildAccessHints(members[2]),
    );

    expect(navigation.map((item) => item.label)).toEqual([
      "總覽",
      "搜尋",
      "退款",
      "設定",
    ]);
    expect(navigation).toContainEqual(
      expect.objectContaining({
        href: "/settings",
        label: "設定",
      }),
    );
    expect(navigation).not.toContainEqual(
      expect.objectContaining({
        label: "週期",
      }),
    );
    expect(navigation).not.toContainEqual(
      expect.objectContaining({
        label: "分類",
      }),
    );
    expect(navigation).not.toContainEqual(
      expect.objectContaining({
        label: "成員",
      }),
    );
  });

  it("keeps reimbursements visible only for finance managers and admins", () => {
    const generalNavigation = getVisibleDashboardNavigationItems(
      buildAccessHints(members[0]),
    );
    const financeNavigation = getVisibleDashboardNavigationItems(
      buildAccessHints(members[1]),
    );

    expect(generalNavigation).not.toContainEqual(
      expect.objectContaining({
        href: "/reimbursements",
        label: "退款",
      }),
    );
    expect(financeNavigation).toContainEqual(
      expect.objectContaining({
        href: "/reimbursements",
        label: "退款",
      }),
    );
  });
});
