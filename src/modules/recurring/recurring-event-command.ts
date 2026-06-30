import type {
  CreateLedgerRecordResult,
  LedgerRecord,
} from "../fund-ledger/ledger-records";
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

export type RecurringEventCommandPrismaClient = RecurringEventMutationPrismaClient;

export type RecurringEventMutationPrismaClient = {
  $transaction<T>(
    callback: (tx: RecurringEventMutationTransaction) => Promise<T>,
  ): Promise<T>;
};

export type RecurringEventPostingJobPrismaClient =
  RecurringEventMutationPrismaClient & {
    household: {
      findMany(args: {
        orderBy: { createdAt: "asc" };
        select: { id: true };
      }): Promise<{ id: string }[]>;
    };
    member: {
      findFirst(args: {
        orderBy: { createdAt: "asc" };
        select: {
          id: true;
          roles: {
            select: { role: true };
          };
        };
        where: {
          householdId: string;
          roles: {
            some: {
              role: { in: ["admin", "finance_manager"] };
            };
          };
          status: "active";
        };
      }): Promise<{
        id: string;
        roles: { role: "admin" | "finance_manager" | "general_member" }[];
      } | null>;
    };
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
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
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
  targetDate: Date;
};

type RecurringOccurrenceWithRuleRow = RecurringOccurrenceRow & {
  recurringRule: RecurringRuleRow;
};

export type CreateRecurringEventInDatabaseContext = {
  generateLedgerRecordId?: () => string;
  generateId?: () => string;
  generateOccurrenceId?: () => string;
  householdId: string;
  now?: () => Date;
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

export type RunRecurringPostingJobResult = EnsureRecurringOccurrencesResult & {
  householdCount: number;
  skippedHouseholdCount: number;
  targetMonth: string;
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
        | "occurrence_not_due"
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
  return context.prisma.$transaction(async (tx) => {
    const categories = await loadCategoryLookups({
      householdId: context.householdId,
      prisma: tx,
    });
    const result = createRecurringEvent(actor, command, {
      categories,
      generateId: context.generateId,
    });

    if (!result.ok) {
      return result;
    }

    await tx.recurringRule.create({
      data: toRecurringRuleCreateData(result.event, context.householdId),
    });
    await createCurrentMonthOccurrenceForNewEvent(actor, result.event, {
      categories,
      generateLedgerRecordId: context.generateLedgerRecordId,
      generateOccurrenceId: context.generateOccurrenceId,
      householdId: context.householdId,
      now: context.now,
      tx,
    });

    return result;
  });
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
            status: "pending",
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

export async function runRecurringPostingJob({
  prisma,
  targetDate = new Date(),
}: {
  prisma: RecurringEventPostingJobPrismaClient;
  targetDate?: Date;
}): Promise<RunRecurringPostingJobResult> {
  const targetMonth = formatMonthInTimeZone(targetDate, "Asia/Taipei");
  const households = await prisma.household.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  const summary: RunRecurringPostingJobResult = {
    alreadyPostedCount: 0,
    householdCount: 0,
    pendingCount: 0,
    postedCount: 0,
    skippedCount: 0,
    skippedHouseholdCount: 0,
    targetMonth,
  };

  for (const household of households) {
    const actor = await loadRecurringPostingActor(prisma, household.id);

    if (!actor) {
      summary.skippedHouseholdCount += 1;
      continue;
    }

    const result = await ensureRecurringOccurrencesForMonth(actor, {
      month: targetMonth,
    }, {
      householdId: household.id,
      now: () => targetDate,
      prisma,
    });

    summary.alreadyPostedCount += result.alreadyPostedCount;
    summary.householdCount += 1;
    summary.pendingCount += result.pendingCount;
    summary.postedCount += result.postedCount;
    summary.skippedCount += result.skippedCount;
  }

  return summary;
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

async function createCurrentMonthOccurrenceForNewEvent(
  actor: AuthenticatedMember,
  event: RecurringEvent,
  context: {
    categories: { id: string; status: "active" | "archived"; type: "income" | "expense" }[];
    generateLedgerRecordId?: () => string;
    generateOccurrenceId?: () => string;
    householdId: string;
    now?: () => Date;
    tx: Pick<RecurringEventMutationTransaction, "ledgerRecord" | "recurringOccurrence">;
  },
) {
  const now = context.now?.() ?? new Date();
  const currentMonth = formatMonthInTimeZone(now, "Asia/Taipei");
  const today = formatDateInTimeZone(now, "Asia/Taipei");
  const targetDate = resolveRecurringTargetDate(event.schedule, currentMonth);

  if (typeof targetDate !== "string") {
    return;
  }

  if (targetDate < today) {
    return;
  }

  const occurrenceId = context.generateOccurrenceId?.() ?? crypto.randomUUID();

  await context.tx.recurringOccurrence.create({
    data: {
      householdId: context.householdId,
      id: occurrenceId,
      month: currentMonth,
      recurringRuleId: event.id,
      status: "pending",
      targetDate: dateOnly(targetDate),
    },
  });

  if (event.postingMode === "immediate" && targetDate === today) {
    const postResult = await postRecurringEventLedgerRecord(actor, event, {
      categories: context.categories,
      generateLedgerRecordId: context.generateLedgerRecordId,
      householdId: context.householdId,
      month: currentMonth,
      now: context.now,
      occurrenceId,
      tx: context.tx,
    });

    if (!postResult.ok) {
      throw new Error(
        `Created recurring event could not post current occurrence: ${postResult.reason}`,
      );
    }
  }
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

  if (
    !canPostRecurringEvent(
      event,
      command.occurredOn,
      context.now?.() ?? new Date(),
    )
  ) {
    return { ok: false, reason: "occurrence_not_due" };
  }

  const result = createLedgerRecord(actor, command, {
    categories: context.categories,
    generateId: context.generateLedgerRecordId,
  });

  if (!result.ok) {
    return mapLedgerRecordFailure(result.reason);
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

function canPostRecurringEvent(
  event: RecurringEvent,
  occurredOn: string,
  now: Date,
): boolean {
  if (event.postingMode === "reminder") {
    return true;
  }

  return occurredOn <= formatDateInTimeZone(now, "Asia/Taipei");
}

function mapLedgerRecordFailure(
  reason: Extract<CreateLedgerRecordResult, { ok: false }>["reason"],
): Extract<ConfirmRecurringOccurrenceResult, { ok: false }> {
  if (
    reason === "archived_category" ||
    reason === "category_type_mismatch" ||
    reason === "invalid_amount" ||
    reason === "missing_category" ||
    reason === "permission_denied"
  ) {
    return {
      ok: false,
      reason,
    };
  }

  if (
    reason === "fund_paid_expense_cannot_have_member_payer" ||
    reason === "invalid_date" ||
    reason === "missing_member_payer" ||
    reason === "missing_name"
  ) {
    throw new Error(`Invalid persisted recurring event generated ${reason}`);
  }

  const exhaustive: never = reason;
  return exhaustive;
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

async function loadRecurringPostingActor(
  prisma: RecurringEventPostingJobPrismaClient,
  householdId: string,
): Promise<AuthenticatedMember | null> {
  const member = await prisma.member.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      roles: {
        select: { role: true },
      },
    },
    where: {
      householdId,
      roles: {
        some: {
          role: { in: ["admin", "finance_manager"] },
        },
      },
      status: "active",
    },
  });

  if (!member) {
    return null;
  }

  return {
    googleAccountLinked: true,
    id: member.id,
    roles: member.roles.map((role) => role.role),
  };
}

function formatMonthInTimeZone(date: Date, timeZone: string): string {
  const parts = datePartsInTimeZone(date, timeZone);

  return `${parts.year}-${parts.month}`;
}

function formatDateInTimeZone(date: Date, timeZone: string): string {
  const parts = datePartsInTimeZone(date, timeZone);

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function datePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const valueByType = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    day: valueByType.day,
    month: valueByType.month,
    year: valueByType.year,
  };
}
