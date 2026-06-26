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
    const ledgerRecordFindMany = vi.fn(async () => [
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
    ]);
    const dataSource = createHomeDashboardDataSource({
      member: { findMany: memberFindMany },
      category: { findMany: categoryFindMany },
      ledgerRecord: { findMany: ledgerRecordFindMany },
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
    });
    expect(ledgerRecordFindMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        householdId: "household-demo",
        occurredOn: {
          gte: new Date("2026-06-01T00:00:00.000Z"),
          lt: new Date("2026-07-01T00:00:00.000Z"),
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
    const dataSource = createHomeDashboardDataSource({
      member: { findMany: memberFindMany },
      category: { findMany: categoryFindMany },
      ledgerRecord: { findMany: ledgerRecordFindMany },
    });

    const data = await dataSource.getSearchPageData("household-demo");

    expect(data.records).toEqual([]);
    expect(ledgerRecordFindMany).not.toHaveBeenCalled();
  });
});
