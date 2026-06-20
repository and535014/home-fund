import {
  authorize,
  type AuthenticatedMember,
  type AuthorizationResult,
} from "../identity-access/authorization";
import type {
  ExpenseLedgerRecord,
  IncomeLedgerRecord,
  LedgerCategory,
  LedgerRecord,
} from "./ledger-records";

export type UpdateLedgerRecordCommand = {
  name?: string;
  amountCents?: number;
  occurredOn?: string;
  categoryId?: string;
  note?: string;
  sourceMemberId?: string;
  paymentSource?: "fund" | "member";
  payerMemberId?: string;
};

export type UpdateLedgerRecordContext = {
  categories: LedgerCategory[];
};

export type UpdateLedgerRecordResult =
  | {
      ok: true;
      record: LedgerRecord;
      events: ["Ledger record corrected"];
    }
  | LedgerRecordCorrectionFailure;

export type DeleteLedgerRecordResult =
  | {
      ok: true;
      record: LedgerRecord;
      events: ["Ledger record voided"];
    }
  | LedgerRecordCorrectionFailure;

export type LedgerRecordCorrectionFailure = {
  ok: false;
  reason:
    | "permission_denied"
    | "invalid_amount"
    | "invalid_date"
    | "missing_category"
    | "archived_category"
    | "category_type_mismatch"
    | "missing_income_source_member"
    | "missing_member_payer"
    | "fund_paid_expense_cannot_have_member_payer"
    | "record_voided"
    | "reimbursed_expense_blocked";
  authorizationReason?: Exclude<AuthorizationResult, { allowed: true }>["reason"];
};

export function updateLedgerRecord(
  actor: AuthenticatedMember,
  record: LedgerRecord,
  command: UpdateLedgerRecordCommand,
  context: UpdateLedgerRecordContext,
): UpdateLedgerRecordResult {
  const authorization = authorize(actor, {
    type: "edit_ledger_record",
    recordOwnerId: record.createdByMemberId,
  });

  if (!authorization.allowed) {
    return {
      ok: false,
      reason: "permission_denied",
      authorizationReason: authorization.reason,
    };
  }

  const mutable = validateMutableRecord(record);

  if (mutable.ok === false) {
    return mutable;
  }

  const nextRecord = mergeRecord(record, command);
  const validation = validateUpdatedRecord(nextRecord, context.categories);

  if (validation.ok === false) {
    return validation;
  }

  return {
    ok: true,
    record: nextRecord,
    events: ["Ledger record corrected"],
  };
}

export function deleteLedgerRecord(
  actor: AuthenticatedMember,
  record: LedgerRecord,
): DeleteLedgerRecordResult {
  const authorization = authorize(actor, {
    type: "delete_ledger_record",
    recordOwnerId: record.createdByMemberId,
  });

  if (!authorization.allowed) {
    return {
      ok: false,
      reason: "permission_denied",
      authorizationReason: authorization.reason,
    };
  }

  const mutable = validateMutableRecord(record);

  if (mutable.ok === false) {
    return mutable;
  }

  return {
    ok: true,
    record: {
      ...record,
      status: "voided",
    },
    events: ["Ledger record voided"],
  };
}

function validateMutableRecord(
  record: LedgerRecord,
): { ok: true } | LedgerRecordCorrectionFailure {
  if (record.status === "voided") {
    return { ok: false, reason: "record_voided" };
  }

  if (record.type === "expense" && record.reimbursementStatus === "reimbursed") {
    return { ok: false, reason: "reimbursed_expense_blocked" };
  }

  return { ok: true };
}

function mergeRecord(
  record: LedgerRecord,
  command: UpdateLedgerRecordCommand,
): LedgerRecord {
  const base = {
    ...record,
    name: command.name ?? record.name,
    amountCents: command.amountCents ?? record.amountCents,
    occurredOn: command.occurredOn ?? record.occurredOn,
    categoryId: command.categoryId ?? record.categoryId,
    note: command.note ?? record.note,
  };

  if (record.type === "income") {
    return {
      ...base,
      sourceMemberId: command.sourceMemberId ?? record.sourceMemberId,
    } as IncomeLedgerRecord;
  }

  const paymentSource = command.paymentSource ?? record.paymentSource;
  const payerMemberId =
    command.paymentSource === "fund"
      ? command.payerMemberId
      : command.payerMemberId ?? record.payerMemberId;

  return {
    ...base,
    paymentSource,
    payerMemberId,
    reimbursementStatus:
      paymentSource === "member" ? "refundable" : "not_refundable",
  } as ExpenseLedgerRecord;
}

function validateUpdatedRecord(
  record: LedgerRecord,
  categories: LedgerCategory[],
): { ok: true } | LedgerRecordCorrectionFailure {
  if (!Number.isInteger(record.amountCents) || record.amountCents <= 0) {
    return { ok: false, reason: "invalid_amount" };
  }

  if (!isIsoDate(record.occurredOn)) {
    return { ok: false, reason: "invalid_date" };
  }

  const category = categories.find((candidate) => candidate.id === record.categoryId);

  if (!category) {
    return { ok: false, reason: "missing_category" };
  }

  if (category.status === "archived") {
    return { ok: false, reason: "archived_category" };
  }

  if (category.type !== record.type) {
    return { ok: false, reason: "category_type_mismatch" };
  }

  if (record.type === "income" && !record.sourceMemberId) {
    return { ok: false, reason: "missing_income_source_member" };
  }

  if (record.type === "expense") {
    if (record.paymentSource === "member" && !record.payerMemberId) {
      return { ok: false, reason: "missing_member_payer" };
    }

    if (record.paymentSource === "fund" && record.payerMemberId) {
      return {
        ok: false,
        reason: "fund_paid_expense_cannot_have_member_payer",
      };
    }
  }

  return { ok: true };
}

function isIsoDate(value: string): boolean {
  const dateOnly = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/u;
  const match = dateOnly.exec(value);

  if (!match?.groups) {
    return false;
  }

  const year = Number(match.groups.year);
  const month = Number(match.groups.month);
  const day = Number(match.groups.day);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
