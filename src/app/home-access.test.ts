import { describe, expect, it } from "vitest";
import {
  buildHomeAccessView,
  buildHomeAccessViewFromAccess,
} from "./home-access";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdMemberAccount } from "@/modules/identity-access/member-management";

const householdMembers: HouseholdMemberAccount[] = [
  {
    id: "member-fin",
    displayName: "Lin",
    googleAccountEmail: "lin@example.com",
    googleSubject: "google-lin",
    roles: ["finance_manager"],
    capabilities: ["manage_categories"],
    status: "active",
  },
  {
    id: "member-invited",
    displayName: "Invited",
    googleAccountEmail: "invited@example.com",
    googleSubject: "google-invited",
    roles: ["general_member"],
    capabilities: [],
    status: "invited",
  },
];

const categories: Category[] = [
  { id: "income-rent", type: "income", name: "房租", status: "active" },
  { id: "expense-grocery", type: "expense", name: "日用品", status: "active" },
];

const records: LedgerRecord[] = [
  {
    id: "income-rent-june",
    type: "income",
    amountCents: 120_000_00,
    occurredOn: "2026-06-05",
    categoryId: "income-rent",
    createdByMemberId: "member-fin",
    sourceMemberId: "member-fin",
    reimbursementStatus: "not_applicable",
  },
  {
    id: "expense-grocery-june",
    type: "expense",
    amountCents: 6_420_00,
    occurredOn: "2026-06-09",
    categoryId: "expense-grocery",
    createdByMemberId: "member-fin",
    paymentSource: "member",
    payerMemberId: "member-fin",
    reimbursementStatus: "refundable",
  },
];

const baseInput = {
  month: "2026-06",
  householdMembers,
  categories,
  records,
  pendingOccurrences: [],
};

describe("buildHomeAccessView", () => {
  it("shows the Google sign-in state before any household data is exposed", () => {
    expect(buildHomeAccessView({
      ...baseInput,
      googleIdentity: null,
    })).toMatchObject({
      kind: "unauthenticated",
      title: "請先使用 Google 登入",
      primaryActionLabel: "使用 Google 登入",
    });
  });

  it("blocks a Google account that is not linked to an active household member", () => {
    expect(buildHomeAccessView({
      ...baseInput,
      googleIdentity: {
        subject: "google-unknown",
        email: "unknown@example.com",
      },
    })).toMatchObject({
      kind: "google_account_not_linked",
      title: "找不到家庭成員帳號",
    });

    expect(buildHomeAccessView({
      ...baseInput,
      googleIdentity: {
        subject: "google-invited",
        email: "invited@example.com",
      },
    })).toMatchObject({
      kind: "member_not_active",
      title: "帳號尚未啟用",
    });
  });

  it("builds the dashboard view only for an active linked member", () => {
    const view = buildHomeAccessView({
      ...baseInput,
      googleIdentity: {
        subject: "google-lin",
        email: "lin@example.com",
      },
    });

    expect(view.kind).toBe("dashboard");

    if (view.kind !== "dashboard") {
      throw new Error("Expected dashboard view");
    }

    expect(view.profile.displayName).toBe("Lin");
    expect(view.accessHints.actions.canPerformReimbursement).toBe(true);
    expect(view.report.totals.confirmedIncomeCents).toBe(120_000_00);
    expect(view.reimbursementTable.groups).toHaveLength(1);
  });
});

describe("buildHomeAccessViewFromAccess", () => {
  it("builds a blocked view from a resolved current-member failure", () => {
    expect(buildHomeAccessViewFromAccess({
      ...baseInput,
      access: {
        ok: false,
        reason: "google_account_not_linked",
      },
    })).toMatchObject({
      kind: "google_account_not_linked",
      title: "找不到家庭成員帳號",
    });
  });

  it("builds dashboard data from an already resolved active member", () => {
    const view = buildHomeAccessViewFromAccess({
      ...baseInput,
      access: {
        ok: true,
        member: {
          id: "member-fin",
          googleAccountLinked: true,
          roles: ["finance_manager"],
          capabilities: ["manage_categories"],
        },
        profile: {
          id: "member-fin",
          displayName: "Lin",
          roles: ["finance_manager"],
          capabilities: ["manage_categories"],
        },
        events: ["Household member access resolved"],
      },
    });

    expect(view.kind).toBe("dashboard");

    if (view.kind !== "dashboard") {
      throw new Error("Expected dashboard view");
    }

    expect(view.profile.displayName).toBe("Lin");
    expect(view.report.totals.confirmedIncomeCents).toBe(120_000_00);
  });
});
