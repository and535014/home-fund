import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  batchMarkLedgerRecordsReimbursedInDatabase,
  markExpensesReimbursedInDatabase,
} from "./reimbursement-command";

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
            updatedAt: new Date("2026-06-09T01:00:00.000Z"),
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
            updatedAt: new Date("2026-06-10T01:00:00.000Z"),
          },
        ]),
        updateMany: vi.fn(async () => ({ count: 2 })),
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
        type: "expense",
        paymentSource: "member",
        reimbursementStatus: "refundable",
        status: "active",
        OR: [
          {
            id: "expense-1",
            updatedAt: new Date("2026-06-09T01:00:00.000Z"),
          },
          {
            id: "expense-2",
            updatedAt: new Date("2026-06-10T01:00:00.000Z"),
          },
        ],
      },
      data: {
        reimbursementStatus: "reimbursed",
      },
    });
    expect(tx.ledgerRecord.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      tx.reimbursementBatch.create.mock.invocationCallOrder[0],
    );
  });

  it("rolls back before writing payment evidence when any record version changed", async () => {
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
            updatedAt: new Date("2026-06-09T01:00:00.000Z"),
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
            updatedAt: new Date("2026-06-10T01:00:00.000Z"),
          },
        ]),
        updateMany: vi.fn(async () => ({ count: 1 })),
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
      payment: {
        method: "cash",
        paidOn: "2026-06-24",
      },
    })).resolves.toEqual({
      ok: false,
      reason: "record_changed",
    });
    expect(tx.reimbursementBatch.create).not.toHaveBeenCalled();
    expect(tx.reimbursementPayment.create).not.toHaveBeenCalled();
  });
});

describe("batchMarkLedgerRecordsReimbursedInDatabase", () => {
  it("validates payment evidence and writes the eligible reimbursement batch", async () => {
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
            sourceMemberId: null,
            paymentSource: "member" as const,
            payerMemberId: "member-mei",
            reimbursementStatus: "refundable" as const,
            status: "active" as const,
            note: null,
            updatedAt: new Date("2026-06-09T01:00:00.000Z"),
          },
          {
            id: "expense-fund",
            type: "expense" as const,
            name: "基金支出",
            amountCents: 1_000,
            occurredOn: new Date("2026-06-10T00:00:00.000Z"),
            categoryId: "expense-grocery",
            createdByMemberId: "member-mei",
            sourceMemberId: null,
            paymentSource: "fund" as const,
            payerMemberId: null,
            reimbursementStatus: "not_refundable" as const,
            status: "active" as const,
            note: null,
            updatedAt: new Date("2026-06-10T01:00:00.000Z"),
          },
        ]),
        updateMany: vi.fn(async () => ({ count: 1 })),
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

    await expect(batchMarkLedgerRecordsReimbursedInDatabase(financeManager, {
      selectedRecordIds: ["expense-1", "expense-fund"],
      requireSinglePayerMember: true,
    }, {
      householdId: "household-demo",
      prisma: prisma as never,
      generateBatchId: () => "batch-1",
      generatePaymentId: () => "payment-1",
      reimbursedAt,
      payment: {
        method: "cash",
        paidOn: "2026-06-24",
        note: "現金交付",
      },
    })).resolves.toMatchObject({
      ok: true,
      reimbursedRecords: [
        { id: "expense-1", reimbursementStatus: "reimbursed" },
      ],
      skippedRecords: [
        { recordId: "expense-fund", reason: "fund_paid_expense" },
      ],
      refundTotalCents: 3_200,
    });

    expect(tx.reimbursementPayment.create).toHaveBeenCalledWith({
      data: {
        id: "payment-1",
        householdId: "household-demo",
        reimbursementBatchId: "batch-1",
        paidToMemberId: "member-mei",
        paidFromSource: "household_fund",
        method: "cash",
        amountCents: 3_200,
        paidOn: new Date("2026-06-24T00:00:00.000Z"),
        note: "現金交付",
        recordedByMemberId: "member-fin",
      },
    });
    expect(tx.ledgerRecord.updateMany).toHaveBeenCalledWith({
      where: {
        householdId: "household-demo",
        type: "expense",
        paymentSource: "member",
        reimbursementStatus: "refundable",
        status: "active",
        OR: [
          {
            id: "expense-1",
            updatedAt: new Date("2026-06-09T01:00:00.000Z"),
          },
        ],
      },
      data: {
        reimbursementStatus: "reimbursed",
      },
    });
  });

  it("rejects invalid payment evidence before opening a transaction", async () => {
    const prisma = {
      $transaction: vi.fn(),
    };

    await expect(batchMarkLedgerRecordsReimbursedInDatabase(financeManager, {
      selectedRecordIds: ["expense-1"],
    }, {
      householdId: "household-demo",
      prisma: prisma as never,
      payment: {
        method: "",
        paidOn: "",
      },
    })).resolves.toEqual({
      ok: false,
      reason: "missing_payment_method",
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
