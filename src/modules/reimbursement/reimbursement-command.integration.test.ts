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
const recordIds = ["integration-conflict-expense-1", "integration-conflict-expense-2"];
const batchId = "integration-conflict-batch";
const paymentId = "integration-conflict-payment";
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

  it("rolls back a partial record transition before writing evidence", async () => {
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

    expect(category).not.toBeNull();
    expect(member).not.toBeNull();

    if (!category || !member) {
      throw new Error("E2E reimbursement fixtures are unavailable");
    }

    await prisma.ledgerRecord.createMany({
      data: recordIds.map((id, index) => ({
        id,
        householdId: "household-demo",
        type: "expense" as const,
        name: `Integration 競爭退款 ${index + 1}`,
        amountCents: (index + 1) * 1_000,
        occurredOn: new Date("2026-06-25T00:00:00.000Z"),
        categoryId: category.id,
        createdByMemberId: member.id,
        sourceMemberId: null,
        paymentSource: "member" as const,
        payerMemberId: member.id,
        reimbursementStatus: "refundable" as const,
        status: "active" as const,
        note: null,
      })),
    });

    const rows = await prisma.ledgerRecord.findMany({
      where: { id: { in: recordIds } },
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
        actorId: member.id,
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
        generateBatchId: () => batchId,
        generatePaymentId: () => paymentId,
      });
    })).rejects.toBeInstanceOf(LedgerRecordMutationConflictError);

    const recordsAfterConflict = await prisma.ledgerRecord.findMany({
      where: { id: { in: recordIds } },
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
      where: { id: batchId },
    })).resolves.toBeNull();
    await expect(prisma.reimbursementPayment.findUnique({
      where: { id: paymentId },
    })).resolves.toBeNull();
  });
});

async function cleanupFixtures() {
  await prisma.reimbursementPayment.deleteMany({
    where: { id: paymentId },
  });
  await prisma.reimbursementBatch.deleteMany({
    where: { id: batchId },
  });
  await prisma.ledgerRecord.deleteMany({
    where: { id: { in: recordIds } },
  });
}
