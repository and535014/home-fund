import { authorize, type AuthenticatedMember } from "./authorization";

export type AccessNavigationHints = {
  canOpenReports: boolean;
  canOpenRecords: boolean;
  canOpenCreateRecord: boolean;
  canOpenReimbursements: boolean;
  canOpenCategories: boolean;
  canOpenMembers: boolean;
};

export type AccessActionHints = {
  canCreateOwnRecords: boolean;
  canCreateRecordsForOthers: boolean;
  canEditOwnRecords: boolean;
  canEditRecordsForOthers: boolean;
  canDeleteOwnRecords: boolean;
  canDeleteRecordsForOthers: boolean;
  canPerformReimbursement: boolean;
  canImportLedgerRecords: boolean;
  canManageMembers: boolean;
  canManageCategories: boolean;
};

export type AccessHints = {
  navigation: AccessNavigationHints;
  actions: AccessActionHints;
};

const otherMemberId = "__other_member__";

export function buildAccessHints(member: AuthenticatedMember): AccessHints {
  const canBrowse = allowed(member, { type: "browse_household_records" });
  const canManageMembers = allowed(member, { type: "manage_members" });
  const canManageCategories = allowed(member, { type: "manage_categories" });
  const canPerformReimbursement = allowed(member, { type: "perform_reimbursement" });
  const canImportLedgerRecords = allowed(member, { type: "import_ledger_records" });
  const canCreateOwnRecords = allowed(member, {
    type: "create_expense_record",
    targetMemberId: member.id,
  });
  const canCreateRecordsForOthers = allowed(member, {
    type: "create_expense_record",
    targetMemberId: otherMemberId,
  });
  const canEditOwnRecords = allowed(member, {
    type: "edit_ledger_record",
    recordOwnerId: member.id,
  });
  const canEditRecordsForOthers = allowed(member, {
    type: "edit_ledger_record",
    recordOwnerId: otherMemberId,
  });
  const canDeleteOwnRecords = allowed(member, {
    type: "delete_ledger_record",
    recordOwnerId: member.id,
  });
  const canDeleteRecordsForOthers = allowed(member, {
    type: "delete_ledger_record",
    recordOwnerId: otherMemberId,
  });

  return {
    navigation: {
      canOpenReports: canBrowse,
      canOpenRecords: canBrowse,
      canOpenCreateRecord: canCreateOwnRecords,
      canOpenReimbursements: canPerformReimbursement,
      canOpenCategories: canManageCategories,
      canOpenMembers: canManageMembers,
    },
    actions: {
      canCreateOwnRecords,
      canCreateRecordsForOthers,
      canEditOwnRecords,
      canEditRecordsForOthers,
      canDeleteOwnRecords,
      canDeleteRecordsForOthers,
      canPerformReimbursement,
      canImportLedgerRecords,
      canManageMembers,
      canManageCategories,
    },
  };
}

function allowed(
  member: AuthenticatedMember,
  command: Parameters<typeof authorize>[1],
): boolean {
  return authorize(member, command).allowed;
}
