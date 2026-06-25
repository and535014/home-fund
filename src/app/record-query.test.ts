import { describe, expect, it } from "vitest";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import {
  applyRecordQuery,
  buildRecordQueryOptions,
  initialRecordQueryState,
  nextDraftQueryForType,
  nextDraftQueryForParticipant,
  nextDraftQueryForReimbursementStatus,
  recordFilterCount,
} from "./record-query";

const categories: Category[] = [
  {
    id: "income-living",
    type: "income",
    name: "生活費",
    color: "teal",
    icon: "badge-dollar-sign",
    sortOrder: 10,
    status: "active",
  },
  {
    id: "expense-grocery",
    type: "expense",
    name: "日用品",
    color: "gold",
    icon: "shopping-cart",
    sortOrder: 10,
    status: "active",
  },
  {
    id: "expense-archived",
    type: "expense",
    name: "封存分類",
    color: "blue",
    icon: "tags",
    sortOrder: 20,
    status: "archived",
  },
];

const memberNames = {
  "member-kai": "Kai",
  "member-lin": "Lin",
};

const records: LedgerRecord[] = [
  {
    id: "income-kai",
    type: "income",
    name: "六月生活費",
    amountCents: 80_000_00,
    occurredOn: "2026-06-10",
    categoryId: "income-living",
    createdByMemberId: "member-kai",
    sourceMemberId: "member-kai",
    reimbursementStatus: "not_applicable",
    status: "active",
    note: "家用收入",
  },
  {
    id: "expense-fund",
    type: "expense",
    name: "網路費",
    amountCents: 899_00,
    occurredOn: "2026-06-05",
    categoryId: "expense-grocery",
    createdByMemberId: "member-kai",
    paymentSource: "fund",
    reimbursementStatus: "not_refundable",
    status: "active",
    note: "基金支出",
  },
  {
    id: "expense-refundable",
    type: "expense",
    name: "補充用品代墊",
    amountCents: 1_880_00,
    occurredOn: "2026-06-13",
    categoryId: "expense-grocery",
    createdByMemberId: "member-lin",
    paymentSource: "member",
    payerMemberId: "member-lin",
    reimbursementStatus: "refundable",
    status: "active",
    note: "超市採買",
  },
  {
    id: "expense-reimbursed",
    type: "expense",
    name: "已退款交通",
    amountCents: 3_200_00,
    occurredOn: "2026-05-20",
    categoryId: "expense-grocery",
    createdByMemberId: "member-kai",
    paymentSource: "member",
    payerMemberId: "member-kai",
    reimbursementStatus: "reimbursed",
    status: "active",
  },
  {
    id: "expense-voided",
    type: "expense",
    name: "作廢紀錄",
    amountCents: 9_999_00,
    occurredOn: "2026-06-30",
    categoryId: "expense-grocery",
    createdByMemberId: "member-kai",
    paymentSource: "fund",
    reimbursementStatus: "not_refundable",
    status: "voided",
  },
  {
    id: "expense-archived-category",
    type: "expense",
    name: "歷史紀錄",
    amountCents: 700_00,
    occurredOn: "2026-04-01",
    categoryId: "expense-archived",
    createdByMemberId: "member-kai",
    paymentSource: "fund",
    reimbursementStatus: "not_refundable",
    status: "active",
  },
];

describe("record query options", () => {
  it("uses active categories and constrains options by selected type", () => {
    const options = buildRecordQueryOptions(categories, memberNames);

    expect(options.activeCategories.map((category) => category.id)).toEqual([
      "expense-grocery",
      "income-living",
    ]);
    expect(options.categoriesForType("income").map((category) => category.id)).toEqual([
      "income-living",
    ]);
    expect(options.categoriesForType("expense").map((category) => category.id)).toEqual([
      "expense-grocery",
    ]);
    expect(options.participantsForType("income").map((entry) => entry.value)).toEqual([
      "member:member-kai",
      "member:member-lin",
    ]);
    expect(options.participantsForType("expense").map((entry) => entry.value)).toContain(
      "fund",
    );
  });

  it("resets invalid category and fund participant when type changes", () => {
    expect(nextDraftQueryForType({
      ...initialRecordQueryState,
      categoryId: "expense-grocery",
      participant: "fund",
      reimbursementStatus: "refunded",
    }, "income", categories)).toMatchObject({
      categoryId: "all",
      participant: "all",
      reimbursementStatus: "all",
      type: "income",
    });
  });

  it("moves mutually exclusive participant and reimbursement filters to expense", () => {
    expect(nextDraftQueryForParticipant({
      ...initialRecordQueryState,
      type: "income",
    }, "fund", categories)).toMatchObject({
      participant: "fund",
      type: "expense",
    });

    expect(nextDraftQueryForReimbursementStatus({
      ...initialRecordQueryState,
      categoryId: "income-living",
      type: "income",
    }, "refunded", categories)).toMatchObject({
      categoryId: "all",
      reimbursementStatus: "refunded",
      type: "expense",
    });
  });
});

describe("applyRecordQuery", () => {
  it("matches keyword by record name and formatted amount only", () => {
    expect(query({ search: "生活費" }).map((record) => record.id)).toEqual([
      "income-kai",
    ]);
    expect(query({ search: "80,000" }).map((record) => record.id)).toEqual([
      "income-kai",
    ]);
    expect(query({ search: "$899" }).map((record) => record.id)).toEqual([
      "expense-fund",
    ]);
    expect(query({ search: "Kai" })).toEqual([]);
    expect(query({ search: "家用收入" })).toEqual([]);
    expect(query({ search: "日用品" })).toEqual([]);
    expect(query({ search: "待退款" })).toEqual([]);
    expect(query({ search: "2026/06/10" })).toEqual([]);
    expect(query({ search: "封存分類" })).toEqual([]);
    expect(query({ search: "作廢紀錄" })).toEqual([]);
  });

  it("filters by member and fund participation", () => {
    expect(query({ participant: "member:member-lin" }).map((record) => record.id)).toEqual([
      "expense-refundable",
    ]);
    expect(query({ participant: "member:member-kai" }).map((record) => record.id)).toEqual([
      "income-kai",
      "expense-reimbursed",
    ]);
    expect(query({ participant: "fund" }).map((record) => record.id)).toEqual([
      "expense-fund",
      "expense-archived-category",
    ]);
  });

  it("filters reimbursement status to member-paid expenses only", () => {
    expect(query({ reimbursementStatus: "refunded" }).map((record) => record.id)).toEqual([
      "expense-reimbursed",
    ]);
    expect(query({ reimbursementStatus: "unrefunded" }).map((record) => record.id)).toEqual([
      "expense-refundable",
    ]);
  });

  it("filters by open-ended date ranges using occurredOn", () => {
    expect(query({ dateFrom: "2026-06-10" }).map((record) => record.id)).toEqual([
      "expense-refundable",
      "income-kai",
    ]);
    expect(query({ dateTo: "2026-06-05" }).map((record) => record.id)).toEqual([
      "expense-fund",
      "expense-reimbursed",
      "expense-archived-category",
    ]);
    expect(query({
      dateFrom: "2026-06-05",
      dateTo: "2026-06-10",
    }).map((record) => record.id)).toEqual(["income-kai", "expense-fund"]);
  });

  it("sorts by date and amount", () => {
    expect(query({ sort: "oldest" }).map((record) => record.id)).toEqual([
      "expense-archived-category",
      "expense-reimbursed",
      "expense-fund",
      "income-kai",
      "expense-refundable",
    ]);
    expect(query({ sort: "amount_desc" }).map((record) => record.id)[0]).toBe(
      "income-kai",
    );
    expect(query({ sort: "amount_asc" }).map((record) => record.id)[0]).toBe(
      "expense-archived-category",
    );
  });

  it("counts applied filter and sort criteria separately from keyword search", () => {
    expect(recordFilterCount(initialRecordQueryState)).toBe(0);
    expect(recordFilterCount({ ...initialRecordQueryState, search: "Kai" })).toBe(0);
    expect(recordFilterCount({
      ...initialRecordQueryState,
      sort: "amount_desc",
      type: "expense",
    })).toBe(2);
  });
});

function query(patch: Partial<typeof initialRecordQueryState>) {
  return applyRecordQuery(
    records,
    {
      ...initialRecordQueryState,
      ...patch,
    },
  );
}
