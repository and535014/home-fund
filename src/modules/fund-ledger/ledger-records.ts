import {
  authorize,
  type AuthenticatedMember,
  type AuthorizationResult,
} from "../identity-access/authorization";

export type LedgerRecordType = "income" | "expense";
export type LedgerRecordStatus = "active" | "voided";

export type LedgerCategory = {
  id: string;
  type: LedgerRecordType;
  status: "active" | "archived";
};

export type ReimbursementStatus =
  | "not_applicable"
  | "not_refundable"
  | "refundable"
  | "reimbursed";

type RecurringLedgerTrace = {
  recurringEventLabel?: string;
};

export type CreateIncomeRecordCommand = {
  type: "income";
  name: string;
  amountCents: number;
  occurredOn: string;
  categoryId: string;
  sourceMemberId: string;
  note?: string;
};

export type CreateExpenseRecordCommand = {
  type: "expense";
  name: string;
  amountCents: number;
  occurredOn: string;
  categoryId: string;
  paymentSource: "fund" | "member";
  payerMemberId?: string;
  note?: string;
};

export type CreateLedgerRecordCommand =
  | CreateIncomeRecordCommand
  | CreateExpenseRecordCommand;

export type IncomeLedgerRecord = RecurringLedgerTrace & {
  id: string;
  type: "income";
  name: string;
  amountCents: number;
  occurredOn: string;
  categoryId: string;
  createdByMemberId: string;
  sourceMemberId: string;
  note?: string;
  reimbursementStatus: "not_applicable";
  status: LedgerRecordStatus;
};

export type ExpenseLedgerRecord = RecurringLedgerTrace & {
  id: string;
  type: "expense";
  name: string;
  amountCents: number;
  occurredOn: string;
  categoryId: string;
  createdByMemberId: string;
  paymentSource: "fund" | "member";
  payerMemberId?: string;
  note?: string;
  reimbursementStatus: "not_refundable" | "refundable" | "reimbursed";
  status: LedgerRecordStatus;
};

export type LedgerRecord = IncomeLedgerRecord | ExpenseLedgerRecord;

export function isActiveLedgerRecord(record: LedgerRecord): boolean {
  return record.status === "active";
}

export type CreateLedgerRecordContext = {
  categories: LedgerCategory[];
  generateId?: () => string;
};

export type CreateLedgerRecordResult =
  | {
      ok: true;
      record: LedgerRecord;
      events: (
        | "Income recorded"
        | "Expense recorded"
        | "Member-paid expense became refundable"
      )[];
    }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "missing_name"
        | "invalid_amount"
        | "invalid_date"
        | "missing_category"
        | "archived_category"
        | "category_type_mismatch"
        | "missing_member_payer"
        | "fund_paid_expense_cannot_have_member_payer";
      authorizationReason?: Exclude<AuthorizationResult, { allowed: true }>["reason"];
    };

export function createLedgerRecord(
  actor: AuthenticatedMember,
  command: CreateLedgerRecordCommand,
  context: CreateLedgerRecordContext,
): CreateLedgerRecordResult {
  const validationResult = validateLedgerRecordCommand(command, context);

  if (validationResult.ok === false) {
    return validationResult;
  }

  const authorizationResult = authorize(actor, authorizationCommand(command, actor));

  if (!authorizationResult.allowed) {
    return {
      ok: false,
      reason: "permission_denied",
      authorizationReason: authorizationResult.reason,
    };
  }

  const id = context.generateId?.() ?? crypto.randomUUID();

  if (command.type === "income") {
    return {
      ok: true,
      record: {
        id,
        type: "income",
        name: command.name,
        amountCents: command.amountCents,
        occurredOn: command.occurredOn,
        categoryId: command.categoryId,
        createdByMemberId: actor.id,
        sourceMemberId: command.sourceMemberId,
        note: command.note,
        reimbursementStatus: "not_applicable",
        status: "active",
      },
      events: ["Income recorded"],
    };
  }

  if (command.paymentSource === "fund") {
    return {
      ok: true,
      record: {
        id,
        type: "expense",
        name: command.name,
        amountCents: command.amountCents,
        occurredOn: command.occurredOn,
        categoryId: command.categoryId,
        createdByMemberId: actor.id,
        paymentSource: "fund",
        note: command.note,
        reimbursementStatus: "not_refundable",
        status: "active",
      },
      events: ["Expense recorded"],
    };
  }

  return {
    ok: true,
    record: {
      id,
      type: "expense",
      name: command.name,
      amountCents: command.amountCents,
      occurredOn: command.occurredOn,
      categoryId: command.categoryId,
      createdByMemberId: actor.id,
      paymentSource: "member",
      payerMemberId: command.payerMemberId,
      note: command.note,
      reimbursementStatus: "refundable",
      status: "active",
    },
    events: ["Expense recorded", "Member-paid expense became refundable"],
  };
}

function validateLedgerRecordCommand(
  command: CreateLedgerRecordCommand,
  context: CreateLedgerRecordContext,
): Extract<CreateLedgerRecordResult, { ok: false }> | { ok: true } {
  if (!command.name.trim()) {
    return { ok: false, reason: "missing_name" };
  }

  if (!Number.isInteger(command.amountCents) || command.amountCents <= 0) {
    return { ok: false, reason: "invalid_amount" };
  }

  if (!isIsoDate(command.occurredOn)) {
    return { ok: false, reason: "invalid_date" };
  }

  const category = context.categories.find(
    (candidate) => candidate.id === command.categoryId,
  );

  if (!category) {
    return { ok: false, reason: "missing_category" };
  }

  if (category.status === "archived") {
    return { ok: false, reason: "archived_category" };
  }

  if (category.type !== command.type) {
    return { ok: false, reason: "category_type_mismatch" };
  }

  if (command.type === "expense" && command.paymentSource === "member") {
    return command.payerMemberId
      ? { ok: true }
      : { ok: false, reason: "missing_member_payer" };
  }

  if (
    command.type === "expense" &&
    command.paymentSource === "fund" &&
    command.payerMemberId
  ) {
    return { ok: false, reason: "fund_paid_expense_cannot_have_member_payer" };
  }

  return { ok: true };
}

function authorizationCommand(
  command: CreateLedgerRecordCommand,
  actor: AuthenticatedMember,
) {
  if (command.type === "income") {
    return {
      type: "create_income_record" as const,
      targetMemberId: command.sourceMemberId,
    };
  }

  return {
    type: "create_expense_record" as const,
    targetMemberId: command.payerMemberId ?? actor.id,
  };
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
