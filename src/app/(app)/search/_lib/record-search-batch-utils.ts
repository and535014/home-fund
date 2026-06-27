import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";
export {
  canBatchReimburseRecord,
  sumRecordAmounts,
} from "@/app/_reimbursement/batch-refund-client";

export function canBatchDeleteRecord(
  actor: HouseholdAccessProfile,
  record: LedgerRecord,
): boolean {
  const isOwner = actor.id === record.createdByMemberId;
  const isAdmin = actor.roles.includes("admin");
  const isReimbursedExpense =
    record.type === "expense" && record.reimbursementStatus === "reimbursed";

  return (
    record.status === "active" && !isReimbursedExpense && (isAdmin || isOwner)
  );
}

export function sumRecordNetAmount(records: LedgerRecord[]): number {
  return records.reduce(
    (total, record) =>
      total +
      (record.type === "income" ? record.amountCents : -record.amountCents),
    0,
  );
}

export function netAmountTone(amountCents: number): string {
  if (amountCents > 0) {
    return "text-income";
  }

  if (amountCents < 0) {
    return "text-expense";
  }

  return "text-muted-foreground";
}
