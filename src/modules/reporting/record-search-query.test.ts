import { describe, expect, it } from "vitest";
import { initialRecordQueryState } from "@/modules/reporting/record-query";
import {
  buildRecordSearchPageQuery,
  calculateRecordSearchNetTotal,
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
        OR: [
          { name: { contains: "80,000", mode: "insensitive" } },
          { amountCents: 8_000_000 },
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
            type: "expense",
            categoryId: "expense-grocery",
            paymentSource: "member",
            payerMemberId: "member-mei",
            AND: [
              {
                type: "expense",
                paymentSource: "member",
                reimbursementStatus: "refundable",
              },
            ],
            occurredOn: {
              gte: new Date("2026-06-01T00:00:00.000Z"),
              lte: new Date("2026-06-30T00:00:00.000Z"),
            },
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
        type: "income",
        AND: [
          {
            type: "expense",
            paymentSource: "member",
            reimbursementStatus: "reimbursed",
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
});
