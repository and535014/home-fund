import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  createLedgerRecord,
  type CreateLedgerRecordCommand,
  type CreateLedgerRecordResult,
  type LedgerCategory,
  type LedgerRecord,
} from "./ledger-records";

const DEFAULT_HOUSEHOLD_ID = "household-demo";

export type LedgerRecordCommandPrismaClient = {
  category: {
    findMany(args: {
      where: {
        householdId: string;
      };
      select: {
        id: true;
        type: true;
        status: true;
      };
    }): Promise<LedgerCategory[]>;
  };
  ledgerRecord: {
    create(args: {
      data: {
        id: string;
        householdId: string;
        type: LedgerRecord["type"];
        name: string;
        amountCents: number;
        occurredOn: Date;
        categoryId: string;
        createdByMemberId: string;
        sourceMemberId: string | null;
        paymentSource: "fund" | "member" | null;
        payerMemberId: string | null;
        reimbursementStatus: LedgerRecord["reimbursementStatus"];
        note: string | null;
      };
    }): Promise<unknown>;
  };
};

export type CreateLedgerRecordInDatabaseContext = {
  prisma: LedgerRecordCommandPrismaClient;
  householdId?: string;
  generateId?: () => string;
};

export async function createLedgerRecordInDatabase(
  actor: AuthenticatedMember,
  command: CreateLedgerRecordCommand,
  context: CreateLedgerRecordInDatabaseContext,
): Promise<CreateLedgerRecordResult> {
  const householdId = context.householdId ?? DEFAULT_HOUSEHOLD_ID;
  const categories = await context.prisma.category.findMany({
    where: { householdId },
    select: {
      id: true,
      type: true,
      status: true,
    },
  });

  const result = createLedgerRecord(actor, command, {
    categories,
    generateId: context.generateId,
  });

  if (!result.ok) {
    return result;
  }

  await context.prisma.ledgerRecord.create({
    data: toLedgerRecordCreateData(result.record, householdId),
  });

  return result;
}

function toLedgerRecordCreateData(record: LedgerRecord, householdId: string) {
  return {
    id: record.id,
    householdId,
    type: record.type,
    name: record.name,
    amountCents: record.amountCents,
    occurredOn: new Date(`${record.occurredOn}T00:00:00.000Z`),
    categoryId: record.categoryId,
    createdByMemberId: record.createdByMemberId,
    sourceMemberId: record.type === "income" ? record.sourceMemberId : null,
    paymentSource: record.type === "expense" ? record.paymentSource : null,
    payerMemberId: record.type === "expense" ? record.payerMemberId ?? null : null,
    reimbursementStatus: record.reimbursementStatus,
    note: record.note ?? null,
  };
}
