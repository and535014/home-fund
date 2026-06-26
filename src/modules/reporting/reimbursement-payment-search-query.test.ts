import { describe, expect, it, vi } from "vitest";
import {
  buildReimbursementPaymentSearchPageQuery,
  cursorFromReimbursementPayment,
  initialReimbursementPaymentQueryState,
  isInitialReimbursementPaymentQuery,
  loadReimbursementPaymentSearchPageInDatabase,
  REIMBURSEMENT_PAYMENT_PAGE_SIZE,
} from "./reimbursement-payment-search-query";

describe("reimbursement payment search query", () => {
  it("detects whether reimbursement payment search has not started", () => {
    expect(isInitialReimbursementPaymentQuery(initialReimbursementPaymentQueryState)).toBe(true);
    expect(isInitialReimbursementPaymentQuery({
      ...initialReimbursementPaymentQueryState,
      search: "網路費",
    })).toBe(false);
    expect(isInitialReimbursementPaymentQuery({
      ...initialReimbursementPaymentQueryState,
      paidToMemberId: "member-mei",
    })).toBe(false);
  });

  it("builds a page query with page size plus one and stable newest ordering", () => {
    expect(buildReimbursementPaymentSearchPageQuery({
      householdId: "household-demo",
      query: {
        ...initialReimbursementPaymentQueryState,
        search: "退款紀錄",
      },
    })).toMatchObject({
      take: REIMBURSEMENT_PAYMENT_PAGE_SIZE + 1,
      where: {
        householdId: "household-demo",
      },
      orderBy: [{ paidOn: "desc" }, { id: "desc" }],
    });
  });

  it("maps recipient, payment date range, keyword, and amount sort cursor", () => {
    expect(buildReimbursementPaymentSearchPageQuery({
      householdId: "household-demo",
      query: {
        ...initialReimbursementPaymentQueryState,
        paidToMemberId: "member-mei",
        dateFrom: "2026-06-01",
        dateTo: "2026-06-30",
        search: "銀行轉帳",
        sort: "amount_desc",
      },
      cursor: {
        id: "payment-100",
        paidOn: "2026-06-10",
        amountCents: 3_200,
      },
    })).toMatchObject({
      take: REIMBURSEMENT_PAYMENT_PAGE_SIZE + 1,
      where: {
        householdId: "household-demo",
        paidToMemberId: "member-mei",
        paidOn: {
          gte: new Date("2026-06-01T00:00:00.000Z"),
          lte: new Date("2026-06-30T00:00:00.000Z"),
        },
        AND: [
          {
            OR: [
              { paidToMember: { displayName: { contains: "銀行轉帳", mode: "insensitive" } } },
              { note: { contains: "銀行轉帳", mode: "insensitive" } },
              {
                reimbursementBatch: {
                  items: {
                    some: {
                      ledgerRecord: {
                        name: { contains: "銀行轉帳", mode: "insensitive" },
                      },
                    },
                  },
                },
              },
              { method: "bank_transfer" },
            ],
          },
          {
            OR: [
              { amountCents: { lt: 3_200 } },
              {
                amountCents: 3_200,
                paidOn: { lt: new Date("2026-06-10T00:00:00.000Z") },
              },
              {
                amountCents: 3_200,
                paidOn: new Date("2026-06-10T00:00:00.000Z"),
                id: { lt: "payment-100" },
              },
            ],
          },
        ],
      },
      orderBy: [
        { amountCents: "desc" },
        { paidOn: "desc" },
        { id: "desc" },
      ],
    });
  });

  it("matches searchable payment evidence fields", () => {
    expect(buildReimbursementPaymentSearchPageQuery({
      householdId: "household-demo",
      query: {
        ...initialReimbursementPaymentQueryState,
        search: "餐費",
      },
    }).where).toMatchObject({
      OR: [
        { paidToMember: { displayName: { contains: "餐費", mode: "insensitive" } } },
        { note: { contains: "餐費", mode: "insensitive" } },
        {
          reimbursementBatch: {
            items: {
              some: {
                ledgerRecord: {
                  name: { contains: "餐費", mode: "insensitive" },
                },
              },
            },
          },
        },
      ],
    });

    expect(buildReimbursementPaymentSearchPageQuery({
      householdId: "household-demo",
      query: {
        ...initialReimbursementPaymentQueryState,
        search: "680",
      },
    }).where).toMatchObject({
      OR: expect.arrayContaining([{ amountCents: 68_000 }]),
    });

    expect(buildReimbursementPaymentSearchPageQuery({
      householdId: "household-demo",
      query: {
        ...initialReimbursementPaymentQueryState,
        search: "2026/06/10",
      },
    }).where).toMatchObject({
      OR: expect.arrayContaining([
        { paidOn: new Date("2026-06-10T00:00:00.000Z") },
      ]),
    });
  });

  it("maps oldest cursor and cursor payload from a reimbursement payment", () => {
    expect(buildReimbursementPaymentSearchPageQuery({
      householdId: "household-demo",
      query: {
        ...initialReimbursementPaymentQueryState,
        sort: "oldest",
      },
      cursor: {
        id: "payment-100",
        paidOn: "2026-06-10",
      },
    })).toMatchObject({
      where: {
        OR: [
          { paidOn: { gt: new Date("2026-06-10T00:00:00.000Z") } },
          {
            paidOn: new Date("2026-06-10T00:00:00.000Z"),
            id: { gt: "payment-100" },
          },
        ],
      },
      orderBy: [{ paidOn: "asc" }, { id: "asc" }],
    });

    expect(cursorFromReimbursementPayment({
      id: "payment-100",
      paidOn: "2026-06-10",
      amountCents: 3_200,
    })).toEqual({
      id: "payment-100",
      paidOn: "2026-06-10",
      amountCents: 3_200,
    });
  });

  it("loads payment search page metadata and mapped payment evidence", async () => {
    const prisma = {
      reimbursementPayment: {
        findMany: vi.fn(async () => [
          reimbursementPaymentRow({
            id: "payment-1",
            ledgerRecordId: "expense-1",
            ledgerRecordName: "網路費代墊",
          }),
        ]),
        count: vi.fn(async () => 1),
        aggregate: vi.fn(async () => ({
          _sum: {
            amountCents: 4_500,
          },
        })),
      },
    };

    await expect(loadReimbursementPaymentSearchPageInDatabase({
      householdId: "household-demo",
      prisma: prisma as never,
      query: initialReimbursementPaymentQueryState,
    })).resolves.toMatchObject({
      records: [
        {
          id: "payment-1",
          primaryLinkedRecordName: "網路費代墊",
          paidToMemberName: "小美",
          methodLabel: "銀行轉帳",
        },
      ],
      nextCursor: null,
      totalCount: 1,
      totalAmountCents: 4_500,
    });
    expect(prisma.reimbursementPayment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: REIMBURSEMENT_PAYMENT_PAGE_SIZE + 1,
        where: { householdId: "household-demo" },
        orderBy: [{ paidOn: "desc" }, { id: "desc" }],
      }),
    );
  });
});

function reimbursementPaymentRow({
  id,
  ledgerRecordId,
  ledgerRecordName,
}: {
  id: string;
  ledgerRecordId: string;
  ledgerRecordName: string;
}) {
  return {
    id,
    reimbursementBatchId: `batch-${id}`,
    amountCents: 128_000,
    paidOn: new Date("2026-06-18T00:00:00.000Z"),
    paidToMemberId: "member-mei",
    method: "bank_transfer" as const,
    note: "末五碼 5521",
    paidToMember: {
      displayName: "小美",
    },
    reimbursementBatch: {
      items: [
        {
          ledgerRecord: {
            id: ledgerRecordId,
            type: "expense" as const,
            name: ledgerRecordName,
            amountCents: 128_000,
            occurredOn: new Date("2026-06-15T00:00:00.000Z"),
            categoryId: "expense-utilities",
            createdByMemberId: "member-mei",
            sourceMemberId: null,
            paymentSource: "member" as const,
            payerMemberId: "member-mei",
            reimbursementStatus: "reimbursed" as const,
            status: "active" as const,
            note: "退款紀錄關聯紀錄",
          },
        },
      ],
    },
  };
}
