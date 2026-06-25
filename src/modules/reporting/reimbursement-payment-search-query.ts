import type { Prisma } from "@/generated/prisma/client";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";

export const REIMBURSEMENT_PAYMENT_PAGE_SIZE = 100;

export type ReimbursementPaymentSortOrder =
  | "newest"
  | "oldest"
  | "amount_desc"
  | "amount_asc";

export type ReimbursementPaymentQueryState = {
  dateFrom: string;
  dateTo: string;
  paidToMemberId: string;
  search: string;
  sort: ReimbursementPaymentSortOrder;
};

export type ReimbursementPaymentSearchCursor = {
  id: string;
  paidOn: string;
  amountCents?: number;
};

export type ReimbursementPaymentSearchPageQueryInput = {
  householdId: string;
  query: ReimbursementPaymentQueryState;
  cursor?: ReimbursementPaymentSearchCursor | null;
};

export type ReimbursementPaymentSearchResult = {
  id: string;
  reimbursementBatchId: string;
  amountCents: number;
  paidOn: string;
  paidToMemberId: string;
  paidToMemberName: string;
  method: ReimbursementPaymentMethod;
  methodLabel: "銀行轉帳" | "現金" | "其他";
  note: string;
  linkedRecordNames: string[];
  primaryLinkedRecordName: string;
  linkedRecords: LedgerRecord[];
};

type SortDirection = "asc" | "desc";
type ReimbursementPaymentMethod = "bank_transfer" | "cash" | "other";

const reimbursementPaymentLedgerRecordSelect = {
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

export const reimbursementPaymentSelect = {
  id: true,
  reimbursementBatchId: true,
  amountCents: true,
  paidOn: true,
  paidToMemberId: true,
  method: true,
  note: true,
  paidToMember: {
    select: {
      displayName: true,
    },
  },
  reimbursementBatch: {
    select: {
      items: {
        select: {
          ledgerRecord: {
            select: reimbursementPaymentLedgerRecordSelect,
          },
        },
        orderBy: [
          { ledgerRecord: { occurredOn: "desc" } },
          { ledgerRecord: { id: "desc" } },
        ],
      },
    },
  },
} satisfies Prisma.ReimbursementPaymentSelect;

export type ReimbursementPaymentPrismaRow = Prisma.ReimbursementPaymentGetPayload<{
  select: typeof reimbursementPaymentSelect;
}>;

export const initialReimbursementPaymentQueryState: ReimbursementPaymentQueryState = {
  dateFrom: "",
  dateTo: "",
  paidToMemberId: "all",
  search: "",
  sort: "newest",
};

export function isInitialReimbursementPaymentQuery(query: ReimbursementPaymentQueryState) {
  return (
    query.dateFrom === initialReimbursementPaymentQueryState.dateFrom &&
    query.dateTo === initialReimbursementPaymentQueryState.dateTo &&
    query.paidToMemberId === initialReimbursementPaymentQueryState.paidToMemberId &&
    query.search === initialReimbursementPaymentQueryState.search &&
    query.sort === initialReimbursementPaymentQueryState.sort
  );
}

export function buildReimbursementPaymentSearchPageQuery({
  householdId,
  query,
  cursor,
}: ReimbursementPaymentSearchPageQueryInput) {
  const baseWhere = buildReimbursementPaymentSearchWhere(householdId, query);
  const cursorWhere = cursor
    ? buildReimbursementPaymentCursorWhere(query.sort, cursor)
    : undefined;

  return {
    take: REIMBURSEMENT_PAYMENT_PAGE_SIZE + 1,
    where: mergeWhere(baseWhere, cursorWhere),
    orderBy: reimbursementPaymentOrderByForSort(query.sort),
  };
}

export function cursorFromReimbursementPayment(record: {
  id: string;
  paidOn: string;
  amountCents: number;
}): ReimbursementPaymentSearchCursor {
  return {
    id: record.id,
    paidOn: record.paidOn,
    amountCents: record.amountCents,
  };
}

export function mapReimbursementPaymentSearchResult(
  row: ReimbursementPaymentPrismaRow,
): ReimbursementPaymentSearchResult {
  const linkedRecords = row.reimbursementBatch.items.map((item) =>
    mapLinkedLedgerRecord(item.ledgerRecord),
  );
  const linkedRecordNames = linkedRecords.map((record) => record.name);

  return {
    id: row.id,
    reimbursementBatchId: row.reimbursementBatchId,
    amountCents: row.amountCents,
    paidOn: formatDateOnly(row.paidOn),
    paidToMemberId: row.paidToMemberId,
    paidToMemberName: row.paidToMember.displayName,
    method: row.method,
    methodLabel: methodLabel(row.method),
    note: row.note ?? "",
    linkedRecordNames,
    primaryLinkedRecordName: linkedRecordNames[0] ?? "未命名紀錄",
    linkedRecords,
  };
}

export function buildReimbursementPaymentSearchWhere(
  householdId: string,
  query: ReimbursementPaymentQueryState,
) {
  const where: Record<string, unknown> = {
    householdId,
  };

  if (query.paidToMemberId !== "all") {
    where.paidToMemberId = query.paidToMemberId;
  }

  const paidOnRange: Record<string, Date> = {};
  if (query.dateFrom) {
    paidOnRange.gte = dateOnly(query.dateFrom);
  }
  if (query.dateTo) {
    paidOnRange.lte = dateOnly(query.dateTo);
  }
  if (Object.keys(paidOnRange).length > 0) {
    where.paidOn = paidOnRange;
  }

  const searchPredicates = reimbursementPaymentSearchPredicates(query.search);
  if (searchPredicates.length > 0) {
    where.OR = searchPredicates;
  }

  return where;
}

export function reimbursementPaymentOrderByForSort(sort: ReimbursementPaymentSortOrder) {
  if (sort === "oldest") {
    return [{ paidOn: "asc" }, { id: "asc" }];
  }

  if (sort === "amount_desc") {
    return [
      { amountCents: "desc" },
      { paidOn: "desc" },
      { id: "desc" },
    ];
  }

  if (sort === "amount_asc") {
    return [
      { amountCents: "asc" },
      { paidOn: "desc" },
      { id: "desc" },
    ];
  }

  return [{ paidOn: "desc" }, { id: "desc" }];
}

function mapLinkedLedgerRecord(
  record: ReimbursementPaymentPrismaRow["reimbursementBatch"]["items"][number]["ledgerRecord"],
): LedgerRecord {
  const base = {
    id: record.id,
    type: record.type,
    name: record.name,
    amountCents: record.amountCents,
    occurredOn: formatDateOnly(record.occurredOn),
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

function methodLabel(method: ReimbursementPaymentMethod) {
  const labels: Record<ReimbursementPaymentMethod, ReimbursementPaymentSearchResult["methodLabel"]> = {
    bank_transfer: "銀行轉帳",
    cash: "現金",
    other: "其他",
  };

  return labels[method];
}

function mergeWhere(
  baseWhere: Record<string, unknown>,
  cursorWhere?: Record<string, unknown>,
) {
  if (!cursorWhere) {
    return baseWhere;
  }

  if (baseWhere.OR) {
    const { OR, ...rest } = baseWhere;

    return {
      ...rest,
      AND: [{ OR }, cursorWhere],
    };
  }

  return {
    ...baseWhere,
    ...cursorWhere,
  };
}

function reimbursementPaymentSearchPredicates(searchInput: string): Record<string, unknown>[] {
  const search = searchInput.trim();

  if (!search || search === "退款" || search === "退款紀錄") {
    return [];
  }

  const predicates: Record<string, unknown>[] = [
    { paidToMember: { displayName: { contains: search, mode: "insensitive" } } },
    { note: { contains: search, mode: "insensitive" } },
    {
      reimbursementBatch: {
        items: {
          some: {
            ledgerRecord: {
              name: { contains: search, mode: "insensitive" },
            },
          },
        },
      },
    },
  ];
  const method = methodForSearch(search);
  const amountCents = parseSearchAmountCents(search);
  const paidOn = parseSearchDate(search);

  if (method) {
    predicates.push({ method });
  }

  if (amountCents !== null) {
    predicates.push({ amountCents });
  }

  if (paidOn) {
    predicates.push({ paidOn });
  }

  return predicates;
}

function methodForSearch(search: string): ReimbursementPaymentMethod | null {
  const normalized = search.toLocaleLowerCase("zh-TW");

  if ("銀行轉帳".includes(normalized) || normalized.includes("bank")) {
    return "bank_transfer";
  }

  if ("現金".includes(normalized) || normalized.includes("cash")) {
    return "cash";
  }

  if ("其他".includes(normalized) || normalized.includes("other")) {
    return "other";
  }

  return null;
}

function buildReimbursementPaymentCursorWhere(
  sort: ReimbursementPaymentSortOrder,
  cursor: ReimbursementPaymentSearchCursor,
) {
  const paidOn = dateOnly(cursor.paidOn);

  if (sort === "oldest") {
    return {
      OR: [
        { paidOn: { gt: paidOn } },
        { paidOn, id: { gt: cursor.id } },
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
          paidOn: { lt: paidOn },
        },
        {
          amountCents,
          paidOn,
          id: { lt: cursor.id },
        },
      ],
    };
  }

  return {
    OR: [
      { paidOn: { lt: paidOn } },
      { paidOn, id: { lt: cursor.id } },
    ],
  };
}

function parseSearchAmountCents(search: string): number | null {
  const normalized = search.replace(/[^\d.]/g, "");

  if (!normalized || isDateLike(search)) {
    return null;
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.round(amount * 100);
}

function parseSearchDate(search: string): Date | null {
  const normalized = search.trim().replaceAll("/", "-");

  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return null;
  }

  return dateOnly(normalized);
}

function isDateLike(search: string): boolean {
  return /^\s*\d{4}[-/]\d{2}[-/]\d{2}\s*$/.test(search);
}

function dateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}

function formatDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}
