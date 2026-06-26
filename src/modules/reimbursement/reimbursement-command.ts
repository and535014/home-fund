import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import {
  mapPrismaExpenseLedgerRecordToExpenseLedgerRecord,
  mapPrismaLedgerRecordToLedgerRecord,
  prismaExpenseLedgerRecordSelect,
  prismaLedgerRecordSelect,
} from "@/modules/fund-ledger/ledger-record-prisma-adapter";
import type {
  ExpenseLedgerRecord,
} from "@/modules/fund-ledger/ledger-records";
import type { AuthenticatedMember } from "@/modules/identity-access/authorization";
import {
  batchMarkLedgerRecordsReimbursed,
  type BatchMarkLedgerRecordsReimbursedCommand,
  type BatchMarkLedgerRecordsReimbursedResult,
} from "./reimbursement-batch-actions";
import {
  markExpensesReimbursed,
  type MarkExpensesReimbursedCommand,
  type MarkExpensesReimbursedResult,
} from "./reimbursements";
import {
  validateReimbursementPaymentEvidence,
  type ReimbursementPaymentEvidenceInput,
  type ReimbursementPaymentEvidenceRejectionReason,
} from "./reimbursement-payment";

export type MarkExpensesReimbursedInDatabaseContext = {
  prisma: PrismaClient;
  householdId: string;
  generateBatchId?: () => string;
  generatePaymentId?: () => string;
  reimbursedAt?: Date;
  payment: ReimbursementPaymentEvidenceInput;
};

export type WriteReimbursementPaymentSettlementContext = {
  tx: Prisma.TransactionClient;
  householdId: string;
  actorId: string;
  reimbursedRecords: ExpenseLedgerRecord[];
  payment: ReimbursementPaymentEvidenceInput;
  generateBatchId?: () => string;
  generatePaymentId?: () => string;
  reimbursedAt?: Date;
};

export type BatchMarkLedgerRecordsReimbursedInDatabaseContext = {
  prisma: PrismaClient;
  householdId: string;
  generateBatchId?: () => string;
  generatePaymentId?: () => string;
  reimbursedAt?: Date;
  payment: {
    method?: string | null;
    paidOn?: string | null;
    note?: string | null;
  };
};

export type BatchMarkLedgerRecordsReimbursedInDatabaseResult =
  | BatchMarkLedgerRecordsReimbursedResult
  | {
      ok: false;
      reason: ReimbursementPaymentEvidenceRejectionReason;
    };

export async function markExpensesReimbursedInDatabase(
  actor: AuthenticatedMember,
  command: MarkExpensesReimbursedCommand,
  context: MarkExpensesReimbursedInDatabaseContext,
): Promise<MarkExpensesReimbursedResult> {
  const householdId = context.householdId;
  const selectedExpenseIds = [...new Set(command.selectedExpenseIds)];

  return context.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const records = await tx.ledgerRecord.findMany({
      where: {
        householdId,
        id: {
          in: selectedExpenseIds,
        },
        type: "expense",
        status: "active",
      },
      select: prismaExpenseLedgerRecordSelect,
    });
    const result = markExpensesReimbursed(
      actor,
      records.map(mapPrismaExpenseLedgerRecordToExpenseLedgerRecord),
      { selectedExpenseIds },
    );

    if (!result.ok) {
      return result;
    }

    const settlement = await writeReimbursementPaymentSettlement({
      tx,
      householdId,
      actorId: actor.id,
      reimbursedRecords: result.reimbursedExpenses,
      payment: context.payment,
      generateBatchId: context.generateBatchId,
      generatePaymentId: context.generatePaymentId,
      reimbursedAt: context.reimbursedAt,
    });

    if (!settlement.ok) {
      return { ok: false as const, reason: "not_refundable" as const };
    }

    return result;
  });
}

export async function batchMarkLedgerRecordsReimbursedInDatabase(
  actor: AuthenticatedMember,
  command: BatchMarkLedgerRecordsReimbursedCommand,
  context: BatchMarkLedgerRecordsReimbursedInDatabaseContext,
): Promise<BatchMarkLedgerRecordsReimbursedInDatabaseResult> {
  const payment = validateReimbursementPaymentEvidence(context.payment);

  if (!payment.ok) {
    return { ok: false, reason: payment.reason };
  }

  const householdId = context.householdId;
  const selectedRecordIds = [...new Set(command.selectedRecordIds)];

  return context.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const rows = await tx.ledgerRecord.findMany({
      where: {
        householdId,
        id: {
          in: selectedRecordIds,
        },
      },
      select: prismaLedgerRecordSelect,
    });
    const result = batchMarkLedgerRecordsReimbursed(
      actor,
      rows.map(mapPrismaLedgerRecordToLedgerRecord),
      command,
    );

    if (!result.ok) {
      return result;
    }

    const settlement = await writeReimbursementPaymentSettlement({
      tx,
      householdId,
      actorId: actor.id,
      reimbursedRecords: result.reimbursedRecords,
      payment: payment.payment,
      generateBatchId: context.generateBatchId,
      generatePaymentId: context.generatePaymentId,
      reimbursedAt: context.reimbursedAt,
    });

    if (!settlement.ok) {
      return {
        ok: false as const,
        reason: "cross_member_batch" as const,
        skippedRecords: result.skippedRecords,
      };
    }

    return result;
  });
}

export async function writeReimbursementPaymentSettlement(
  context: WriteReimbursementPaymentSettlementContext,
): Promise<
  { ok: true; batchId: string } |
  { ok: false; reason: "invalid_paid_to_member" }
> {
  const paidToMemberIds = new Set(
    context.reimbursedRecords.map((record) => record.payerMemberId),
  );
  const paidToMemberId = [...paidToMemberIds][0];

  if (paidToMemberIds.size !== 1 || !paidToMemberId) {
    return { ok: false, reason: "invalid_paid_to_member" };
  }

  const batchId = context.generateBatchId?.() ?? crypto.randomUUID();

  await context.tx.reimbursementBatch.create({
    data: {
      id: batchId,
      householdId: context.householdId,
      reimbursedById: context.actorId,
      reimbursedAt: context.reimbursedAt ?? new Date(),
      items: {
        create: context.reimbursedRecords.map((expense) => ({
          ledgerRecordId: expense.id,
        })),
      },
    },
  });
  await context.tx.reimbursementPayment.create({
    data: {
      id: context.generatePaymentId?.() ?? crypto.randomUUID(),
      householdId: context.householdId,
      reimbursementBatchId: batchId,
      paidToMemberId,
      paidFromSource: "household_fund",
      method: context.payment.method,
      amountCents: context.reimbursedRecords.reduce(
        (total, expense) => total + expense.amountCents,
        0,
      ),
      paidOn: dateOnlyToDate(context.payment.paidOn),
      ...(context.payment.note ? { note: context.payment.note } : {}),
      recordedByMemberId: context.actorId,
    },
  });
  await context.tx.ledgerRecord.updateMany({
    where: {
      householdId: context.householdId,
      id: {
        in: context.reimbursedRecords.map((expense) => expense.id),
      },
      status: "active",
    },
    data: {
      reimbursementStatus: "reimbursed",
    },
  });

  return { ok: true, batchId };
}

function dateOnlyToDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
}
