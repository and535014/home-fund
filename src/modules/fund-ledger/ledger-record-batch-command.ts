import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  batchDeleteLedgerRecords,
  type BatchDeleteLedgerRecordsCommand,
  type BatchDeleteLedgerRecordsResult,
} from "./ledger-record-batch-actions";
import { LedgerRecordMutationConflictError } from "./ledger-record-command";
import {
  concurrencyPrismaLedgerRecordSelect,
  mapPrismaLedgerRecordToLedgerRecord,
  type ConcurrencyPrismaLedgerRecordRow,
} from "./ledger-record-prisma-adapter";

export type BatchDeleteLedgerRecordsPrismaClient = {
  $transaction<T>(
    callback: (tx: BatchDeleteLedgerRecordsTransaction) => Promise<T>,
  ): Promise<T>;
};

type BatchDeleteLedgerRecordsTransaction = {
  ledgerRecord: {
    findMany(args: {
      where: {
        householdId: string;
        id: { in: string[] };
      };
      select: typeof concurrencyPrismaLedgerRecordSelect;
    }): Promise<ConcurrencyPrismaLedgerRecordRow[]>;
    updateMany(args: {
      where: {
        householdId: string;
        status: "active";
        OR: Array<{ id: string; updatedAt: Date }>;
      };
      data: {
        status: "voided";
        version: { increment: 1 };
      };
    }): Promise<{ count: number }>;
  };
};

export async function batchDeleteLedgerRecordsInDatabase(
  actor: AuthenticatedMember,
  command: BatchDeleteLedgerRecordsCommand,
  context: {
    prisma: BatchDeleteLedgerRecordsPrismaClient;
    householdId: string;
  },
): Promise<BatchDeleteLedgerRecordsResult> {
  const selectedRecordIds = [...new Set(command.selectedRecordIds)];

  return context.prisma.$transaction(async (tx) => {
    const rows = await tx.ledgerRecord.findMany({
      where: {
        householdId: context.householdId,
        id: { in: selectedRecordIds },
      },
      select: concurrencyPrismaLedgerRecordSelect,
    });
    const result = batchDeleteLedgerRecords(
      actor,
      rows.map(mapPrismaLedgerRecordToLedgerRecord),
      { selectedRecordIds },
    );

    if (!result.ok) {
      return result;
    }

    const processedIds = new Set(
      result.processedRecords.map((record) => record.id),
    );
    const update = await tx.ledgerRecord.updateMany({
      where: {
        householdId: context.householdId,
        status: "active",
        OR: rows
          .filter((row) => processedIds.has(row.id))
          .map((row) => ({ id: row.id, updatedAt: row.updatedAt })),
      },
      data: {
        status: "voided",
        version: { increment: 1 },
      },
    });

    if (update.count !== result.processedRecords.length) {
      throw new LedgerRecordMutationConflictError();
    }

    return result;
  });
}
