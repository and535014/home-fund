import type { LedgerRecord } from "../fund-ledger/ledger-records";
import { createLedgerRecord } from "../fund-ledger/ledger-records";
import {
  loadCategoryLookups,
  type CategoryLookupQueryPrismaClient,
} from "../categorization/category-query";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  createRecurringEvent,
  recurringEventToLedgerCommand,
  resolveRecurringTargetDate,
  type CreateRecurringEventCommand,
  type CreateRecurringEventResult,
  type RecurringEvent,
  type RecurringPostingMode,
  type RecurringRecordType,
} from "./recurring-event";

type PaymentSource = "fund" | "member";
type ScheduleAnchor = "fixed_day" | "month_end";
type OccurrenceStatus = "pending" | "posted" | "skipped";

export type RecurringRuleRow = {
  active: boolean;
  amountCents: number;
  categoryId: string;
  createdByMemberId: string;
  dayOfMonth: number | null;
  deletedAt: Date | null;
  householdId: string;
  id: string;
  name: string;
  note: string | null;
  payerMemberId: string | null;
  paymentSource: PaymentSource | null;
  postingMode: RecurringPostingMode;
  scheduleAnchor: ScheduleAnchor;
  sourceMemberId: string | null;
  type: RecurringRecordType;
};

export type RecurringEventCommandPrismaClient = CategoryLookupQueryPrismaClient & {
  recurringRule: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
  };
};

export type RecurringEventMutationPrismaClient = {
  $transaction<T>(
    callback: (tx: RecurringEventMutationTransaction) => Promise<T>,
  ): Promise<T>;
};

type RecurringEventMutationTransaction = CategoryLookupQueryPrismaClient & {
  ledgerRecord: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
  };
  recurringOccurrence: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
    findFirst(args: {
      where: Record<string, unknown>;
      include?: Record<string, unknown>;
    }): Promise<RecurringOccurrenceWithRuleRow | null>;
    findUnique(args: {
      where: Record<string, unknown>;
    }): Promise<RecurringOccurrenceRow | null>;
    update(args: {
      where: { id: string };
      data: Record<string, unknown>;
    }): Promise<unknown>;
    updateMany(args: {
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }): Promise<{ count: number }>;
  };
  recurringRule: {
    findFirst(args: {
      where: Record<string, unknown>;
    }): Promise<RecurringRuleRow | null>;
    findMany(args: {
      where: Record<string, unknown>;
      orderBy: Record<string, string>;
    }): Promise<RecurringRuleRow[]>;
    update(args: {
      where: { id: string };
      data: Record<string, unknown>;
    }): Promise<unknown>;
  };
};

type RecurringOccurrenceRow = {
  id: string;
  ledgerRecordId: string | null;
  month: string;
  status: OccurrenceStatus;
};

type RecurringOccurrenceWithRuleRow = RecurringOccurrenceRow & {
  recurringRule: RecurringRuleRow;
};

export type CreateRecurringEventInDatabaseContext = {
  generateId?: () => string;
  householdId: string;
  prisma: RecurringEventCommandPrismaClient;
};

export type DeleteRecurringEventResult =
  | {
      ok: true;
      recurringEventId: string;
      skippedPendingOccurrenceCount: number;
    }
  | {
      ok: false;
      reason: "event_not_found" | "permission_denied";
    };

export type EnsureRecurringOccurrencesResult = {
  alreadyPostedCount: number;
  pendingCount: number;
  postedCount: number;
  skippedCount: number;
};

export type ConfirmRecurringOccurrenceResult =
  | {
      ok: true;
      occurrenceId: string;
      recordId: string;
    }
  | {
      ok: false;
      reason:
        | "already_posted"
        | "occurrence_not_found"
        | "permission_denied"
        | "invalid_schedule_day"
        | "invalid_month"
        | "missing_category"
        | "archived_category"
        | "category_type_mismatch"
        | "invalid_amount";
      recordId?: string;
    };

export async function createRecurringEventInDatabase(
  actor: AuthenticatedMember,
  command: CreateRecurringEventCommand,
  context: CreateRecurringEventInDatabaseContext,
): Promise<CreateRecurringEventResult> {
  const categories = await loadCategoryLookups({
    householdId: context.householdId,
    prisma: context.prisma,
  });
  const result = createRecurringEvent(actor, command, {
    categories,
    generateId: context.generateId,
  });

  if (!result.ok) {
    return result;
  }

  await context.prisma.recurringRule.create({
    data: toRecurringRuleCreateData(result.event, context.householdId),
  });

  return result;
}

export async function deleteRecurringEventInDatabase(
  actor: AuthenticatedMember,
  command: { recurringEventId: string },
  context: {
    householdId: string;
    now?: () => Date;
    prisma: RecurringEventMutationPrismaClient;
  },
): Promise<DeleteRecurringEventResult> {
  if (!actor.roles.includes("admin") && !actor.roles.includes("finance_manager")) {
    return { ok: false, reason: "permission_denied" };
  }

  const now = context.now?.() ?? new Date();

  return context.prisma.$transaction(async (tx) => {
    const event = await tx.recurringRule.findFirst({
      where: {
        active: true,
        householdId: context.householdId,
        id: command.recurringEventId,
      },
    });

    if (!event) {
      return { ok: false, reason: "event_not_found" };
    }

    await tx.recurringRule.update({
      where: { id: command.recurringEventId },
      data: {
        active: false,
        deletedAt: now,
      },
    });
    const skipped = await tx.recurringOccurrence.updateMany({
      where: {
        householdId: context.householdId,
        recurringRuleId: command.recurringEventId,
        status: "pending",
      },
      data: { status: "skipped" },
    });

    return {
      ok: true,
      recurringEventId: command.recurringEventId,
      skippedPendingOccurrenceCount: skipped.count,
    };
  });
}

export async function ensureRecurringOccurrencesForMonth(
  actor: AuthenticatedMember,
  command: { month: string },
  context: {
    generateLedgerRecordId?: () => string;
    generateOccurrenceId?: () => string;
    householdId: string;
    now?: () => Date;
    prisma: RecurringEventMutationPrismaClient;
  },
): Promise<EnsureRecurringOccurrencesResult> {
  return context.prisma.$transaction(async (tx) => {
    const rules = await tx.recurringRule.findMany({
      where: {
        active: true,
        householdId: context.householdId,
      },
      orderBy: { createdAt: "asc" },
    });
    const categories = await loadCategoryLookups({
      householdId: context.householdId,
      prisma: tx,
    });
    const summary: EnsureRecurringOccurrencesResult = {
      alreadyPostedCount: 0,
      pendingCount: 0,
      postedCount: 0,
      skippedCount: 0,
    };

    for (const rule of rules) {
      const event = mapRecurringRuleRowToEvent(rule);
      const targetDate = resolveRecurringTargetDate(event.schedule, command.month);

      if (typeof targetDate !== "string") {
        summary.skippedCount += 1;
        continue;
      }

      const existing = await tx.recurringOccurrence.findUnique({
        where: {
          recurringRuleId_month: {
            recurringRuleId: event.id,
            month: command.month,
          },
        },
      });

      if (existing?.status === "posted") {
        summary.alreadyPostedCount += 1;
        continue;
      }

      const occurrenceId = existing?.id ?? context.generateOccurrenceId?.() ?? crypto.randomUUID();

      if (!existing) {
        await tx.recurringOccurrence.create({
          data: {
            householdId: context.householdId,
            id: occurrenceId,
            month: command.month,
            recurringRuleId: event.id,
            status: event.postingMode === "immediate" ? "pending" : "pending",
            targetDate: dateOnly(targetDate),
          },
        });
      }

      if (event.postingMode === "reminder") {
        summary.pendingCount += 1;
        continue;
      }

      const postResult = await postRecurringEventLedgerRecord(actor, event, {
        categories,
        generateLedgerRecordId: context.generateLedgerRecordId,
        householdId: context.householdId,
        month: command.month,
        now: context.now,
        occurrenceId,
        tx,
      });

      if (postResult.ok) {
        summary.postedCount += 1;
      } else {
        summary.skippedCount += 1;
      }
    }

    return summary;
  });
}

export async function confirmRecurringOccurrenceInDatabase(
  actor: AuthenticatedMember,
  command: { occurrenceId: string },
  context: {
    generateLedgerRecordId?: () => string;
    householdId: string;
    now?: () => Date;
    prisma: RecurringEventMutationPrismaClient;
  },
): Promise<ConfirmRecurringOccurrenceResult> {
  return context.prisma.$transaction(async (tx) => {
    const occurrence = await tx.recurringOccurrence.findFirst({
      where: {
        householdId: context.householdId,
        id: command.occurrenceId,
      },
      include: { recurringRule: true },
    });

    if (!occurrence) {
      return { ok: false, reason: "occurrence_not_found" };
    }

    if (occurrence.status === "posted" && occurrence.ledgerRecordId) {
      return {
        ok: false,
        reason: "already_posted",
        recordId: occurrence.ledgerRecordId,
      };
    }

    const categories = await loadCategoryLookups({
      householdId: context.householdId,
      prisma: tx,
    });
    const event = mapRecurringRuleRowToEvent(occurrence.recurringRule);
    const result = await postRecurringEventLedgerRecord(actor, event, {
      categories,
      generateLedgerRecordId: context.generateLedgerRecordId,
      householdId: context.householdId,
      month: occurrence.month,
      now: context.now,
      occurrenceId: occurrence.id,
      tx,
    });

    return result.ok
      ? {
          ok: true,
          occurrenceId: occurrence.id,
          recordId: result.recordId,
        }
      : result;
  });
}

function mapRecurringRuleRowToEvent(row: RecurringRuleRow): RecurringEvent {
  const base = {
    active: row.active,
    amountCents: row.amountCents,
    categoryId: row.categoryId,
    createdByMemberId: row.createdByMemberId,
    id: row.id,
    name: row.name,
    postingMode: row.postingMode,
    schedule: row.scheduleAnchor === "month_end"
      ? { anchor: "month_end" as const }
      : {
          anchor: "fixed_day" as const,
          dayOfMonth: row.dayOfMonth ?? 1,
        },
    ...(row.note ? { note: row.note } : {}),
  };

  if (row.type === "income") {
    return {
      ...base,
      sourceMemberId: row.sourceMemberId ?? "",
      type: "income",
    };
  }

  return {
    ...base,
    paymentSource: row.paymentSource ?? "fund",
    ...(row.payerMemberId ? { payerMemberId: row.payerMemberId } : {}),
    type: "expense",
  };
}

function toRecurringRuleCreateData(event: RecurringEvent, householdId: string) {
  return {
    active: event.active,
    amountCents: event.amountCents,
    categoryId: event.categoryId,
    createdByMemberId: event.createdByMemberId,
    dayOfMonth: event.schedule.anchor === "fixed_day"
      ? event.schedule.dayOfMonth
      : null,
    householdId,
    id: event.id,
    name: event.name,
    note: event.note ?? null,
    payerMemberId: event.type === "expense" ? event.payerMemberId ?? null : null,
    paymentSource: event.type === "expense" ? event.paymentSource : null,
    postingMode: event.postingMode,
    scheduleAnchor: event.schedule.anchor,
    sourceMemberId: event.type === "income" ? event.sourceMemberId : null,
    type: event.type,
  };
}

async function postRecurringEventLedgerRecord(
  actor: AuthenticatedMember,
  event: RecurringEvent,
  context: {
    categories: { id: string; status: "active" | "archived"; type: "income" | "expense" }[];
    generateLedgerRecordId?: () => string;
    householdId: string;
    month: string;
    now?: () => Date;
    occurrenceId: string;
    tx: Pick<RecurringEventMutationTransaction, "ledgerRecord" | "recurringOccurrence">;
  },
): Promise<
  | { ok: true; recordId: string }
  | Extract<ConfirmRecurringOccurrenceResult, { ok: false }>
> {
  const command = recurringEventToLedgerCommand(event, context.month);

  if ("ok" in command) {
    return command;
  }

  const result = createLedgerRecord(actor, command, {
    categories: context.categories,
    generateId: context.generateLedgerRecordId,
  });

  if (!result.ok) {
    return {
      ok: false,
      reason: result.reason as Extract<
        ConfirmRecurringOccurrenceResult,
        { ok: false }
      >["reason"],
    };
  }

  await context.tx.ledgerRecord.create({
    data: toLedgerRecordCreateData(result.record, context.householdId),
  });
  await context.tx.recurringOccurrence.update({
    where: { id: context.occurrenceId },
    data: {
      ledgerRecordId: result.record.id,
      postedAt: context.now?.() ?? new Date(),
      postedByMemberId: actor.id,
      status: "posted",
    },
  });

  return { ok: true, recordId: result.record.id };
}

function toLedgerRecordCreateData(record: LedgerRecord, householdId: string) {
  return {
    id: record.id,
    householdId,
    type: record.type,
    name: record.name,
    amountCents: record.amountCents,
    occurredOn: dateOnly(record.occurredOn),
    categoryId: record.categoryId,
    createdByMemberId: record.createdByMemberId,
    sourceMemberId: record.type === "income" ? record.sourceMemberId : null,
    paymentSource: record.type === "expense" ? record.paymentSource : null,
    payerMemberId: record.type === "expense" ? record.payerMemberId ?? null : null,
    reimbursementStatus: record.reimbursementStatus,
    status: record.status,
    note: record.note ?? null,
  };
}

function dateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
