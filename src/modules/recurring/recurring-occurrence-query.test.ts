import { describe, expect, it, vi } from "vitest";
import {
  filterPendingRecurringOccurrenceRecords,
  loadPendingRecurringOccurrenceRecordsForSearch,
  loadPendingRecurringOccurrenceRecordsForMonth,
  pendingRecurringRecordId,
} from "./recurring-occurrence-query";

describe("loadPendingRecurringOccurrenceRecordsForMonth", () => {
  it("loads reminder pending occurrences as ledger-compatible records", async () => {
    const findMany = vi.fn(async () => [
      {
        id: "occurrence-rent-2026-07",
        targetDate: new Date("2026-07-01T00:00:00.000Z"),
        recurringRule: {
          amountCents: 1_800_000,
          categoryId: "income-rent",
          createdByMemberId: "member-admin",
          name: "成員 A 房租收入",
          payerMemberId: null,
          paymentSource: null,
          sourceMemberId: "member-a",
          type: "income" as const,
        },
      },
      {
        id: "occurrence-maintenance-2026-07",
        targetDate: new Date("2026-07-31T00:00:00.000Z"),
        recurringRule: {
          amountCents: 320_000,
          categoryId: "expense-maintenance",
          createdByMemberId: "member-admin",
          name: "月底管理費",
          payerMemberId: "member-b",
          paymentSource: "member" as const,
          sourceMemberId: null,
          type: "expense" as const,
        },
      },
    ]);

    await expect(
      loadPendingRecurringOccurrenceRecordsForMonth({
        householdId: "household-demo",
        month: "2026-07",
        prisma: { recurringOccurrence: { findMany } },
      }),
    ).resolves.toMatchObject([
      {
        amountCents: 1_800_000,
        categoryId: "income-rent",
        id: "recurring-occurrence:occurrence-rent-2026-07",
        name: "成員 A 房租收入",
        occurredOn: "2026-07-01",
        recurringOccurrenceId: "occurrence-rent-2026-07",
        reimbursementStatus: "not_applicable",
        sourceMemberId: "member-a",
        status: "active",
        type: "income",
      },
      {
        amountCents: 320_000,
        categoryId: "expense-maintenance",
        id: "recurring-occurrence:occurrence-maintenance-2026-07",
        name: "月底管理費",
        occurredOn: "2026-07-31",
        payerMemberId: "member-b",
        paymentSource: "member",
        reimbursementStatus: "not_refundable",
        status: "active",
        type: "expense",
      },
    ]);
    expect(findMany).toHaveBeenCalledWith({
      include: { recurringRule: true },
      orderBy: [{ targetDate: "asc" }, { createdAt: "asc" }],
      where: {
        householdId: "household-demo",
        month: "2026-07",
        status: "pending",
        recurringRule: {
          active: true,
          deletedAt: null,
          postingMode: "reminder",
        },
      },
    });
  });
});

describe("loadPendingRecurringOccurrenceRecordsForSearch", () => {
  it("loads pending occurrences and applies ordinary search filters", async () => {
    const findMany = vi.fn(async () => [
      {
        id: "occurrence-rent-2026-07",
        targetDate: new Date("2026-07-01T00:00:00.000Z"),
        recurringRule: {
          amountCents: 1_800_000,
          categoryId: "income-rent",
          createdByMemberId: "member-admin",
          name: "成員 A 房租收入",
          payerMemberId: null,
          paymentSource: null,
          sourceMemberId: "member-a",
          type: "income" as const,
        },
      },
      {
        id: "occurrence-network-2026-07",
        targetDate: new Date("2026-07-15T00:00:00.000Z"),
        recurringRule: {
          amountCents: 129_900,
          categoryId: "expense-network",
          createdByMemberId: "member-admin",
          name: "網路費",
          payerMemberId: "member-b",
          paymentSource: "member" as const,
          sourceMemberId: null,
          type: "expense" as const,
        },
      },
    ]);

    const records = await loadPendingRecurringOccurrenceRecordsForSearch({
      householdId: "household-demo",
      prisma: { recurringOccurrence: { findMany } },
      query: {
        categoryId: "all",
        dateFrom: "2026-07-01",
        dateTo: "2026-07-31",
        participant: "member:member-a",
        reimbursementStatus: "all",
        search: "房租",
        sort: "newest",
        type: "income",
      },
    });

    expect(records.map((record) => record.id)).toEqual([
      "recurring-occurrence:occurrence-rent-2026-07",
    ]);
    expect(findMany).toHaveBeenCalledWith({
      include: { recurringRule: true },
      orderBy: [{ targetDate: "asc" }, { createdAt: "asc" }],
      where: {
        householdId: "household-demo",
        status: "pending",
        targetDate: {
          gte: new Date("2026-07-01T00:00:00.000Z"),
          lte: new Date("2026-07-31T00:00:00.000Z"),
        },
        recurringRule: {
          active: true,
          deletedAt: null,
          postingMode: "reminder",
        },
      },
    });
  });
});

describe("filterPendingRecurringOccurrenceRecords", () => {
  it("uses normal record search filters for pending occurrence records", () => {
    const records = [
      {
        amountCents: 1_800_000,
        categoryId: "income-rent",
        createdByMemberId: "member-admin",
        id: pendingRecurringRecordId("occurrence-rent"),
        name: "成員 A 房租收入",
        occurredOn: "2026-07-01",
        recurringOccurrenceId: "occurrence-rent",
        reimbursementStatus: "not_applicable" as const,
        sourceMemberId: "member-a",
        status: "active" as const,
        type: "income" as const,
      },
    ];

    expect(filterPendingRecurringOccurrenceRecords(records, {
      categoryId: "all",
      dateFrom: "2026-07-01",
      dateTo: "2026-07-31",
      participant: "member:member-a",
      reimbursementStatus: "all",
      search: "房租",
      sort: "newest",
      type: "income",
    })).toHaveLength(1);
    expect(filterPendingRecurringOccurrenceRecords(records, {
      categoryId: "all",
      dateFrom: "",
      dateTo: "",
      participant: "member:member-b",
      reimbursementStatus: "all",
      search: "",
      sort: "newest",
      type: "all",
    })).toHaveLength(0);
  });
});
