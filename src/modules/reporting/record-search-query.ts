import type { PrismaClient, Prisma } from "@/generated/prisma/client";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { RecordQueryState } from "@/modules/reporting/record-query";

export const SEARCH_RECORD_PAGE_SIZE = 100;

export type SearchRecordCursor = {
  id: string;
  occurredOn: string;
  amountCents?: number;
};

export type RecordSearchPageQueryInput = {
  householdId: string;
  query: RecordQueryState;
  cursor?: SearchRecordCursor | null;
};

type SortDirection = "asc" | "desc";

export type RecordSearchGroupSum = {
  type: "income" | "expense";
  _sum: {
    amountCents: number | null;
  };
};

export type RecordSearchPageResult = {
  records: LedgerRecord[];
  nextCursor: SearchRecordCursor | null;
  totalCount: number;
  totalNetAmountCents: number;
};

const ledgerRecordSelect = {
  id: true,
  type: true,
  name: true,
  amountCents: true,
  occurredOn: true,
  categoryId: true,
  createdByMemberId: true,
  sourceMemberId: true,
  paymentSource: true,
  payerMemberId: true,
  reimbursementStatus: true,
  status: true,
  note: true,
} satisfies Prisma.LedgerRecordSelect;

type LedgerRecordPrismaRow = Prisma.LedgerRecordGetPayload<{
  select: typeof ledgerRecordSelect;
}>;

export async function loadRecordSearchPageInDatabase({
  cursor,
  householdId,
  prisma,
  query,
}: RecordSearchPageQueryInput & {
  prisma: PrismaClient;
}): Promise<RecordSearchPageResult> {
  const pageQuery = buildRecordSearchPageQuery({
    householdId,
    query,
    cursor,
  });
  const aggregateWhere = buildRecordSearchWhere(householdId, query);
  const [rows, totalCount, groups] = await Promise.all([
    prisma.ledgerRecord.findMany({
      ...pageQuery,
      where: pageQuery.where as Prisma.LedgerRecordWhereInput,
      orderBy: pageQuery.orderBy as Prisma.LedgerRecordOrderByWithRelationInput[],
      select: ledgerRecordSelect,
    }),
    prisma.ledgerRecord.count({
      where: aggregateWhere as Prisma.LedgerRecordWhereInput,
    }),
    prisma.ledgerRecord.groupBy({
      by: ["type"],
      where: aggregateWhere as Prisma.LedgerRecordWhereInput,
      _sum: {
        amountCents: true,
      },
    }),
  ]);
  const pageRows = rows.slice(0, SEARCH_RECORD_PAGE_SIZE);
  const records = pageRows.map(mapPrismaLedgerRecordToLedgerRecord);
  const lastRecord = records.at(-1);

  return {
    records,
    nextCursor: rows.length > SEARCH_RECORD_PAGE_SIZE && lastRecord
      ? cursorFromRecord(lastRecord)
      : null,
    totalCount,
    totalNetAmountCents: calculateRecordSearchNetTotal(groups),
  };
}

export function buildRecordSearchPageQuery({
  householdId,
  query,
  cursor,
}: RecordSearchPageQueryInput) {
  const baseWhere = buildRecordSearchWhere(householdId, query);
  const cursorWhere = cursor
    ? buildCursorWhere(query.sort, cursor)
    : undefined;

  return {
    take: SEARCH_RECORD_PAGE_SIZE + 1,
    where: mergeWhere(baseWhere, cursorWhere),
    orderBy: orderByForSort(query.sort),
  };
}

export function cursorFromRecord(record: {
  id: string;
  occurredOn: string;
  amountCents: number;
}): SearchRecordCursor {
  return {
    id: record.id,
    occurredOn: record.occurredOn,
    amountCents: record.amountCents,
  };
}

export function buildRecordSearchWhere(
  householdId: string,
  query: RecordQueryState,
) {
  const where: Record<string, unknown> = {
    householdId,
    status: "active",
  };

  if (query.type !== "all") {
    where.type = query.type;
  }

  if (query.categoryId !== "all") {
    where.categoryId = query.categoryId;
  }

  if (query.participant === "fund") {
    addAndPredicate(where, {
      type: "expense",
      paymentSource: "fund",
    });
  } else if (query.participant.startsWith("member:")) {
    const memberId = query.participant.replace("member:", "");

    if (query.type === "income") {
      where.sourceMemberId = memberId;
    } else if (query.type === "expense") {
      where.paymentSource = "member";
      where.payerMemberId = memberId;
    } else {
      where.OR = [
        { type: "income", sourceMemberId: memberId },
        { type: "expense", paymentSource: "member", payerMemberId: memberId },
      ];
    }
  }

  if (query.reimbursementStatus !== "all") {
    addAndPredicate(where, {
      type: "expense",
      paymentSource: "member",
      reimbursementStatus:
        query.reimbursementStatus === "refunded" ? "reimbursed" : "refundable",
    });
  }

  const dateRange: Record<string, Date> = {};
  if (query.dateFrom) {
    dateRange.gte = dateOnly(query.dateFrom);
  }
  if (query.dateTo) {
    dateRange.lte = dateOnly(query.dateTo);
  }
  if (Object.keys(dateRange).length > 0) {
    where.occurredOn = dateRange;
  }

  const search = query.search.trim();
  if (search) {
    const amountCents = parseSearchAmountCents(search);
    const searchPredicates: Record<string, unknown>[] = [
      { name: { contains: search, mode: "insensitive" } },
    ];

    if (amountCents !== null) {
      searchPredicates.push({ amountCents });
    }

    if (where.OR) {
      addAndPredicate(where, { OR: where.OR });
      addAndPredicate(where, { OR: searchPredicates });
      delete where.OR;
    } else {
      where.OR = searchPredicates;
    }
  }

  return where;
}

function addAndPredicate(
  where: Record<string, unknown>,
  predicate: Record<string, unknown>,
) {
  const current = where.AND;

  if (Array.isArray(current)) {
    current.push(predicate);
    return;
  }

  where.AND = current ? [current, predicate] : [predicate];
}

function mergeWhere(
  baseWhere: Record<string, unknown>,
  cursorWhere?: Record<string, unknown>,
) {
  if (!cursorWhere) {
    return baseWhere;
  }

  return {
    AND: [baseWhere, cursorWhere],
  };
}

export function orderByForSort(sort: RecordQueryState["sort"]) {
  if (sort === "oldest") {
    return [{ occurredOn: "asc" }, { id: "asc" }];
  }

  if (sort === "amount_desc") {
    return [
      { amountCents: "desc" },
      { occurredOn: "desc" },
      { id: "desc" },
    ];
  }

  if (sort === "amount_asc") {
    return [
      { amountCents: "asc" },
      { occurredOn: "desc" },
      { id: "desc" },
    ];
  }

  return [{ occurredOn: "desc" }, { id: "desc" }];
}

export function calculateRecordSearchNetTotal(groups: RecordSearchGroupSum[]) {
  return groups.reduce((total, group) => {
    const amountCents = group._sum.amountCents ?? 0;
    return total + (group.type === "income" ? amountCents : -amountCents);
  }, 0);
}

function buildCursorWhere(
  sort: RecordQueryState["sort"],
  cursor: SearchRecordCursor,
) {
  const occurredOn = dateOnly(cursor.occurredOn);

  if (sort === "oldest") {
    return {
      OR: [
        { occurredOn: { gt: occurredOn } },
        { occurredOn, id: { gt: cursor.id } },
      ],
    };
  }

  if (sort === "amount_desc" || sort === "amount_asc") {
    const amountCents = cursor.amountCents ?? 0;
    const amountDirection: SortDirection = sort === "amount_desc" ? "desc" : "asc";
    const amountOperator = amountDirection === "desc" ? "lt" : "gt";

    return {
      OR: [
        { amountCents: { [amountOperator]: amountCents } },
        {
          amountCents,
          occurredOn: { lt: occurredOn },
        },
        {
          amountCents,
          occurredOn,
          id: { lt: cursor.id },
        },
      ],
    };
  }

  return {
    OR: [
      { occurredOn: { lt: occurredOn } },
      { occurredOn, id: { lt: cursor.id } },
    ],
  };
}

function parseSearchAmountCents(search: string): number | null {
  const normalized = search.replace(/[^\d.]/g, "");

  if (!normalized) {
    return null;
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount * 100);
}

function dateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function mapPrismaLedgerRecordToLedgerRecord(record: LedgerRecordPrismaRow): LedgerRecord {
  const base = {
    id: record.id,
    name: record.name,
    amountCents: record.amountCents,
    occurredOn: record.occurredOn.toISOString().slice(0, 10),
    categoryId: record.categoryId,
    createdByMemberId: record.createdByMemberId,
    reimbursementStatus:
      record.reimbursementStatus === "not_applicable"
        ? "not_refundable"
        : record.reimbursementStatus,
    status: record.status,
    ...(record.note ? { note: record.note } : {}),
  };

  if (record.type === "income") {
    return {
      ...base,
      type: "income",
      sourceMemberId: record.sourceMemberId ?? "",
      reimbursementStatus: "not_applicable",
    };
  }

  return {
    ...base,
    type: "expense",
    paymentSource: record.paymentSource ?? "fund",
    ...(record.payerMemberId ? { payerMemberId: record.payerMemberId } : {}),
  };
}
