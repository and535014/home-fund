import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";

export type RecordSortOrder = "newest" | "oldest" | "amount_desc" | "amount_asc";

export type RecordQueryState = {
  categoryId: string;
  dateFrom: string;
  dateTo: string;
  participant: string;
  reimbursementStatus: string;
  search: string;
  sort: RecordSortOrder;
  type: string;
};

export type RecordQueryOptions = {
  activeCategories: Category[];
  categoriesForType: (type: string) => Category[];
  participants: { label: string; value: string }[];
  participantsForType: (type: string) => { label: string; value: string }[];
};

export const initialRecordQueryState: RecordQueryState = {
  categoryId: "all",
  dateFrom: "",
  dateTo: "",
  participant: "all",
  reimbursementStatus: "all",
  search: "",
  sort: "newest",
  type: "all",
};

export function buildRecordQueryOptions(
  categories: Category[],
  memberNames: Record<string, string>,
): RecordQueryOptions {
  const activeCategories = categories
    .filter((category) => category.status === "active")
    .toSorted((a, b) => {
      if (a.type !== b.type) {
        return a.type.localeCompare(b.type);
      }

      return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
    });
  const participants = [
    { label: "基金", value: "fund" },
    ...Object.entries(memberNames)
      .map(([id, displayName]) => ({
        label: displayName,
        value: `member:${id}`,
      }))
      .toSorted((a, b) => a.label.localeCompare(b.label, "zh-TW")),
  ];

  return {
    activeCategories,
    categoriesForType: (type) =>
      activeCategories.filter(
        (category) => type === "all" || category.type === type,
      ),
    participants,
    participantsForType: (type) =>
      participants.filter(
        (participant) => type !== "income" || participant.value !== "fund",
      ),
  };
}

export function nextDraftQueryForType(
  query: RecordQueryState,
  type: string,
  categories: Category[],
): RecordQueryState {
  const selectedCategory = categories.find(
    (category) => category.id === query.categoryId,
  );

  return {
    ...query,
    categoryId:
      type === "all" || !selectedCategory || selectedCategory.type === type
        ? query.categoryId
        : "all",
    participant: type === "income" && query.participant === "fund"
      ? "all"
      : query.participant,
    type,
  };
}

export function applyRecordQuery(
  records: LedgerRecord[],
  query: RecordQueryState,
): LedgerRecord[] {
  const search = query.search.trim().toLocaleLowerCase("zh-TW");

  return records
    .filter((record) => record.status === "active")
    .filter((record) => {
      if (query.type !== "all" && record.type !== query.type) {
        return false;
      }

      if (query.categoryId !== "all" && record.categoryId !== query.categoryId) {
        return false;
      }

      if (!recordMatchesParticipant(record, query.participant)) {
        return false;
      }

      if (!recordMatchesReimbursementStatus(record, query.reimbursementStatus)) {
        return false;
      }

      if (query.dateFrom && record.occurredOn < query.dateFrom) {
        return false;
      }

      if (query.dateTo && record.occurredOn > query.dateTo) {
        return false;
      }

      if (search && !recordSearchText(record).includes(search)) {
        return false;
      }

      return true;
    })
    .toSorted((a, b) => compareRecords(a, b, query.sort));
}

export function isInitialRecordQuery(query: RecordQueryState): boolean {
  return (
    query.categoryId === initialRecordQueryState.categoryId &&
    query.dateFrom === initialRecordQueryState.dateFrom &&
    query.dateTo === initialRecordQueryState.dateTo &&
    query.participant === initialRecordQueryState.participant &&
    query.reimbursementStatus === initialRecordQueryState.reimbursementStatus &&
    query.search === initialRecordQueryState.search &&
    query.sort === initialRecordQueryState.sort &&
    query.type === initialRecordQueryState.type
  );
}

export function recordFilterCount(query: RecordQueryState): number {
  return [
    query.categoryId !== initialRecordQueryState.categoryId,
    query.dateFrom !== initialRecordQueryState.dateFrom,
    query.dateTo !== initialRecordQueryState.dateTo,
    query.participant !== initialRecordQueryState.participant,
    query.reimbursementStatus !== initialRecordQueryState.reimbursementStatus,
    query.sort !== initialRecordQueryState.sort,
    query.type !== initialRecordQueryState.type,
  ].filter(Boolean).length;
}

function recordMatchesParticipant(
  record: LedgerRecord,
  participant: string,
): boolean {
  if (participant === "all") {
    return true;
  }

  if (participant === "fund") {
    return record.type === "expense" && record.paymentSource === "fund";
  }

  const memberId = participant.replace("member:", "");

  if (record.type === "income") {
    return record.sourceMemberId === memberId;
  }

  return record.paymentSource === "member" && record.payerMemberId === memberId;
}

function recordMatchesReimbursementStatus(
  record: LedgerRecord,
  reimbursementStatus: string,
): boolean {
  if (reimbursementStatus === "all") {
    return true;
  }

  if (record.type !== "expense" || record.paymentSource !== "member") {
    return false;
  }

  if (reimbursementStatus === "refunded") {
    return record.reimbursementStatus === "reimbursed";
  }

  return record.reimbursementStatus === "refundable";
}

function recordSearchText(record: LedgerRecord): string {
  return [
    record.name,
    formatAmount(record.amountCents),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("zh-TW");
}

function compareRecords(
  a: LedgerRecord,
  b: LedgerRecord,
  sort: RecordSortOrder,
): number {
  if (sort === "oldest") {
    return a.occurredOn.localeCompare(b.occurredOn) || a.name.localeCompare(b.name);
  }

  if (sort === "amount_desc") {
    return b.amountCents - a.amountCents || b.occurredOn.localeCompare(a.occurredOn);
  }

  if (sort === "amount_asc") {
    return a.amountCents - b.amountCents || b.occurredOn.localeCompare(a.occurredOn);
  }

  return b.occurredOn.localeCompare(a.occurredOn) || a.name.localeCompare(b.name);
}

function formatAmount(amountCents: number): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}
