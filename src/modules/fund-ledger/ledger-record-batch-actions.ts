import {
  authorize,
  type AuthenticatedMember,
  type AuthorizationResult,
} from "../identity-access/authorization";
import type { LedgerRecord } from "./ledger-records";

export type BatchDeleteLedgerRecordsCommand = {
  selectedRecordIds: string[];
};

export type BatchDeleteSkippedReason =
  | "permission_denied"
  | "record_not_found"
  | "record_voided"
  | "reimbursed_expense_blocked";

export type BatchDeleteSkippedRecord = {
  recordId: string;
  reason: BatchDeleteSkippedReason;
  authorizationReason?: Exclude<AuthorizationResult, { allowed: true }>["reason"];
};

export type BatchDeleteLedgerRecordsResult =
  | {
      ok: true;
      processedRecords: LedgerRecord[];
      skippedRecords: BatchDeleteSkippedRecord[];
      events: ["Ledger records batch voided"];
    }
  | {
      ok: false;
      reason: "empty_selection";
    };

export function batchDeleteLedgerRecords(
  actor: AuthenticatedMember,
  records: LedgerRecord[],
  command: BatchDeleteLedgerRecordsCommand,
): BatchDeleteLedgerRecordsResult {
  const selectedRecordIds = [...new Set(command.selectedRecordIds)];

  if (selectedRecordIds.length === 0) {
    return { ok: false, reason: "empty_selection" };
  }

  const recordById = new Map(records.map((record) => [record.id, record]));
  const processedRecords: LedgerRecord[] = [];
  const skippedRecords: BatchDeleteSkippedRecord[] = [];

  for (const recordId of selectedRecordIds) {
    const record = recordById.get(recordId);

    if (!record) {
      skippedRecords.push({ recordId, reason: "record_not_found" });
      continue;
    }

    const skipReason = getBatchDeleteSkipReason(actor, record);

    if (skipReason) {
      skippedRecords.push({ recordId, ...skipReason });
      continue;
    }

    processedRecords.push({
      ...record,
      status: "voided",
    } as LedgerRecord);
  }

  return {
    ok: true,
    processedRecords,
    skippedRecords,
    events: ["Ledger records batch voided"],
  };
}

function getBatchDeleteSkipReason(
  actor: AuthenticatedMember,
  record: LedgerRecord,
): Omit<BatchDeleteSkippedRecord, "recordId"> | null {
  const authorization = authorize(actor, {
    type: "delete_ledger_record",
    recordOwnerId: record.createdByMemberId,
  });

  if (!authorization.allowed) {
    return {
      reason: "permission_denied",
      authorizationReason: authorization.reason,
    };
  }

  if (record.status === "voided") {
    return { reason: "record_voided" };
  }

  if (record.type === "expense" && record.reimbursementStatus === "reimbursed") {
    return { reason: "reimbursed_expense_blocked" };
  }

  return null;
}
