import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import { markExpensesReimbursedInDatabase } from "./reimbursement-command";

const financeManager: AuthenticatedMember = {
  id: "member-fin",
  googleAccountLinked: true,
  roles: ["finance_manager"],
};

describe("markExpensesReimbursedInDatabase", () => {
  it("writes payment evidence with the reimbursement batch in one transaction", async () => {
    const reimbursedAt = new Date("2026-06-24T08:30:00.000Z");
    const tx = {
      ledgerRecord: {
        findMany: vi.fn(async () => [
          {
            id: "expense-1",
            type: "expense" as const,
            name: "日用品代墊",
            amountCents: 3_200,
            occurredOn: new Date("2026-06-09T00:00:00.000Z"),
            categoryId: "expense-grocery",
            createdByMemberId: "member-mei",
            paymentSource: "member" as const,
            payerMemberId: "member-mei",
            reimbursementStatus: "refundable" as const,
            status: "active" as const,
            note: null,
          },
          {
            id: "expense-2",
            type: "expense" as const,
            name: "停車費代墊",
            amountCents: 800,
            occurredOn: new Date("2026-06-10T00:00:00.000Z"),
            categoryId: "expense-transport",
            createdByMemberId: "member-mei",
            paymentSource: "member" as const,
            payerMemberId: "member-mei",
            reimbursementStatus: "refundable" as const,
            status: "active" as const,
            note: null,
          },
        ]),
        updateMany: vi.fn(async () => undefined),
      },
      reimbursementBatch: {
        create: vi.fn(async () => undefined),
      },
      reimbursementPayment: {
        create: vi.fn(async () => undefined),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    await expect(markExpensesReimbursedInDatabase(financeManager, {
      selectedExpenseIds: ["expense-1", "expense-2"],
    }, {
      householdId: "household-demo",
      prisma: prisma as never,
      generateBatchId: () => "batch-1",
      generatePaymentId: () => "payment-1",
      reimbursedAt,
      payment: {
        method: "bank_transfer",
        paidOn: "2026-06-24",
        note: "末五碼 12345",
      },
    })).resolves.toMatchObject({
      ok: true,
      reimbursedExpenses: [
        { id: "expense-1", reimbursementStatus: "reimbursed" },
        { id: "expense-2", reimbursementStatus: "reimbursed" },
      ],
    });

    expect(tx.reimbursementBatch.create).toHaveBeenCalledWith({
      data: {
        id: "batch-1",
        householdId: "household-demo",
        reimbursedById: "member-fin",
        reimbursedAt,
        items: {
          create: [
            { ledgerRecordId: "expense-1" },
            { ledgerRecordId: "expense-2" },
          ],
        },
      },
    });
    expect(tx.reimbursementPayment.create).toHaveBeenCalledWith({
      data: {
        id: "payment-1",
        householdId: "household-demo",
        reimbursementBatchId: "batch-1",
        paidToMemberId: "member-mei",
        paidFromSource: "household_fund",
        method: "bank_transfer",
        amountCents: 4_000,
        paidOn: new Date("2026-06-24T00:00:00.000Z"),
        note: "末五碼 12345",
        recordedByMemberId: "member-fin",
      },
    });
    expect(tx.ledgerRecord.updateMany).toHaveBeenCalledWith({
      where: {
        householdId: "household-demo",
        id: {
          in: ["expense-1", "expense-2"],
        },
        status: "active",
      },
      data: {
        reimbursementStatus: "reimbursed",
      },
    });
  });
});
