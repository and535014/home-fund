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

const categoryManager: AuthenticatedMember = {
  id: "member-ops",
  googleAccountLinked: true,
  roles: ["general_member"],
  capabilities: ["manage_categories"],
};

describe("buildAccessHints", () => {
  it("gives every linked member browsing and self-record creation hints", () => {
    expect(buildAccessHints(generalMember)).toEqual({
      navigation: {
        canOpenReports: true,
        canOpenRecords: true,
        canOpenCreateRecord: true,
        canOpenReimbursements: false,
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
        canImportLedgerRecords: false,
        canManageMembers: false,
        canManageCategories: false,
      },
    });
  });

  it("shows finance manager reimbursement and cross-member record actions without delete-other access", () => {
    expect(buildAccessHints(financeManager)).toMatchObject({
      navigation: {
        canOpenReimbursements: true,
      },
      actions: {
      canCreateRecordsForOthers: true,
      canEditRecordsForOthers: true,
      canDeleteRecordsForOthers: false,
      canPerformReimbursement: true,
      canImportLedgerRecords: true,
      },
    });
  });

  it("shows admin member and settings management actions", () => {
    expect(buildAccessHints(admin)).toMatchObject({
      navigation: {
        canOpenReimbursements: true,
        canOpenMembers: true,
        canOpenCategories: true,
      },
      actions: {
        canManageMembers: true,
        canManageCategories: true,
        canDeleteRecordsForOthers: true,
        canPerformReimbursement: true,
        canImportLedgerRecords: true,
      },
    });
  });

  it("keeps category management admin-only", () => {
    expect(buildAccessHints(categoryManager)).toMatchObject({
      navigation: {
        canOpenCategories: false,
        canOpenMembers: false,
      },
      actions: {
        canManageCategories: false,
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
        canImportLedgerRecords: false,
        canManageMembers: false,
        canManageCategories: false,
      },
    });
  });
});
