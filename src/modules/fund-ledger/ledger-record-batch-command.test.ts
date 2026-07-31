import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import { batchDeleteLedgerRecordsInDatabase } from "./ledger-record-batch-command";
import { LedgerRecordMutationConflictError } from "./ledger-record-command";

const admin: AuthenticatedMember = {
  id: "member-admin",
  googleAccountLinked: true,
  roles: ["admin"],
};

describe("batchDeleteLedgerRecordsInDatabase", () => {
  it("voids eligible records and increments their persisted versions atomically", async () => {
    const tx = {
      ledgerRecord: {
        findMany: vi.fn(async () => [
          ledgerRecordRow({
            id: "expense-1",
            updatedAt: new Date("2026-07-02T01:00:00.000Z"),
          }),
          ledgerRecordRow({
            id: "expense-2",
            updatedAt: new Date("2026-07-02T02:00:00.000Z"),
          }),
        ]),
        updateMany: vi.fn(async () => ({ count: 2 })),
      },
    };
    const transaction = vi.fn(async <T>(
      callback: (transaction: typeof tx) => Promise<T>,
    ) => callback(tx));
    const prisma = { $transaction: transaction };

    await expect(batchDeleteLedgerRecordsInDatabase(admin, {
      selectedRecordIds: ["expense-1", "expense-2"],
    }, {
      householdId: "household-demo",
      prisma: prisma as never,
    })).resolves.toMatchObject({
      ok: true,
      processedRecords: [
        { id: "expense-1", status: "voided" },
        { id: "expense-2", status: "voided" },
      ],
    });
    expect(transaction).toHaveBeenCalledOnce();
    expect(tx.ledgerRecord.findMany).toHaveBeenCalledWith({
      where: {
        householdId: "household-demo",
        id: { in: ["expense-1", "expense-2"] },
      },
      select: expect.objectContaining({
        updatedAt: true,
        version: true,
      }),
    });
    expect(tx.ledgerRecord.updateMany).toHaveBeenCalledWith({
      where: {
        householdId: "household-demo",
        status: "active",
        OR: [
          {
            id: "expense-1",
            updatedAt: new Date("2026-07-02T01:00:00.000Z"),
          },
          {
            id: "expense-2",
            updatedAt: new Date("2026-07-02T02:00:00.000Z"),
          },
        ],
      },
      data: {
        status: "voided",
        version: { increment: 1 },
      },
    });
  });

  it("rejects the transaction when any conditional update misses", async () => {
    const tx = {
      ledgerRecord: {
        findMany: vi.fn(async () => [
          ledgerRecordRow({
            id: "expense-1",
            updatedAt: new Date("2026-07-02T01:00:00.000Z"),
          }),
          ledgerRecordRow({
            id: "expense-2",
            updatedAt: new Date("2026-07-02T02:00:00.000Z"),
          }),
        ]),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
    };
    const transaction = vi.fn(async <T>(
      callback: (transaction: typeof tx) => Promise<T>,
    ) => callback(tx));
    const prisma = { $transaction: transaction };

    await expect(batchDeleteLedgerRecordsInDatabase(admin, {
      selectedRecordIds: ["expense-1", "expense-2"],
    }, {
      householdId: "household-demo",
      prisma: prisma as never,
    })).rejects.toBeInstanceOf(LedgerRecordMutationConflictError);
  });
});

function ledgerRecordRow({ id, updatedAt }: { id: string; updatedAt: Date }) {
  return {
    id,
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
    version: 4,
    updatedAt,
  };
}
