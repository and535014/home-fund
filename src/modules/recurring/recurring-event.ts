import type {
  CreateLedgerRecordCommand,
} from "../fund-ledger/ledger-records";
import {
  authorize,
  type AuthenticatedMember,
  type AuthorizationResult,
} from "../identity-access/authorization";

export type RecurringRecordType = "income" | "expense";
export type RecurringPostingMode = "immediate" | "reminder";

export type RecurringSchedule =
  | {
      anchor: "fixed_day";
      dayOfMonth: number;
    }
  | {
      anchor: "month_end";
    };

export type RecurringCategory = {
  id: string;
  status: "active" | "archived";
  type: RecurringRecordType;
};

export type RecurringEvent = {
  active: boolean;
  amountCents: number;
  categoryId: string;
  createdByMemberId: string;
  id: string;
  name: string;
  note?: string;
  postingMode: RecurringPostingMode;
  schedule: RecurringSchedule;
  type: RecurringRecordType;
} & (
  | {
      type: "income";
      sourceMemberId: string;
    }
  | {
      type: "expense";
      paymentSource: "fund" | "member";
      payerMemberId?: string;
    }
);

export type CreateRecurringIncomeEventCommand = {
  amountCents: number;
  categoryId: string;
  name: string;
  note?: string;
  postingMode: RecurringPostingMode;
  schedule: RecurringSchedule;
  sourceMemberId: string;
  type: "income";
};

export type CreateRecurringExpenseEventCommand = {
  amountCents: number;
  categoryId: string;
  name: string;
  note?: string;
  payerMemberId?: string;
  paymentSource: "fund" | "member";
  postingMode: RecurringPostingMode;
  schedule: RecurringSchedule;
  type: "expense";
};

export type CreateRecurringEventCommand =
  | CreateRecurringIncomeEventCommand
  | CreateRecurringExpenseEventCommand;

export type CreateRecurringEventContext = {
  categories: RecurringCategory[];
  generateId?: () => string;
};

export type CreateRecurringEventResult =
  | {
      ok: true;
      event: RecurringEvent;
      events: ["Recurring event created"];
    }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "missing_name"
        | "invalid_amount"
        | "missing_category"
        | "archived_category"
        | "category_type_mismatch"
        | "invalid_schedule_day"
        | "invalid_posting_mode"
        | "missing_source_member"
        | "invalid_payment_source"
        | "missing_payer_member"
        | "fund_paid_expense_cannot_have_member_payer";
      authorizationReason?: Exclude<AuthorizationResult, { allowed: true }>["reason"];
    };

export type ResolveRecurringTargetDateResult =
  | string
  | {
      ok: false;
      reason: "invalid_month" | "invalid_schedule_day";
    };

export function createRecurringEvent(
  actor: AuthenticatedMember,
  command: CreateRecurringEventCommand,
  context: CreateRecurringEventContext,
): CreateRecurringEventResult {
  const authorization = authorize(actor, { type: "manage_recurring_events" });

  if (!authorization.allowed) {
    return {
      ok: false,
      reason: "permission_denied",
      authorizationReason: authorization.reason,
    };
  }

  const validation = validateCreateRecurringEventCommand(command, context);

  if (!validation.ok) {
    return validation;
  }

  const event = toRecurringEvent(
    actor,
    command,
    context.generateId?.() ?? crypto.randomUUID(),
  );

  return {
    ok: true,
    event,
    events: ["Recurring event created"],
  };
}

export function recurringEventToLedgerCommand(
  event: RecurringEvent,
  month: string,
): CreateLedgerRecordCommand | ResolveRecurringTargetDateResult {
  const occurredOn = resolveRecurringTargetDate(event.schedule, month);

  if (typeof occurredOn !== "string") {
    return occurredOn;
  }

  if (event.type === "income") {
    return {
      amountCents: event.amountCents,
      categoryId: event.categoryId,
      name: event.name,
      occurredOn,
      sourceMemberId: event.sourceMemberId,
      type: "income",
      ...(event.note ? { note: event.note } : {}),
    };
  }

  return {
    amountCents: event.amountCents,
    categoryId: event.categoryId,
    name: event.name,
    occurredOn,
    paymentSource: event.paymentSource,
    type: "expense",
    ...(event.payerMemberId ? { payerMemberId: event.payerMemberId } : {}),
    ...(event.note ? { note: event.note } : {}),
  };
}

export function resolveRecurringTargetDate(
  schedule: RecurringSchedule,
  month: string,
): ResolveRecurringTargetDateResult {
  const parsedMonth = parseYearMonth(month);

  if (!parsedMonth) {
    return { ok: false, reason: "invalid_month" };
  }

  const { year, monthNumber } = parsedMonth;

  if (schedule.anchor === "fixed_day") {
    if (
      !Number.isInteger(schedule.dayOfMonth) ||
      schedule.dayOfMonth < 1 ||
      schedule.dayOfMonth > 28
    ) {
      return { ok: false, reason: "invalid_schedule_day" };
    }

    return formatDate(year, monthNumber, schedule.dayOfMonth);
  }

  return formatDate(year, monthNumber, daysInMonth(year, monthNumber));
}

function validateCreateRecurringEventCommand(
  command: CreateRecurringEventCommand,
  context: CreateRecurringEventContext,
): Extract<CreateRecurringEventResult, { ok: false }> | { ok: true } {
  if (!command.name.trim()) {
    return { ok: false, reason: "missing_name" };
  }

  if (!Number.isInteger(command.amountCents) || command.amountCents <= 0) {
    return { ok: false, reason: "invalid_amount" };
  }

  if (
    command.postingMode !== "immediate" &&
    command.postingMode !== "reminder"
  ) {
    return { ok: false, reason: "invalid_posting_mode" };
  }

  const targetDate = resolveRecurringTargetDate(command.schedule, "2026-01");

  if (typeof targetDate !== "string") {
    return { ok: false, reason: "invalid_schedule_day" };
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

  if (command.type === "income") {
    return command.sourceMemberId
      ? { ok: true }
      : { ok: false, reason: "missing_source_member" };
  }

  if (
    command.paymentSource !== "fund" &&
    command.paymentSource !== "member"
  ) {
    return { ok: false, reason: "invalid_payment_source" };
  }

  if (command.paymentSource === "member") {
    return command.payerMemberId
      ? { ok: true }
      : { ok: false, reason: "missing_payer_member" };
  }

  if (command.payerMemberId) {
    return { ok: false, reason: "fund_paid_expense_cannot_have_member_payer" };
  }

  return { ok: true };
}

function toRecurringEvent(
  actor: AuthenticatedMember,
  command: CreateRecurringEventCommand,
  id: string,
): RecurringEvent {
  const base = {
    active: true,
    amountCents: command.amountCents,
    categoryId: command.categoryId,
    createdByMemberId: actor.id,
    id,
    name: command.name,
    postingMode: command.postingMode,
    schedule: command.schedule,
    ...(command.note ? { note: command.note } : {}),
  };

  if (command.type === "income") {
    return {
      ...base,
      sourceMemberId: command.sourceMemberId,
      type: "income",
    };
  }

  return {
    ...base,
    paymentSource: command.paymentSource,
    ...(command.payerMemberId ? { payerMemberId: command.payerMemberId } : {}),
    type: "expense",
  };
}

function parseYearMonth(month: string): { monthNumber: number; year: number } | null {
  const match = /^(?<year>\d{4})-(?<month>\d{2})$/u.exec(month);

  if (!match?.groups) {
    return null;
  }

  const year = Number(match.groups.year);
  const monthNumber = Number(match.groups.month);

  if (monthNumber < 1 || monthNumber > 12) {
    return null;
  }

  return { monthNumber, year };
}

function daysInMonth(year: number, monthNumber: number): number {
  return new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
}

function formatDate(year: number, monthNumber: number, day: number): string {
  return [
    year.toString().padStart(4, "0"),
    monthNumber.toString().padStart(2, "0"),
    day.toString().padStart(2, "0"),
  ].join("-");
}
