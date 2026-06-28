import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import {
  applyRecordQuery,
  initialRecordQueryState,
  type RecordQueryState,
} from "@/modules/fund-ledger/search/record-search-state";

type RecurringOccurrenceRow = {
  id: string;
  targetDate: Date;
  recurringRule: {
    amountCents: number;
    categoryId: string;
    createdByMemberId: string;
    dayOfMonth: number | null;
    name: string;
    payerMemberId: string | null;
    paymentSource: "fund" | "member" | null;
    postingMode: "immediate" | "reminder";
    scheduleAnchor: "fixed_day" | "month_end";
    sourceMemberId: string | null;
    type: "income" | "expense";
  };
};

export type PendingRecurringOccurrenceRecord = LedgerRecord & {
  recurringEventLabel: string;
  recurringOccurrenceId: string;
};

export type PendingRecurringOccurrencePrismaClient = {
  recurringOccurrence: {
    findMany(args: {
    include: { recurringRule: true };
      orderBy: [{ targetDate: "asc" }, { createdAt: "asc" }];
      where: {
        householdId: string;
        month?: string;
        status: "pending";
        targetDate?: {
          gte?: Date;
          lte?: Date;
        };
        recurringRule: {
          active: true;
          deletedAt: null;
          postingMode: "reminder";
        };
      };
    }): Promise<RecurringOccurrenceRow[]>;
  };
};

export async function loadPendingRecurringOccurrenceRecordsForMonth({
  householdId,
  month,
  prisma,
}: {
  householdId: string;
  month: string;
  prisma: PendingRecurringOccurrencePrismaClient;
}): Promise<PendingRecurringOccurrenceRecord[]> {
  const rows = await prisma.recurringOccurrence.findMany({
    include: { recurringRule: true },
    orderBy: [{ targetDate: "asc" }, { createdAt: "asc" }],
    where: {
      householdId,
      month,
      status: "pending",
      recurringRule: {
        active: true,
        deletedAt: null,
        postingMode: "reminder",
      },
    },
  });

  return rows.map(mapPendingOccurrenceRowToLedgerRecord);
}

export async function loadPendingRecurringOccurrenceRecordsForSearch({
  householdId,
  prisma,
  query,
}: {
  householdId: string;
  prisma: PendingRecurringOccurrencePrismaClient;
  query: RecordQueryState;
}): Promise<PendingRecurringOccurrenceRecord[]> {
  const targetDate = recurringTargetDateRange(query);
  const rows = await prisma.recurringOccurrence.findMany({
    include: { recurringRule: true },
    orderBy: [{ targetDate: "asc" }, { createdAt: "asc" }],
    where: {
      householdId,
      status: "pending",
      ...(targetDate ? { targetDate } : {}),
      recurringRule: {
        active: true,
        deletedAt: null,
        postingMode: "reminder",
      },
    },
  });

  return filterPendingRecurringOccurrenceRecords(
    rows.map(mapPendingOccurrenceRowToLedgerRecord),
    query,
  );
}

export function filterPendingRecurringOccurrenceRecords(
  records: PendingRecurringOccurrenceRecord[],
  query: RecordQueryState = initialRecordQueryState,
): PendingRecurringOccurrenceRecord[] {
  return applyRecordQuery(records, query) as PendingRecurringOccurrenceRecord[];
}

function mapPendingOccurrenceRowToLedgerRecord(
  row: RecurringOccurrenceRow,
): PendingRecurringOccurrenceRecord {
  const base = {
    amountCents: row.recurringRule.amountCents,
    categoryId: row.recurringRule.categoryId,
    createdByMemberId: row.recurringRule.createdByMemberId,
    id: pendingRecurringRecordId(row.id),
    name: row.recurringRule.name,
    note: undefined,
    occurredOn: formatDateOnly(row.targetDate),
    recurringOccurrenceId: row.id,
    recurringEventLabel: recurringEventLabel(row.recurringRule),
    reimbursementStatus: "not_applicable" as const,
    status: "active" as const,
  };

  if (row.recurringRule.type === "income") {
    return {
      ...base,
      sourceMemberId: row.recurringRule.sourceMemberId ?? "",
      type: "income",
    };
  }

  return {
    ...base,
    paymentSource: row.recurringRule.paymentSource ?? "fund",
    ...(row.recurringRule.payerMemberId
      ? { payerMemberId: row.recurringRule.payerMemberId }
      : {}),
    reimbursementStatus: "not_refundable",
    type: "expense",
  };
}

export function pendingRecurringRecordId(occurrenceId: string): string {
  return `recurring-occurrence:${occurrenceId}`;
}

export function isPendingRecurringOccurrenceRecordId(recordId: string): boolean {
  return recordId.startsWith("recurring-occurrence:");
}

export function pendingRecurringOccurrenceIdFromRecordId(
  recordId: string,
): string | undefined {
  return isPendingRecurringOccurrenceRecordId(recordId)
    ? recordId.slice("recurring-occurrence:".length)
    : undefined;
}

export function isPendingRecurringOccurrenceRecord(
  record: LedgerRecord,
): record is PendingRecurringOccurrenceRecord {
  return isPendingRecurringOccurrenceRecordId(record.id);
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function recurringTargetDateRange(query: RecordQueryState) {
  const range: { gte?: Date; lte?: Date } = {};

  if (query.dateFrom) {
    range.gte = dateOnly(query.dateFrom);
  }

  if (query.dateTo) {
    range.lte = dateOnly(query.dateTo);
  }

  return Object.keys(range).length > 0 ? range : undefined;
}

function dateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function recurringEventLabel(rule: RecurringOccurrenceRow["recurringRule"]): string {
  const scheduleLabel = rule.scheduleAnchor === "month_end"
    ? "每月底"
    : `每月 ${rule.dayOfMonth ?? 1} 號`;
  const postingModeLabel = rule.postingMode === "immediate"
    ? "馬上入帳"
    : "提醒入帳";

  return `${scheduleLabel}，${postingModeLabel}`;
}
