import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";

export type BatchRefundDialogState = {
  eligibleRecords: LedgerRecord[];
  eligibleTotalCents: number;
  hasCrossMemberSelection: boolean;
  hasSinglePaidToMember: boolean;
  skippedCount: number;
};

export function getBatchRefundDialogState(
  actor: HouseholdAccessProfile,
  records: LedgerRecord[],
): BatchRefundDialogState {
  const eligibleRecords = records.filter((record) =>
    canBatchReimburseRecord(actor, record),
  );
  const paidToMemberIds = [
    ...new Set(
      eligibleRecords
        .map((record) => (record.type === "expense" ? record.payerMemberId : null))
        .filter((memberId): memberId is string => Boolean(memberId)),
    ),
  ];

  return {
    eligibleRecords,
    eligibleTotalCents: sumRecordAmounts(eligibleRecords),
    hasCrossMemberSelection: paidToMemberIds.length > 1,
    hasSinglePaidToMember: paidToMemberIds.length === 1,
    skippedCount: records.length - eligibleRecords.length,
  };
}

export function canBatchReimburseRecord(
  actor: HouseholdAccessProfile,
  record: LedgerRecord,
): boolean {
  const canPerformReimbursement =
    actor.roles.includes("admin") || actor.roles.includes("finance_manager");

  return (
    canPerformReimbursement &&
    record.type === "expense" &&
    record.status === "active" &&
    record.paymentSource === "member" &&
    record.reimbursementStatus === "refundable"
  );
}

export function readBatchRefundPaymentFormData(formData: FormData): {
  method: string;
  note: string;
  paidOn: string;
} {
  return {
    method: String(formData.get("reimbursementMethod") ?? ""),
    paidOn: String(formData.get("reimbursementPaidOn") ?? ""),
    note: String(formData.get("reimbursementReference") ?? ""),
  };
}

export function sumRecordAmounts(records: LedgerRecord[]): number {
  return records.reduce((total, record) => total + record.amountCents, 0);
}
