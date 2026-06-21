import type { PrismaClient } from "@/generated/prisma/client";
import type { ExpenseLedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { AuthenticatedMember } from "@/modules/identity-access/authorization";
import {
  markExpensesReimbursed,
  type MarkExpensesReimbursedCommand,
  type MarkExpensesReimbursedResult,
} from "./reimbursements";

const DEFAULT_HOUSEHOLD_ID = "household-demo";

export type MarkExpensesReimbursedInDatabaseContext = {
  prisma: PrismaClient;
  householdId?: string;
  generateBatchId?: () => string;
  reimbursedAt?: Date;
};

export async function markExpensesReimbursedInDatabase(
  actor: AuthenticatedMember,
  command: MarkExpensesReimbursedCommand,
  context: MarkExpensesReimbursedInDatabaseContext,
): Promise<MarkExpensesReimbursedResult> {
  const householdId = context.householdId ?? DEFAULT_HOUSEHOLD_ID;
  const selectedExpenseIds = [...new Set(command.selectedExpenseIds)];

  return context.prisma.$transaction(async (tx) => {
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

    await tx.reimbursementBatch.create({
      data: {
        id: context.generateBatchId?.() ?? crypto.randomUUID(),
        householdId,
        reimbursedById: actor.id,
        reimbursedAt: context.reimbursedAt ?? new Date(),
        items: {
          create: result.reimbursedExpenses.map((expense) => ({
            ledgerRecordId: expense.id,
          })),
        },
      },
    });
    await tx.ledgerRecord.updateMany({
      where: {
        householdId,
        id: {
          in: result.reimbursedExpenses.map((expense) => expense.id),
        },
        status: "active",
      },
      data: {
        reimbursementStatus: "reimbursed",
      },
    });

    return result;
  });
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
