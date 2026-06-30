import { describe, expect, it, vi } from "vitest";
import { createHomeDashboardDataSource } from "./home-dashboard-data-source";

describe("createHomeDashboardDataSource", () => {
  it("loads dashboard data for the selected month", async () => {
    const memberFindMany = vi.fn(async () => [
      {
        id: "member-fin",
        householdId: "household-demo",
        displayName: "Lin",
        avatarUrl: "https://example.com/lin.png",
        googleAccountEmail: "lin@example.com",
        googleSubject: "google-lin",
        status: "active" as const,
        roles: [{ role: "finance_manager" as const }],
        capabilities: [{ capability: "manage_categories" as const }],
      },
    ]);
    const categoryFindMany = vi.fn(async () => [
      {
        id: "expense-grocery",
        type: "expense" as const,
        name: "日用品",
        color: "gold" as const,
        icon: "shopping-cart" as const,
        sortOrder: 10,
        status: "active" as const,
      },
    ]);
    const ledgerRecordFindMany = vi
      .fn()
      .mockResolvedValueOnce([
        {
          id: "expense-grocery-june",
          type: "expense" as const,
          name: "日用品代墊",
          amountCents: 642_000,
          occurredOn: new Date("2026-06-09T00:00:00.000Z"),
          categoryId: "expense-grocery",
          createdByMemberId: "member-fin",
          sourceMemberId: null,
          paymentSource: "member" as const,
          payerMemberId: "member-fin",
          reimbursementStatus: "refundable" as const,
          status: "active" as const,
          note: "日用品代墊",
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "income-january",
          type: "income" as const,
          name: "年初收入",
          amountCents: 10_000,
          occurredOn: new Date("2026-01-05T00:00:00.000Z"),
          categoryId: "income-living",
          createdByMemberId: "member-fin",
          sourceMemberId: "member-fin",
          paymentSource: null,
          payerMemberId: null,
          reimbursementStatus: "not_applicable" as const,
          status: "active" as const,
          note: "年初收入",
        },
      ]);
    const recurringOccurrenceFindMany = vi.fn(async () => [
      {
        id: "occurrence-rent-2026-06",
        targetDate: new Date("2026-06-01T00:00:00.000Z"),
        recurringRule: {
          amountCents: 1_800_000,
          categoryId: "income-rent",
          createdByMemberId: "member-fin",
          dayOfMonth: 1,
          name: "房租收入",
          payerMemberId: null,
          paymentSource: null,
          postingMode: "reminder" as const,
          scheduleAnchor: "fixed_day" as const,
          sourceMemberId: "member-fin",
          type: "income" as const,
        },
      },
    ]);
    const dataSource = createHomeDashboardDataSource({
      member: { findMany: memberFindMany },
      category: { findMany: categoryFindMany },
      ledgerRecord: { findMany: ledgerRecordFindMany },
      recurringOccurrence: { findMany: recurringOccurrenceFindMany },
    });

    await expect(
      dataSource.getMonthlyDashboardData("household-demo", "2026-06"),
    ).resolves.toEqual({
      householdMembers: [
        {
          id: "member-fin",
          householdId: "household-demo",
          displayName: "Lin",
          avatarUrl: "https://example.com/lin.png",
          googleAccountEmail: "lin@example.com",
          googleSubject: "google-lin",
          status: "active",
          roles: ["finance_manager"],
          capabilities: ["manage_categories"],
        },
      ],
      categories: [
        {
          id: "expense-grocery",
          type: "expense",
          name: "日用品",
          color: "gold",
          icon: "shopping-cart",
          sortOrder: 10,
          status: "active",
        },
      ],
      pendingRecurringRecords: [
        {
          id: "recurring-occurrence:occurrence-rent-2026-06",
          recurringOccurrenceId: "occurrence-rent-2026-06",
          recurringEventLabel: "每月 1 號，提醒入帳",
          type: "income",
          name: "房租收入",
          amountCents: 1_800_000,
          occurredOn: "2026-06-01",
          categoryId: "income-rent",
          createdByMemberId: "member-fin",
          sourceMemberId: "member-fin",
          reimbursementStatus: "not_applicable",
          status: "active",
        },
      ],
      records: [
        {
          id: "expense-grocery-june",
          type: "expense",
          name: "日用品代墊",
          amountCents: 642_000,
          occurredOn: "2026-06-09",
          categoryId: "expense-grocery",
          createdByMemberId: "member-fin",
          paymentSource: "member",
          payerMemberId: "member-fin",
          reimbursementStatus: "refundable",
          status: "active",
          note: "日用品代墊",
        },
      ],
      yearlyRecords: [
        {
          id: "income-january",
          type: "income",
          name: "年初收入",
          amountCents: 10_000,
          occurredOn: "2026-01-05",
          categoryId: "income-living",
          createdByMemberId: "member-fin",
          sourceMemberId: "member-fin",
          reimbursementStatus: "not_applicable",
          status: "active",
          note: "年初收入",
        },
      ],
    });
    expect(ledgerRecordFindMany).toHaveBeenNthCalledWith(1, expect.objectContaining({
      where: {
        householdId: "household-demo",
        occurredOn: {
          gte: new Date("2026-06-01T00:00:00.000Z"),
          lt: new Date("2026-07-01T00:00:00.000Z"),
        },
        status: "active",
      },
    }));
    expect(ledgerRecordFindMany).toHaveBeenNthCalledWith(2, expect.objectContaining({
      where: {
        householdId: "household-demo",
        occurredOn: {
          gte: new Date("2026-01-01T00:00:00.000Z"),
          lt: new Date("2027-01-01T00:00:00.000Z"),
        },
        status: "active",
      },
    }));
    expect(categoryFindMany).toHaveBeenCalledWith({
      where: {
        householdId: "household-demo",
      },
      select: {
        id: true,
        type: true,
        name: true,
        color: true,
        icon: true,
        sortOrder: true,
        status: true,
      },
      orderBy: [{ type: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
    });
    expect(recurringOccurrenceFindMany).toHaveBeenCalledWith({
      include: { recurringRule: true },
      orderBy: [{ targetDate: "asc" }, { createdAt: "asc" }],
      where: {
        householdId: "household-demo",
        month: "2026-06",
        status: "pending",
        recurringRule: {
          active: true,
          deletedAt: null,
          postingMode: "reminder",
        },
      },
    });
  });

  it("loads lookup data only for the search page", async () => {
    const memberFindMany = vi.fn(async () => [
      {
        id: "member-fin",
        householdId: "household-demo",
        displayName: "Lin",
        avatarUrl: null,
        googleAccountEmail: "lin@example.com",
        googleSubject: "google-lin",
        status: "active" as const,
        roles: [{ role: "finance_manager" as const }],
        capabilities: [],
      },
    ]);
    const categoryFindMany = vi.fn(async () => [
      {
        id: "expense-grocery",
        type: "expense" as const,
        name: "日用品",
        color: "gold" as const,
        icon: "shopping-cart" as const,
        sortOrder: 10,
        status: "active" as const,
      },
    ]);
    const ledgerRecordFindMany = vi.fn(async () => []);
    const recurringOccurrenceFindMany = vi.fn(async () => []);
    const dataSource = createHomeDashboardDataSource({
      member: { findMany: memberFindMany },
      category: { findMany: categoryFindMany },
      ledgerRecord: { findMany: ledgerRecordFindMany },
      recurringOccurrence: { findMany: recurringOccurrenceFindMany },
    });

    const data = await dataSource.getSearchPageData("household-demo");

    expect(data.pendingRecurringRecords).toEqual([]);
    expect(data.records).toEqual([]);
    expect(data.yearlyRecords).toEqual([]);
    expect(ledgerRecordFindMany).not.toHaveBeenCalled();
    expect(recurringOccurrenceFindMany).not.toHaveBeenCalled();
  });
});
