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
      expect(navigation.every((item) => !item.href.includes("create="))).toBe(true);
    }
  });
});
