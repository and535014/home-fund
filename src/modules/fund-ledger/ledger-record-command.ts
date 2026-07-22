import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  loadCategoryLookups,
  type CategoryLookupQueryPrismaClient,
} from "../categorization/category-query";
import type { LedgerRecord } from "./ledger-records";
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
  versionedPrismaLedgerRecordSelect,
  type VersionedPrismaLedgerRecordRow,
} from "./ledger-record-prisma-adapter";

export type LedgerRecordMutationPrismaClient = {
  $transaction<T>(
    callback: (tx: LedgerRecordMutationTransaction) => Promise<T>,
  ): Promise<T>;
};

type LedgerRecordMutationTransaction = {
  category: CategoryLookupQueryPrismaClient["category"];
  member: {
    findMany(args: {
      where: {
        householdId: string;
        status: { in: ["active", "invited"] };
      };
      select: { id: true };
    }): Promise<{ id: string }[]>;
  };
  ledgerRecord: {
    findFirst(args: {
      where: {
        householdId: string;
        id: string;
        status: "active";
      };
      select: typeof versionedPrismaLedgerRecordSelect;
    }): Promise<VersionedPrismaLedgerRecordRow | null>;
    updateMany(args: {
      where: {
        householdId: string;
        id: string;
        status: "active";
        updatedAt: Date;
      };
      data: Record<string, unknown>;
    }): Promise<{ count: number }>;
  };
};

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
    }
  | {
      ok: false;
      reason: "record_changed";
    };

export class LedgerRecordMutationConflictError extends Error {
  constructor() {
    super("Ledger record changed during mutation");
    this.name = "LedgerRecordMutationConflictError";
  }
}

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
    const [record, categories, members] = await Promise.all([
      tx.ledgerRecord.findFirst({
        where: {
          householdId,
          id: command.recordId,
          status: "active",
        },
        select: versionedPrismaLedgerRecordSelect,
      }),
      loadCategoryLookups({ householdId, prisma: tx }),
      tx.member.findMany({
        where: {
          householdId,
          status: { in: ["active", "invited"] },
        },
        select: { id: true },
      }),
    ]);

    if (!record) {
      return { ok: false, reason: "record_not_found" };
    }

    const result = updateLedgerRecord(
      actor,
      mapPrismaLedgerRecordToLedgerRecord(record),
      command,
      {
        categories,
        householdMemberIds: new Set(members.map((member) => member.id)),
      },
    );

    if (!result.ok) {
      return result;
    }

    const update = await tx.ledgerRecord.updateMany({
      where: {
        householdId,
        id: command.recordId,
        status: "active",
        updatedAt: record.updatedAt,
      },
      data: toLedgerRecordUpdateData(result.record),
    });

    if (update.count !== 1) {
      return { ok: false, reason: "record_changed" };
    }

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
      select: versionedPrismaLedgerRecordSelect,
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

    const update = await tx.ledgerRecord.updateMany({
      where: {
        householdId,
        id: command.recordId,
        status: "active",
        updatedAt: record.updatedAt,
      },
      data: { status: "voided" },
    });

    if (update.count !== 1) {
      return { ok: false, reason: "record_changed" };
    }

    return result;
  });
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
