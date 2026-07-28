import {
  postRecurringOccurrence,
  type LedgerCreationMemberActor,
  type PostRecurringOccurrenceResult,
} from "../fund-ledger/ledger-record-creation";
import {
  loadCategoryLookups,
  type CategoryLookupQueryPrismaClient,
} from "../categorization/category-query";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  recurringPostingSystemActor,
  type RecurringPostingSystemActor,
} from "../identity-access/system-actor";
import {
  formatDateInTimeZone,
  formatMonthInTimeZone,
} from "./recurring-date";
import {
  createRecurringEvent,
  resolveRecurringTargetDate,
  type CreateRecurringEventCommand,
  type CreateRecurringEventResult,
  type RecurringEvent,
  type RecurringPostingMode,
  type RecurringRecordType,
} from "./recurring-event";

type PaymentSource = "fund" | "member";
type ScheduleAnchor = "fixed_day" | "month_end";
type OccurrenceStatus = "pending" | "posted" | "skipped" | "blocked";
type BlockedReason = "archived_category" | "disabled_member";

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
  };

type RecurringEventMutationTransaction = CategoryLookupQueryPrismaClient & {
  recurringOccurrence: {
    create(args: { data: Record<string, unknown> }): Promise<unknown>;
    findUnique(args: {
      where: Record<string, unknown>;
    }): Promise<RecurringOccurrenceRow | null>;
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
  blockedReason?: BlockedReason | null;
  id: string;
  ledgerRecordId: string | null;
  month: string;
  status: OccurrenceStatus;
  targetDate: Date;
};

export type CreateRecurringEventInDatabaseContext = {
  generateId?: () => string;
  generateOccurrenceId?: () => string;
  householdId: string;
  now?: () => Date;
  prisma: RecurringEventCommandPrismaClient;
};

export type CreateRecurringEventInDatabaseResult =
  | Extract<CreateRecurringEventResult, { ok: false }>
  | (Extract<CreateRecurringEventResult, { ok: true }> & {
      currentOccurrenceStatus:
        | "not_created"
        | "pending"
        | "posted"
        | "blocked"
        | "unavailable";
    });

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
  blockedCount: number;
  pendingCount: number;
  postedCount: number;
  skippedCount: number;
  unavailableCount: number;
};

export type RunRecurringPostingJobResult = EnsureRecurringOccurrencesResult & {
  householdCount: number;
  skippedHouseholdCount: number;
  targetMonth: string;
};

export async function createRecurringEventInDatabase(
  actor: AuthenticatedMember,
  command: CreateRecurringEventCommand,
  context: CreateRecurringEventInDatabaseContext,
): Promise<CreateRecurringEventInDatabaseResult> {
  const persisted = await context.prisma.$transaction(async (tx) => {
    const categories = await loadCategoryLookups({
      householdId: context.householdId,
      prisma: tx,
    });
    const result = createRecurringEvent(actor, command, {
      categories,
      generateId: context.generateId,
    });

    if (!result.ok) {
      return { result, occurrence: null };
    }

    await tx.recurringRule.create({
      data: toRecurringRuleCreateData(result.event, context.householdId),
    });
    const occurrence = await createCurrentMonthOccurrenceForNewEvent(
      result.event,
      {
        generateOccurrenceId: context.generateOccurrenceId,
        householdId: context.householdId,
        now: context.now,
        tx,
      },
    );

    return { result, occurrence };
  });

  if (!persisted.result.ok) {
    return persisted.result;
  }
  if (!persisted.occurrence) {
    return {
      ...persisted.result,
      currentOccurrenceStatus: "not_created",
    };
  }
  if (!persisted.occurrence.shouldPost) {
    return {
      ...persisted.result,
      currentOccurrenceStatus: "pending",
    };
  }

  const postResult = await postRecurringOccurrence(memberActor(
    actor,
    context.householdId,
  ), {
    occurrenceId: persisted.occurrence.id,
  });
  return {
    ...persisted.result,
    currentOccurrenceStatus: currentOccurrenceStatus(postResult),
  };
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
      data: { active: false, deletedAt: now },
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

type GeneratedOccurrence =
  | { kind: "already_posted" | "blocked" | "pending" | "skipped" }
  | { kind: "post"; occurrenceId: string };

export async function ensureRecurringOccurrencesForMonth(
  actor: LedgerCreationMemberActor | RecurringPostingSystemActor,
  command: { month: string },
  context: {
    generateOccurrenceId?: () => string;
    householdId: string;
    now?: () => Date;
    prisma: RecurringEventMutationPrismaClient;
  },
): Promise<EnsureRecurringOccurrencesResult> {
  const today = formatDateInTimeZone(context.now?.() ?? new Date(), "Asia/Taipei");
  const rules = await context.prisma.$transaction((tx) =>
    tx.recurringRule.findMany({
      where: { active: true, householdId: context.householdId },
      orderBy: { createdAt: "asc" },
    })
  );
  const occurrences: GeneratedOccurrence[] = [];

  for (const rule of rules) {
    const generated = await context.prisma.$transaction(async (tx) => {
      const event = mapRecurringRuleRowToEvent(rule);
      const targetDate = resolveRecurringTargetDate(event.schedule, command.month);
      if (typeof targetDate !== "string") {
        return { kind: "skipped" } as const;
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
        return { kind: "already_posted" } as const;
      }
      if (existing?.status === "blocked") {
        return { kind: "blocked" } as const;
      }
      if (existing?.status === "skipped") {
        return { kind: "skipped" } as const;
      }

      const occurrenceId = existing?.id ??
        context.generateOccurrenceId?.() ?? crypto.randomUUID();
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
        return { kind: "pending" } as const;
      } else if (targetDate > today) {
        return { kind: "skipped" } as const;
      }
      return { kind: "post", occurrenceId } as const;
    });
    occurrences.push(generated);
  }

  const summary = emptyOccurrenceSummary();
  for (const occurrence of occurrences) {
    if (occurrence.kind === "already_posted") {
      summary.alreadyPostedCount += 1;
    } else if (occurrence.kind === "blocked") {
      summary.blockedCount += 1;
    } else if (occurrence.kind === "pending") {
      summary.pendingCount += 1;
    } else if (occurrence.kind === "skipped") {
      summary.skippedCount += 1;
    } else if (occurrence.kind === "post") {
      applyPostResultToSummary(
        summary,
        await postRecurringOccurrence(actor, {
          occurrenceId: occurrence.occurrenceId,
        }),
      );
    }
  }
  return summary;
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
    ...emptyOccurrenceSummary(),
    householdCount: 0,
    skippedHouseholdCount: 0,
    targetMonth,
  };

  for (const household of households) {
    const actor = recurringPostingSystemActor(household.id);
    const result = await ensureRecurringOccurrencesForMonth(actor, {
      month: targetMonth,
    }, {
      householdId: household.id,
      now: () => targetDate,
      prisma,
    });
    summary.alreadyPostedCount += result.alreadyPostedCount;
    summary.blockedCount += result.blockedCount;
    summary.householdCount += 1;
    summary.pendingCount += result.pendingCount;
    summary.postedCount += result.postedCount;
    summary.skippedCount += result.skippedCount;
    summary.unavailableCount += result.unavailableCount;
  }
  return summary;
}

function memberActor(
  actor: AuthenticatedMember,
  householdId: string,
): LedgerCreationMemberActor {
  return { kind: "member", member: { ...actor, householdId } };
}

function emptyOccurrenceSummary(): EnsureRecurringOccurrencesResult {
  return {
    alreadyPostedCount: 0,
    blockedCount: 0,
    pendingCount: 0,
    postedCount: 0,
    skippedCount: 0,
    unavailableCount: 0,
  };
}

function applyPostResultToSummary(
  summary: EnsureRecurringOccurrencesResult,
  result: PostRecurringOccurrenceResult,
) {
  if (result.status === "posted") {
    summary.postedCount += 1;
  } else if (result.status === "already_posted") {
    summary.alreadyPostedCount += 1;
  } else if (result.status === "blocked") {
    summary.blockedCount += 1;
  } else if (result.status === "unavailable") {
    summary.unavailableCount += 1;
  } else {
    summary.skippedCount += 1;
  }
}

function currentOccurrenceStatus(
  result: PostRecurringOccurrenceResult,
): "pending" | "posted" | "blocked" | "unavailable" {
  if (result.status === "posted" || result.status === "already_posted") {
    return "posted";
  }
  if (result.status === "blocked") {
    return "blocked";
  }
  return result.status === "unavailable" ? "unavailable" : "pending";
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
      : { anchor: "fixed_day" as const, dayOfMonth: row.dayOfMonth ?? 1 },
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
  event: RecurringEvent,
  context: {
    generateOccurrenceId?: () => string;
    householdId: string;
    now?: () => Date;
    tx: Pick<RecurringEventMutationTransaction, "recurringOccurrence">;
  },
): Promise<{ id: string; shouldPost: boolean } | null> {
  const now = context.now?.() ?? new Date();
  const currentMonth = formatMonthInTimeZone(now, "Asia/Taipei");
  const today = formatDateInTimeZone(now, "Asia/Taipei");
  const targetDate = resolveRecurringTargetDate(event.schedule, currentMonth);
  if (typeof targetDate !== "string" || targetDate < today) {
    return null;
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
  return {
    id: occurrenceId,
    shouldPost: event.postingMode === "immediate" && targetDate === today,
  };
}

function dateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
