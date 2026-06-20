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
        status: LedgerRecord["status"];
        note: string | null;
      };
    }): Promise<unknown>;
  };
};

type PrismaLedgerRecordRow = {
  id: string;
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
    householdId?: string;
  },
): Promise<UpdateLedgerRecordResult | LedgerRecordPersistenceFailure> {
  const householdId = context.householdId ?? DEFAULT_HOUSEHOLD_ID;

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
      mapPrismaRecordToLedgerRecord(record),
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
    householdId?: string;
  },
): Promise<DeleteLedgerRecordResult | LedgerRecordPersistenceFailure> {
  const householdId = context.householdId ?? DEFAULT_HOUSEHOLD_ID;

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

    const result = deleteLedgerRecord(actor, mapPrismaRecordToLedgerRecord(record));

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

function mapPrismaRecordToLedgerRecord(record: PrismaLedgerRecordRow): LedgerRecord {
  const base = {
    id: record.id,
    name: record.name,
    amountCents: record.amountCents,
    occurredOn: record.occurredOn.toISOString().slice(0, 10),
    categoryId: record.categoryId,
    createdByMemberId: record.createdByMemberId,
    status: record.status,
    ...(record.note ? { note: record.note } : {}),
  };

  if (record.type === "income") {
    return {
      ...base,
      type: "income",
      sourceMemberId: record.sourceMemberId ?? "",
      reimbursementStatus: "not_applicable",
    };
  }

  return {
    ...base,
    type: "expense",
    paymentSource: record.paymentSource ?? "fund",
    ...(record.payerMemberId ? { payerMemberId: record.payerMemberId } : {}),
    reimbursementStatus:
      record.reimbursementStatus === "not_applicable"
        ? "not_refundable"
        : record.reimbursementStatus,
  };
}

function ledgerRecordSelect(): Record<string, true> {
  return {
    id: true,
    type: true,
    name: true,
    amountCents: true,
    occurredOn: true,
    categoryId: true,
    createdByMemberId: true,
    sourceMemberId: true,
    paymentSource: true,
    payerMemberId: true,
    reimbursementStatus: true,
    status: true,
    note: true,
  };
}
