import { describe, expect, it, vi } from "vitest";
import {
  buildRefundPagePaymentWhere,
  buildRefundPageUnpaidExpenseWhere,
  loadRefundPageInDatabase,
} from "./refund-page-query";

describe("refund page query", () => {
  it("builds month-scoped unpaid and payment predicates for all members", () => {
    expect(buildRefundPageUnpaidExpenseWhere({
      householdId: "household-demo",
      memberId: "all",
      month: "2026-06",
    })).toEqual({
      householdId: "household-demo",
      status: "active",
      type: "expense",
      paymentSource: "member",
      reimbursementStatus: "refundable",
      occurredOn: {
        gte: new Date("2026-06-01T00:00:00.000Z"),
        lt: new Date("2026-07-01T00:00:00.000Z"),
      },
    });

    expect(buildRefundPagePaymentWhere({
      householdId: "household-demo",
      memberId: "all",
      month: "2026-06",
    })).toEqual({
      householdId: "household-demo",
      paidOn: {
        gte: new Date("2026-06-01T00:00:00.000Z"),
        lt: new Date("2026-07-01T00:00:00.000Z"),
      },
    });
  });

  it("adds payer and paid-to member filters for a member tab", () => {
    expect(buildRefundPageUnpaidExpenseWhere({
      householdId: "household-demo",
      memberId: "member-mei",
      month: "2026-06",
    })).toMatchObject({
      payerMemberId: "member-mei",
    });
    expect(buildRefundPagePaymentWhere({
      householdId: "household-demo",
      memberId: "member-mei",
      month: "2026-06",
    })).toMatchObject({
      paidToMemberId: "member-mei",
    });
  });

  it("loads all household members, unpaid expenses, refund records, and summaries", async () => {
    const prisma = {
      member: {
        findMany: vi.fn(async () => [
          { id: "member-mei", displayName: "Mei" },
          { id: "member-lin", displayName: "Lin" },
        ]),
      },
      category: {
        findMany: vi.fn(async () => [
          {
            id: "expense-grocery",
            type: "expense",
            name: "日用品",
            color: "gold",
            icon: "shopping-cart",
            sortOrder: 10,
            status: "active",
          },
        ]),
      },
      ledgerRecord: {
        findMany: vi.fn(async () => [
          ledgerRecordRow({
            amountCents: 3_200,
            id: "expense-grocery",
            payerMemberId: "member-mei",
          }),
          ledgerRecordRow({
            amountCents: 1_800,
            id: "expense-taxi",
            payerMemberId: "member-lin",
          }),
        ]),
      },
      reimbursementPayment: {
        findMany: vi.fn(async () => [
          reimbursementPaymentRow({
            amountCents: 2_500,
            id: "payment-mei",
            paidToMemberId: "member-mei",
          }),
        ]),
      },
    };

    const result = await loadRefundPageInDatabase({
      householdId: "household-demo",
      memberId: "all",
      month: "2026-06",
      prisma: prisma as never,
    });

    expect(result.members).toEqual([
      { id: "all", name: "全部" },
      { id: "member-mei", name: "Mei" },
      { id: "member-lin", name: "Lin" },
    ]);
    expect(prisma.member.findMany).toHaveBeenCalledWith({
      where: {
        householdId: "household-demo",
      },
      select: {
        id: true,
        displayName: true,
      },
      orderBy: {
        displayName: "asc",
      },
    });
    expect(result.categories).toEqual([
      {
        id: "expense-grocery",
        type: "expense",
        name: "日用品",
        color: "gold",
        icon: "shopping-cart",
        sortOrder: 10,
        status: "active",
      },
    ]);
    expect(result.unpaidExpenses).toMatchObject([
      { id: "expense-grocery", type: "expense", payerMemberId: "member-mei" },
      { id: "expense-taxi", type: "expense", payerMemberId: "member-lin" },
    ]);
    expect(result.refundRecords).toMatchObject([
      {
        id: "payment-mei",
        amountCents: 2_500,
        paidToMemberId: "member-mei",
        paidToMemberName: "Mei",
      },
    ]);
    expect(prisma.ledgerRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ occurredOn: "desc" }, { id: "desc" }],
      }),
    );
    expect(prisma.reimbursementPayment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ paidOn: "desc" }, { id: "desc" }],
      }),
    );
  });
});

function ledgerRecordRow({
  amountCents,
  id,
  payerMemberId,
}: {
  amountCents: number;
  id: string;
  payerMemberId: string;
}) {
  return {
    id,
    type: "expense" as const,
    name: "代墊支出",
    amountCents,
    occurredOn: new Date("2026-06-10T00:00:00.000Z"),
    categoryId: "expense-grocery",
    createdByMemberId: payerMemberId,
    sourceMemberId: null,
    paymentSource: "member" as const,
    payerMemberId,
    reimbursementStatus: "refundable" as const,
    status: "active" as const,
    note: null,
  };
}

function reimbursementPaymentRow({
  amountCents,
  id,
  paidToMemberId,
}: {
  amountCents: number;
  id: string;
  paidToMemberId: string;
}) {
  return {
    id,
    reimbursementBatchId: `${id}-batch`,
    amountCents,
    paidOn: new Date("2026-06-18T00:00:00.000Z"),
    paidToMemberId,
    method: "bank_transfer" as const,
    note: "六月退款",
    paidToMember: {
      displayName: "Mei",
    },
    reimbursementBatch: {
      items: [
        {
          ledgerRecord: {
            ...ledgerRecordRow({
              amountCents,
              id: `${id}-expense`,
              payerMemberId: paidToMemberId,
            }),
            reimbursementStatus: "reimbursed" as const,
          },
        },
      ],
    },
  };
}
