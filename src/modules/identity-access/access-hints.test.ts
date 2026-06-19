import { describe, expect, it } from "vitest";
import type { AuthenticatedMember } from "./authorization";
import { buildAccessHints } from "./access-hints";

const generalMember: AuthenticatedMember = {
  id: "member-mei",
  googleAccountLinked: true,
  roles: ["general_member"],
};

const financeManager: AuthenticatedMember = {
  id: "member-fin",
  googleAccountLinked: true,
  roles: ["finance_manager"],
};

const admin: AuthenticatedMember = {
  id: "member-admin",
  googleAccountLinked: true,
  roles: ["admin"],
};

const categoryAndRecurringManager: AuthenticatedMember = {
  id: "member-ops",
  googleAccountLinked: true,
  roles: ["general_member"],
  capabilities: ["manage_categories", "manage_recurring"],
};

describe("buildAccessHints", () => {
  it("gives every linked member browsing and self-record creation hints", () => {
    expect(buildAccessHints(generalMember)).toEqual({
      navigation: {
        canOpenReports: true,
        canOpenRecords: true,
        canOpenCreateRecord: true,
        canOpenReimbursements: true,
        canOpenRecurring: false,
        canOpenCategories: false,
        canOpenMembers: false,
      },
      actions: {
        canCreateOwnRecords: true,
        canCreateRecordsForOthers: false,
        canEditOwnRecords: true,
        canEditRecordsForOthers: false,
        canDeleteOwnRecords: true,
        canDeleteRecordsForOthers: false,
        canPerformReimbursement: false,
        canManageMembers: false,
        canManageCategories: false,
        canManageRecurring: false,
      },
    });
  });

  it("shows finance manager reimbursement and cross-member record actions without delete-other access", () => {
    expect(buildAccessHints(financeManager).actions).toMatchObject({
      canCreateRecordsForOthers: true,
      canEditRecordsForOthers: true,
      canDeleteRecordsForOthers: false,
      canPerformReimbursement: true,
    });
  });

  it("shows admin member and settings management actions", () => {
    expect(buildAccessHints(admin)).toMatchObject({
      navigation: {
        canOpenMembers: true,
        canOpenCategories: true,
        canOpenRecurring: true,
      },
      actions: {
        canManageMembers: true,
        canManageCategories: true,
        canManageRecurring: true,
        canDeleteRecordsForOthers: true,
        canPerformReimbursement: true,
      },
    });
  });

  it("keeps category management admin-only while preserving recurring capabilities", () => {
    expect(buildAccessHints(categoryAndRecurringManager)).toMatchObject({
      navigation: {
        canOpenCategories: false,
        canOpenRecurring: true,
        canOpenMembers: false,
      },
      actions: {
        canManageCategories: false,
        canManageRecurring: true,
        canManageMembers: false,
      },
    });
  });

  it("does not grant hints to an unlinked Google account", () => {
    expect(buildAccessHints({
      ...generalMember,
      googleAccountLinked: false,
    })).toEqual({
      navigation: {
        canOpenReports: false,
        canOpenRecords: false,
        canOpenCreateRecord: false,
        canOpenReimbursements: false,
        canOpenRecurring: false,
        canOpenCategories: false,
        canOpenMembers: false,
      },
      actions: {
        canCreateOwnRecords: false,
        canCreateRecordsForOthers: false,
        canEditOwnRecords: false,
        canEditRecordsForOthers: false,
        canDeleteOwnRecords: false,
        canDeleteRecordsForOthers: false,
        canPerformReimbursement: false,
        canManageMembers: false,
        canManageCategories: false,
        canManageRecurring: false,
      },
    });
  });
});
