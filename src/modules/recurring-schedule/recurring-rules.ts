import {
  authorize,
  type AuthenticatedMember,
  type AuthorizationResult,
} from "../identity-access/authorization";
import {
  createLedgerRecord,
  type CreateLedgerRecordCommand,
  type LedgerCategory,
  type LedgerRecord,
  type LedgerRecordType,
} from "../fund-ledger/ledger-records";

export type RecurringPostingMode = "immediate" | "reminder";
export type RecurringOccurrenceStatus = "pending" | "posted";

export type RecurringRule = {
  id: string;
  type: LedgerRecordType;
  amountCents: number;
  categoryId: string;
  sourceMemberId?: string;
  paymentSource?: "fund" | "member";
  payerMemberId?: string;
  postingMode: RecurringPostingMode;
  dayOfMonth: number;
  note?: string;
  active: boolean;
};

export type RecurringOccurrence = {
  id: string;
  recurringRuleId: string;
  month: string;
  status: RecurringOccurrenceStatus;
  ledgerRecordId?: string;
};

export type CreateRecurringRuleCommand = Omit<RecurringRule, "id" | "active">;

export type CreateRecurringRuleContext = {
  categories: LedgerCategory[];
  generateId?: () => string;
};

export type ProcessRecurringOccurrenceContext = {
  month: string;
  categories: LedgerCategory[];
  existingOccurrences: RecurringOccurrence[];
  generateOccurrenceId?: () => string;
  generateLedgerRecordId?: () => string;
};

export type ConfirmRecurringOccurrenceContext = {
  categories: LedgerCategory[];
  generateLedgerRecordId?: () => string;
};

export type RecurringRuleResult =
  | {
      ok: true;
      rule: RecurringRule;
      events: ["Recurring rule created"];
    }
  | RecurringFailure;

export type RecurringOccurrenceResult =
  | {
      ok: true;
      occurrence: RecurringOccurrence;
      ledgerRecord?: LedgerRecord;
      events: (
        | "Immediate recurring item posted"
        | "Recurring reminder created"
        | "Recurring reminder confirmed"
      )[];
    }
  | RecurringFailure;

export type RecurringFailure = {
  ok: false;
  reason:
    | "permission_denied"
    | "invalid_amount"
    | "invalid_day_of_month"
    | "invalid_month"
    | "inactive_rule"
    | "missing_category"
    | "archived_category"
    | "category_type_mismatch"
    | "missing_income_source_member"
    | "missing_payment_source"
    | "missing_member_payer"
    | "duplicate_occurrence"
    | "occurrence_rule_mismatch"
    | "occurrence_already_posted"
    | "ledger_record_creation_failed";
  authorizationReason?: Exclude<AuthorizationResult, { allowed: true }>["reason"];
};

export function createRecurringRule(
  actor: AuthenticatedMember,
  command: CreateRecurringRuleCommand,
  context: CreateRecurringRuleContext,
): RecurringRuleResult {
  const permission = authorize(actor, { type: "manage_recurring" });

  if (!permission.allowed) {
    return {
      ok: false,
      reason: "permission_denied",
      authorizationReason: permission.reason,
    };
  }

  const validation = validateRuleShape(command, context.categories);

  if (validation.ok === false) {
    return validation;
  }

  return {
    ok: true,
    rule: {
      id: context.generateId?.() ?? crypto.randomUUID(),
      ...command,
      active: true,
    },
    events: ["Recurring rule created"],
  };
}

export function processRecurringOccurrence(
  actor: AuthenticatedMember,
  rule: RecurringRule,
  context: ProcessRecurringOccurrenceContext,
): RecurringOccurrenceResult {
  const validation = validateOccurrenceInput(rule, context);

  if (validation.ok === false) {
    return validation;
  }

  const occurrence: RecurringOccurrence = {
    id: context.generateOccurrenceId?.() ?? crypto.randomUUID(),
    recurringRuleId: rule.id,
    month: context.month,
    status: rule.postingMode === "immediate" ? "posted" : "pending",
  };

  if (rule.postingMode === "reminder") {
    return {
      ok: true,
      occurrence,
      events: ["Recurring reminder created"],
    };
  }

  const ledgerResult = createLedgerRecord(actor, commandFromRule(rule, context.month), {
    categories: context.categories,
    generateId: context.generateLedgerRecordId,
  });

  if (!ledgerResult.ok) {
    return { ok: false, reason: "ledger_record_creation_failed" };
  }

  return {
    ok: true,
    occurrence: {
      ...occurrence,
      ledgerRecordId: ledgerResult.record.id,
    },
    ledgerRecord: ledgerResult.record,
    events: ["Immediate recurring item posted"],
  };
}

export function confirmRecurringOccurrence(
  actor: AuthenticatedMember,
  occurrence: RecurringOccurrence,
  rule: RecurringRule,
  context: ConfirmRecurringOccurrenceContext,
): RecurringOccurrenceResult {
  if (occurrence.recurringRuleId !== rule.id) {
    return { ok: false, reason: "occurrence_rule_mismatch" };
  }

  if (occurrence.status === "posted") {
    return { ok: false, reason: "occurrence_already_posted" };
  }

  const validation = validateRuleShape(rule, context.categories);

  if (validation.ok === false) {
    return validation;
  }

  const ledgerResult = createLedgerRecord(actor, commandFromRule(rule, occurrence.month), {
    categories: context.categories,
    generateId: context.generateLedgerRecordId,
  });

  if (!ledgerResult.ok) {
    if (ledgerResult.reason === "permission_denied") {
      return {
        ok: false,
        reason: "permission_denied",
        authorizationReason: ledgerResult.authorizationReason,
      };
    }

    return { ok: false, reason: "ledger_record_creation_failed" };
  }

  return {
    ok: true,
    occurrence: {
      ...occurrence,
      status: "posted",
      ledgerRecordId: ledgerResult.record.id,
    },
    ledgerRecord: ledgerResult.record,
    events: ["Recurring reminder confirmed"],
  };
}

function validateOccurrenceInput(
  rule: RecurringRule,
  context: ProcessRecurringOccurrenceContext,
): { ok: true } | RecurringFailure {
  if (!rule.active) {
    return { ok: false, reason: "inactive_rule" };
  }

  if (!isMonth(context.month)) {
    return { ok: false, reason: "invalid_month" };
  }

  if (
    context.existingOccurrences.some(
      (occurrence) =>
        occurrence.recurringRuleId === rule.id && occurrence.month === context.month,
    )
  ) {
    return { ok: false, reason: "duplicate_occurrence" };
  }

  return validateRuleShape(rule, context.categories);
}

function validateRuleShape(
  rule: CreateRecurringRuleCommand | RecurringRule,
  categories: LedgerCategory[],
): { ok: true } | RecurringFailure {
  if (!Number.isInteger(rule.amountCents) || rule.amountCents <= 0) {
    return { ok: false, reason: "invalid_amount" };
  }

  if (!Number.isInteger(rule.dayOfMonth) || rule.dayOfMonth < 1 || rule.dayOfMonth > 31) {
    return { ok: false, reason: "invalid_day_of_month" };
  }

  const category = categories.find((candidate) => candidate.id === rule.categoryId);

  if (!category) {
    return { ok: false, reason: "missing_category" };
  }

  if (category.status === "archived") {
    return { ok: false, reason: "archived_category" };
  }

  if (category.type !== rule.type) {
    return { ok: false, reason: "category_type_mismatch" };
  }

  if (rule.type === "income" && !rule.sourceMemberId) {
    return { ok: false, reason: "missing_income_source_member" };
  }

  if (rule.type === "expense" && !rule.paymentSource) {
    return { ok: false, reason: "missing_payment_source" };
  }

  if (rule.type === "expense" && rule.paymentSource === "member" && !rule.payerMemberId) {
    return { ok: false, reason: "missing_member_payer" };
  }

  return { ok: true };
}

function commandFromRule(
  rule: RecurringRule,
  month: string,
): CreateLedgerRecordCommand {
  const occurredOn = `${month}-${String(rule.dayOfMonth).padStart(2, "0")}`;

  if (rule.type === "income") {
    return {
      type: "income",
      name: rule.note?.trim() || "週期收入",
      amountCents: rule.amountCents,
      occurredOn,
      categoryId: rule.categoryId,
      sourceMemberId: rule.sourceMemberId ?? "",
      note: rule.note,
    };
  }

  return {
    type: "expense",
    name: rule.note?.trim() || "週期支出",
    amountCents: rule.amountCents,
    occurredOn,
    categoryId: rule.categoryId,
    paymentSource: rule.paymentSource ?? "fund",
    payerMemberId: rule.payerMemberId,
    note: rule.note,
  };
}

function isMonth(value: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/u.test(value);
}
