import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  createLedgerRecord,
  type CreateLedgerRecordCommand,
  type CreateLedgerRecordResult,
  type LedgerCategory,
  type LedgerRecord,
} from "./ledger-records";
import {
  deleteLedgerRecord,
  updateLedgerRecord,
  type DeleteLedgerRecordResult,
  type LedgerRecordCorrectionFailure,
  type UpdateLedgerRecordCommand,
  type UpdateLedgerRecordResult,
} from "./ledger-record-corrections";
import {
  mapPrismaLedgerRecordToLedgerRecord,
  prismaLedgerRecordSelect,
  type PrismaLedgerRecordRow,
} from "./ledger-record-prisma-adapter";

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
        status: LedgerRecord["status"];
        note: string | null;
      };
    }): Promise<unknown>;
  };
};

export type LedgerRecordMutationPrismaClient = {
  $transaction<T>(
    callback: (tx: LedgerRecordMutationTransaction) => Promise<T>,
  ): Promise<T>;
};

type LedgerRecordMutationTransaction = {
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
    findFirst(args: {
      where: {
        householdId: string;
        id: string;
        status: "active";
      };
      select: Record<string, true>;
    }): Promise<PrismaLedgerRecordRow | null>;
    update(args: {
      where: {
        id: string;
      };
      data: Record<string, unknown>;
    }): Promise<unknown>;
  };
};

export type CreateLedgerRecordInDatabaseContext = {
  prisma: LedgerRecordCommandPrismaClient;
  householdId: string;
  generateId?: () => string;
};

export async function createLedgerRecordInDatabase(
  actor: AuthenticatedMember,
  command: CreateLedgerRecordCommand,
  context: CreateLedgerRecordInDatabaseContext,
): Promise<CreateLedgerRecordResult> {
  const householdId = context.householdId;
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

export type UpdateLedgerRecordInDatabaseCommand = UpdateLedgerRecordCommand & {
  recordId: string;
};

export type VoidLedgerRecordInDatabaseCommand = {
  recordId: string;
};

export type LedgerRecordPersistenceFailure =
  | LedgerRecordCorrectionFailure
  | {
      ok: false;
      reason: "record_not_found";
    };

export async function updateLedgerRecordInDatabase(
  actor: AuthenticatedMember,
  command: UpdateLedgerRecordInDatabaseCommand,
  context: {
    prisma: LedgerRecordMutationPrismaClient;
    householdId: string;
  },
): Promise<UpdateLedgerRecordResult | LedgerRecordPersistenceFailure> {
  const householdId = context.householdId;

  return context.prisma.$transaction(async (tx) => {
    const [record, categories] = await Promise.all([
      tx.ledgerRecord.findFirst({
        where: {
          householdId,
          id: command.recordId,
          status: "active",
        },
        select: ledgerRecordSelect(),
      }),
      tx.category.findMany({
        where: { householdId },
        select: {
          id: true,
          type: true,
          status: true,
        },
      }),
    ]);

    if (!record) {
      return { ok: false, reason: "record_not_found" };
    }

    const result = updateLedgerRecord(
      actor,
      mapPrismaLedgerRecordToLedgerRecord(record),
      command,
      { categories },
    );

    if (!result.ok) {
      return result;
    }

    await tx.ledgerRecord.update({
      where: { id: command.recordId },
      data: toLedgerRecordUpdateData(result.record),
    });

    return result;
  });
}

export async function voidLedgerRecordInDatabase(
  actor: AuthenticatedMember,
  command: VoidLedgerRecordInDatabaseCommand,
  context: {
    prisma: LedgerRecordMutationPrismaClient;
    householdId: string;
  },
): Promise<DeleteLedgerRecordResult | LedgerRecordPersistenceFailure> {
  const householdId = context.householdId;

  return context.prisma.$transaction(async (tx) => {
    const record = await tx.ledgerRecord.findFirst({
      where: {
        householdId,
        id: command.recordId,
        status: "active",
      },
      select: ledgerRecordSelect(),
    });

    if (!record) {
      return { ok: false, reason: "record_not_found" };
    }

    const result = deleteLedgerRecord(
      actor,
      mapPrismaLedgerRecordToLedgerRecord(record),
    );

    if (!result.ok) {
      return result;
    }

    await tx.ledgerRecord.update({
      where: { id: command.recordId },
      data: { status: "voided" },
    });

    return result;
  });
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
    status: record.status,
    note: record.note ?? null,
  };
}

function toLedgerRecordUpdateData(record: LedgerRecord) {
  return {
    type: record.type,
    name: record.name,
    amountCents: record.amountCents,
    occurredOn: new Date(`${record.occurredOn}T00:00:00.000Z`),
    categoryId: record.categoryId,
    sourceMemberId: record.type === "income" ? record.sourceMemberId : null,
    paymentSource: record.type === "expense" ? record.paymentSource : null,
    payerMemberId: record.type === "expense" ? record.payerMemberId ?? null : null,
    reimbursementStatus: record.reimbursementStatus,
    status: record.status,
    note: record.note ?? null,
  };
}

function ledgerRecordSelect(): Record<string, true> {
  return prismaLedgerRecordSelect;
}
