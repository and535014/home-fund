import {
  authorize,
  type AuthenticatedMember,
  type AuthorizationResult,
} from "../identity-access/authorization";
import type { ExpenseLedgerRecord, LedgerRecord } from "../fund-ledger/ledger-records";

export type BatchMarkLedgerRecordsReimbursedCommand = {
  selectedRecordIds: string[];
  requireSinglePayerMember?: boolean;
};

export type BatchReimbursementSkippedReason =
  | "record_not_found"
  | "record_voided"
  | "not_expense"
  | "fund_paid_expense"
  | "not_refundable"
  | "already_reimbursed";

export type BatchReimbursementSkippedRecord = {
  recordId: string;
  reason: BatchReimbursementSkippedReason;
};

export type BatchMarkLedgerRecordsReimbursedResult =
  | {
      ok: true;
      reimbursedRecords: ExpenseLedgerRecord[];
      skippedRecords: BatchReimbursementSkippedRecord[];
      refundTotalCents: number;
      events: ["Reimbursement expenses selected", "Expenses reimbursed"];
    }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "empty_selection"
        | "no_eligible_records"
        | "cross_member_batch";
      skippedRecords?: BatchReimbursementSkippedRecord[];
      authorizationReason?: Exclude<AuthorizationResult, { allowed: true }>["reason"];
    };

export function batchMarkLedgerRecordsReimbursed(
  actor: AuthenticatedMember,
  records: LedgerRecord[],
  command: BatchMarkLedgerRecordsReimbursedCommand,
): BatchMarkLedgerRecordsReimbursedResult {
  const authorization = authorize(actor, { type: "perform_reimbursement" });

  if (!authorization.allowed) {
    return {
      ok: false,
      reason: "permission_denied",
      authorizationReason: authorization.reason,
    };
  }

  const selectedRecordIds = [...new Set(command.selectedRecordIds)];

  if (selectedRecordIds.length === 0) {
    return { ok: false, reason: "empty_selection" };
  }

  const recordById = new Map(records.map((record) => [record.id, record]));
  const reimbursedRecords: ExpenseLedgerRecord[] = [];
  const skippedRecords: BatchReimbursementSkippedRecord[] = [];

  for (const recordId of selectedRecordIds) {
    const record = recordById.get(recordId);

    if (!record) {
      skippedRecords.push({ recordId, reason: "record_not_found" });
      continue;
    }

    const skipReason = getBatchReimbursementSkipReason(record);

    if (skipReason) {
      skippedRecords.push({ recordId, reason: skipReason });
      continue;
    }

    const expense = record as ExpenseLedgerRecord;

    reimbursedRecords.push({
      ...expense,
      reimbursementStatus: "reimbursed",
    });
  }

  if (reimbursedRecords.length === 0) {
    return {
      ok: false,
      reason: "no_eligible_records",
      skippedRecords,
    };
  }

  if (command.requireSinglePayerMember) {
    const payerMemberIds = new Set(
      reimbursedRecords.map((record) => record.payerMemberId),
    );

    if (payerMemberIds.size !== 1) {
      return { ok: false, reason: "cross_member_batch" };
    }
  }

  return {
    ok: true,
    reimbursedRecords,
    skippedRecords,
    refundTotalCents: reimbursedRecords.reduce(
      (total, record) => total + record.amountCents,
      0,
    ),
    events: ["Reimbursement expenses selected", "Expenses reimbursed"],
  };
}

function getBatchReimbursementSkipReason(
  record: LedgerRecord,
): BatchReimbursementSkippedReason | null {
  if (record.status === "voided") {
    return "record_voided";
  }

  if (record.type !== "expense") {
    return "not_expense";
  }

  if (record.reimbursementStatus === "reimbursed") {
    return "already_reimbursed";
  }

  if (record.paymentSource === "fund") {
    return "fund_paid_expense";
  }

  if (record.reimbursementStatus !== "refundable") {
    return "not_refundable";
  }

  return null;
}
