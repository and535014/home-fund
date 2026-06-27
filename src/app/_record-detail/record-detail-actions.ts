import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";

export type RecordDetailActionAccess = {
  blockedReason?: string;
  canDelete: boolean;
  canEdit: boolean;
  canRefund: boolean;
};

export function recordActionAccess(
  actor: HouseholdAccessProfile,
  record: LedgerRecord,
): RecordDetailActionAccess {
  const isOwner = actor.id === record.createdByMemberId;
  const isAdmin = actor.roles.includes("admin");
  const isFinanceManager = actor.roles.includes("finance_manager");
  const isReimbursedExpense =
    record.type === "expense" && record.reimbursementStatus === "reimbursed";
  const canPerformReimbursement = isAdmin || isFinanceManager;
  const canRefund =
    canPerformReimbursement &&
    record.type === "expense" &&
    record.status === "active" &&
    record.paymentSource === "member" &&
    record.reimbursementStatus === "refundable";

  if (isReimbursedExpense) {
    return {
      blockedReason: "這筆代墊支出已退款，無法編輯或刪除。",
      canDelete: false,
      canEdit: false,
      canRefund: false,
    };
  }

  return {
    canDelete: isAdmin || isOwner,
    canEdit: isAdmin || isFinanceManager || isOwner,
    canRefund,
  };
}

export function canEditReimbursementPayments(
  actor: HouseholdAccessProfile,
): boolean {
  return actor.roles.includes("admin") || actor.roles.includes("finance_manager");
}
