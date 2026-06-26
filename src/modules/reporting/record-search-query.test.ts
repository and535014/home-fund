import { describe, expect, it, vi } from "vitest";
import { initialRecordQueryState } from "@/modules/reporting/record-query";
import {
  buildRecordSearchPageQuery,
  calculateRecordSearchNetTotal,
  loadRecordSearchPageInDatabase,
  SEARCH_RECORD_PAGE_SIZE,
} from "./record-search-query";

describe("record search query", () => {
  it("builds a page query with page size plus one and stable newest ordering", () => {
    expect(buildRecordSearchPageQuery({
      householdId: "household-demo",
      query: {
        ...initialRecordQueryState,
        search: "80,000",
      },
    })).toMatchObject({
      take: SEARCH_RECORD_PAGE_SIZE + 1,
      where: {
        householdId: "household-demo",
        status: "active",
        AND: [
          {
            OR: [
              { name: { contains: "80,000", mode: "insensitive" } },
              { amountCents: 8_000_000 },
            ],
          },
        ],
      },
      orderBy: [{ occurredOn: "desc" }, { id: "desc" }],
    });
  });

  it("maps filters and amount sort cursor to Prisma-shaped predicates", () => {
    expect(buildRecordSearchPageQuery({
      householdId: "household-demo",
      query: {
        ...initialRecordQueryState,
        type: "expense",
        categoryId: "expense-grocery",
        participant: "member:member-mei",
        reimbursementStatus: "unrefunded",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-30",
        sort: "amount_desc",
      },
      cursor: {
        id: "record-100",
        occurredOn: "2026-06-10",
        amountCents: 3_200,
      },
    })).toMatchObject({
      where: {
        AND: [
          {
            householdId: "household-demo",
            status: "active",
            AND: [
              { type: "expense" },
              { categoryId: "expense-grocery" },
              { paymentSource: "member", payerMemberId: "member-mei" },
              {
                type: "expense",
                paymentSource: "member",
                reimbursementStatus: "refundable",
              },
              {
                occurredOn: {
                  gte: new Date("2026-06-01T00:00:00.000Z"),
                  lte: new Date("2026-06-30T00:00:00.000Z"),
                },
              },
            ],
          },
          {
            OR: [
              { amountCents: { lt: 3_200 } },
              {
                amountCents: 3_200,
                occurredOn: { lt: new Date("2026-06-10T00:00:00.000Z") },
              },
              {
                amountCents: 3_200,
                occurredOn: new Date("2026-06-10T00:00:00.000Z"),
                id: { lt: "record-100" },
              },
            ],
          },
        ],
      },
      orderBy: [
        { amountCents: "desc" },
        { occurredOn: "desc" },
        { id: "desc" },
      ],
    });
  });

  it("keeps mutually exclusive income and reimbursement filters impossible", () => {
    expect(buildRecordSearchPageQuery({
      householdId: "household-demo",
      query: {
        ...initialRecordQueryState,
        type: "income",
        reimbursementStatus: "refunded",
      },
    })).toMatchObject({
      where: {
        householdId: "household-demo",
        status: "active",
        AND: [
          { type: "income" },
          {
            type: "expense",
            paymentSource: "member",
            reimbursementStatus: "reimbursed",
          },
        ],
      },
    });
  });

  it("combines date range, keyword search, and cursor as AND conditions", () => {
    expect(buildRecordSearchPageQuery({
      householdId: "household-demo",
      query: {
        ...initialRecordQueryState,
        dateFrom: "2026-06-01",
        dateTo: "2026-06-30",
        search: "房租",
      },
      cursor: {
        id: "record-200",
        occurredOn: "2026-06-15",
      },
    })).toMatchObject({
      where: {
        AND: [
          {
            householdId: "household-demo",
            status: "active",
            AND: [
              {
                occurredOn: {
                  gte: new Date("2026-06-01T00:00:00.000Z"),
                  lte: new Date("2026-06-30T00:00:00.000Z"),
                },
              },
              {
                OR: [
                  { name: { contains: "房租", mode: "insensitive" } },
                ],
              },
            ],
          },
          {
            OR: [
              { occurredOn: { lt: new Date("2026-06-15T00:00:00.000Z") } },
              {
                occurredOn: new Date("2026-06-15T00:00:00.000Z"),
                id: { lt: "record-200" },
              },
            ],
          },
        ],
      },
    });
  });

  it("calculates signed net totals from grouped type sums", () => {
    expect(calculateRecordSearchNetTotal([
      { type: "income", _sum: { amountCents: 120_000 } },
      { type: "expense", _sum: { amountCents: 45_000 } },
    ])).toBe(75_000);

    expect(calculateRecordSearchNetTotal([
      { type: "expense", _sum: { amountCents: 45_000 } },
    ])).toBe(-45_000);
  });

  it("loads a page with records, cursor, count, and signed net total", async () => {
    const prisma = {
      ledgerRecord: {
        findMany: vi.fn(async () => [
          ledgerRecordRow({ id: "income-1", type: "income", amountCents: 120_000 }),
          ledgerRecordRow({ id: "expense-1", type: "expense", amountCents: 45_000 }),
          ...Array.from({ length: SEARCH_RECORD_PAGE_SIZE - 1 }, (_, index) =>
            ledgerRecordRow({
              id: `expense-extra-${index}`,
              type: "expense",
              amountCents: 8_000,
            }),
          ),
        ]),
        count: vi.fn(async () => 3),
        groupBy: vi.fn(async () => [
          { type: "income" as const, _sum: { amountCents: 120_000 } },
          { type: "expense" as const, _sum: { amountCents: 53_000 } },
        ]),
      },
    };

    const result = await loadRecordSearchPageInDatabase({
      householdId: "household-demo",
      prisma: prisma as never,
      query: initialRecordQueryState,
    });

    expect(result.records).toHaveLength(SEARCH_RECORD_PAGE_SIZE);
    expect(result.records.slice(0, 2)).toMatchObject([
      { id: "income-1", type: "income", sourceMemberId: "member-mei" },
      { id: "expense-1", type: "expense", paymentSource: "member" },
    ]);
    expect(result).toMatchObject({
      nextCursor: { id: "expense-extra-97", occurredOn: "2026-06-10", amountCents: 8_000 },
      totalCount: 3,
      totalNetAmountCents: 67_000,
    });
    expect(prisma.ledgerRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: SEARCH_RECORD_PAGE_SIZE + 1,
        where: { householdId: "household-demo", status: "active" },
        orderBy: [{ occurredOn: "desc" }, { id: "desc" }],
      }),
    );
  });
});

function ledgerRecordRow({
  amountCents,
  id,
  type,
}: {
  amountCents: number;
  id: string;
  type: "income" | "expense";
}) {
  return {
    id,
    type,
    name: type === "income" ? "房租" : "日用品",
    amountCents,
    occurredOn: new Date("2026-06-10T00:00:00.000Z"),
    categoryId: type === "income" ? "income-rent" : "expense-grocery",
    createdByMemberId: "member-mei",
    sourceMemberId: type === "income" ? "member-mei" : null,
    paymentSource: type === "expense" ? "member" as const : null,
    payerMemberId: type === "expense" ? "member-mei" : null,
    reimbursementStatus: type === "expense" ? "refundable" as const : "not_applicable" as const,
    status: "active" as const,
    note: null,
  };
}
