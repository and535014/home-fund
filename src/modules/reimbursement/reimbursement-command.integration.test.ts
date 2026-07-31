import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createPrismaClient } from "@/db/prisma";
import {
  LedgerRecordMutationConflictError,
} from "@/modules/fund-ledger/ledger-record-command";
import {
  mapPrismaExpenseLedgerRecordToExpenseLedgerRecord,
  concurrencyPrismaExpenseLedgerRecordSelect,
} from "@/modules/fund-ledger/ledger-record-prisma-adapter";
import {
  writeReimbursementPaymentSettlement,
} from "./reimbursement-command";

const runIntegration = process.env.RUN_DATABASE_INTEGRATION === "1";
const integrationDescribe = runIntegration ? describe : describe.skip;
const successRecordIds = ["integration-success-expense-1", "integration-success-expense-2"];
const conflictRecordIds = ["integration-conflict-expense-1", "integration-conflict-expense-2"];
const successBatchId = "integration-success-batch";
const successPaymentId = "integration-success-payment";
const conflictBatchId = "integration-conflict-batch";
const conflictPaymentId = "integration-conflict-payment";
const prisma = createPrismaClient(
  process.env.E2E_DATABASE_URL ??
    "postgresql://postgres:postgres@127.0.0.1:5432/home_fund_e2e",
);

integrationDescribe("reimbursement transaction concurrency", () => {
  beforeAll(async () => {
    await cleanupFixtures();
  });

  afterAll(async () => {
    await cleanupFixtures();
    await prisma.$disconnect();
  });

  it("increments every record version before writing reimbursement evidence", async () => {
    const { categoryId, memberId } = await loadFixtureReferences();
    await createExpenseFixtures(successRecordIds, categoryId, memberId);

    const rows = await prisma.ledgerRecord.findMany({
      where: { id: { in: successRecordIds } },
      orderBy: { id: "asc" },
      select: concurrencyPrismaExpenseLedgerRecordSelect,
    });
    expect(rows).toHaveLength(2);

    const result = await prisma.$transaction((tx) =>
      writeReimbursementPaymentSettlement({
        tx,
        householdId: "household-demo",
        actorId: memberId,
        reimbursedRecords: rows.map((row) => ({
          ...mapPrismaExpenseLedgerRecordToExpenseLedgerRecord(row),
          reimbursementStatus: "reimbursed" as const,
        })),
        expectedRecordVersions: rows.map((row) => ({
          id: row.id,
          updatedAt: row.updatedAt,
        })),
        payment: {
          method: "cash",
          paidOn: "2026-06-25",
        },
        generateBatchId: () => successBatchId,
        generatePaymentId: () => successPaymentId,
      })
    );

    expect(result).toEqual({ ok: true, batchId: successBatchId });
    await expect(prisma.ledgerRecord.findMany({
      where: { id: { in: successRecordIds } },
      orderBy: { id: "asc" },
      select: { reimbursementStatus: true, version: true },
    })).resolves.toEqual([
      { reimbursementStatus: "reimbursed", version: rows[0].version + 1 },
      { reimbursementStatus: "reimbursed", version: rows[1].version + 1 },
    ]);
    await expect(prisma.reimbursementPayment.findUnique({
      where: { id: successPaymentId },
      select: { reimbursementBatchId: true },
    })).resolves.toEqual({ reimbursementBatchId: successBatchId });
  });

  it("rolls back a partial record transition before writing evidence", async () => {
    const { categoryId, memberId } = await loadFixtureReferences();
    await createExpenseFixtures(conflictRecordIds, categoryId, memberId);

    const rows = await prisma.ledgerRecord.findMany({
      where: { id: { in: conflictRecordIds } },
      orderBy: { id: "asc" },
      select: concurrencyPrismaExpenseLedgerRecordSelect,
    });
    expect(rows).toHaveLength(2);

    const originalUpdatedAts = rows.map((row) => row.updatedAt);
    const originalVersions = rows.map((row) => row.version);
    const reimbursedRecords = rows.map((row) => ({
      ...mapPrismaExpenseLedgerRecordToExpenseLedgerRecord(row),
      reimbursementStatus: "reimbursed" as const,
    }));

    await expect(prisma.$transaction(async (tx) => {
      await writeReimbursementPaymentSettlement({
        tx,
        householdId: "household-demo",
        actorId: memberId,
        reimbursedRecords,
        expectedRecordVersions: [
          { id: rows[0].id, updatedAt: rows[0].updatedAt },
          {
            id: rows[1].id,
            updatedAt: new Date(rows[1].updatedAt.getTime() - 1),
          },
        ],
        payment: {
          method: "cash",
          paidOn: "2026-06-25",
        },
        generateBatchId: () => conflictBatchId,
        generatePaymentId: () => conflictPaymentId,
      });
    })).rejects.toBeInstanceOf(LedgerRecordMutationConflictError);

    const recordsAfterConflict = await prisma.ledgerRecord.findMany({
      where: { id: { in: conflictRecordIds } },
      orderBy: { id: "asc" },
      select: {
        reimbursementStatus: true,
        updatedAt: true,
        version: true,
      },
    });

    expect(recordsAfterConflict).toEqual([
      {
        reimbursementStatus: "refundable",
        updatedAt: originalUpdatedAts[0],
        version: originalVersions[0],
      },
      {
        reimbursementStatus: "refundable",
        updatedAt: originalUpdatedAts[1],
        version: originalVersions[1],
      },
    ]);
    await expect(prisma.reimbursementBatch.findUnique({
      where: { id: conflictBatchId },
    })).resolves.toBeNull();
    await expect(prisma.reimbursementPayment.findUnique({
      where: { id: conflictPaymentId },
    })).resolves.toBeNull();
  });
});

async function cleanupFixtures() {
  await prisma.reimbursementPayment.deleteMany({
    where: { id: { in: [successPaymentId, conflictPaymentId] } },
  });
  await prisma.reimbursementBatch.deleteMany({
    where: { id: { in: [successBatchId, conflictBatchId] } },
  });
  await prisma.ledgerRecord.deleteMany({
    where: { id: { in: [...successRecordIds, ...conflictRecordIds] } },
  });
}

async function loadFixtureReferences() {
  const [category, member] = await Promise.all([
    prisma.category.findFirst({
      where: {
        householdId: "household-demo",
        type: "expense",
        status: "active",
      },
      select: { id: true },
    }),
    prisma.member.findFirst({
      where: {
        householdId: "household-demo",
        status: "active",
      },
      select: { id: true },
    }),
  ]);

  if (!category || !member) {
    throw new Error("E2E reimbursement fixtures are unavailable");
  }

  return { categoryId: category.id, memberId: member.id };
}

async function createExpenseFixtures(
  ids: string[],
  categoryId: string,
  memberId: string,
) {
  await prisma.ledgerRecord.createMany({
    data: ids.map((id, index) => ({
      id,
      householdId: "household-demo",
      type: "expense" as const,
      name: `Integration 競爭退款 ${index + 1}`,
      amountCents: (index + 1) * 1_000,
      occurredOn: new Date("2026-06-25T00:00:00.000Z"),
      categoryId,
      createdByMemberId: memberId,
      sourceMemberId: null,
      paymentSource: "member" as const,
      payerMemberId: memberId,
      reimbursementStatus: "refundable" as const,
      status: "active" as const,
      note: null,
    })),
  });
}
