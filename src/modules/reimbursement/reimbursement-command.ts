import type { Prisma, PrismaClient } from "@/generated/prisma/client";
import type { ExpenseLedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { AuthenticatedMember } from "@/modules/identity-access/authorization";
import {
  markExpensesReimbursed,
  type MarkExpensesReimbursedCommand,
  type MarkExpensesReimbursedResult,
} from "./reimbursements";
import type { ReimbursementPaymentEvidenceInput } from "./reimbursement-payment";

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
      select: {
        id: true,
        type: true,
        name: true,
        amountCents: true,
        occurredOn: true,
        categoryId: true,
        createdByMemberId: true,
        paymentSource: true,
        payerMemberId: true,
        reimbursementStatus: true,
        status: true,
        note: true,
      },
    });
    const result = markExpensesReimbursed(
      actor,
      records.map(mapPrismaRecordToExpense),
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

function mapPrismaRecordToExpense(record: {
  id: string;
  type: "expense" | "income";
  name: string;
  amountCents: number;
  occurredOn: Date;
  categoryId: string;
  createdByMemberId: string;
  paymentSource: "fund" | "member" | null;
  payerMemberId: string | null;
  reimbursementStatus: "not_applicable" | "not_refundable" | "refundable" | "reimbursed";
  status: "active" | "voided";
  note: string | null;
}): ExpenseLedgerRecord {
  return {
    id: record.id,
    type: "expense",
    name: record.name,
    amountCents: record.amountCents,
    occurredOn: record.occurredOn.toISOString().slice(0, 10),
    categoryId: record.categoryId,
    createdByMemberId: record.createdByMemberId,
    paymentSource: record.paymentSource ?? "fund",
    ...(record.payerMemberId ? { payerMemberId: record.payerMemberId } : {}),
    reimbursementStatus:
      record.reimbursementStatus === "not_applicable"
        ? "not_refundable"
        : record.reimbursementStatus,
    status: record.status,
    ...(record.note ? { note: record.note } : {}),
  };
}
