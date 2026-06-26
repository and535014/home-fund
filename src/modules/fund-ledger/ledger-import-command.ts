import { createHash } from "node:crypto";
import type { AuthenticatedMember } from "../identity-access/authorization";
import { authorize } from "../identity-access/authorization";
import { hasBlockingImportIssue } from "./ledger-import-issues";
import {
  previewLedgerImportCsv,
  type LedgerImportCategory,
  type LedgerImportExistingRecord,
  type LedgerImportMember,
  type LedgerImportPreviewResult,
  type LedgerImportPreviewRow,
  type LedgerImportRowOverride,
} from "./ledger-import";
import type { CreateLedgerRecordCommand, LedgerRecord } from "./ledger-records";

export type LedgerImportCommandPrismaClient = {
  member: {
    findMany(args: {
      where: {
        householdId: string;
      };
      select: {
        id: true;
        displayName: true;
      };
    }): Promise<LedgerImportMember[]>;
  };
  category: {
    findMany(args: {
      where: {
        householdId: string;
      };
      select: {
        id: true;
        type: true;
        name: true;
        status: true;
      };
    }): Promise<LedgerImportCategory[]>;
  };
  ledgerRecord: {
    findMany(args: {
      where: {
        householdId: string;
        status: "active";
      };
      select: {
        type: true;
        name: true;
        amountCents: true;
        occurredOn: true;
        categoryId: true;
        sourceMemberId: true;
        paymentSource: true;
        payerMemberId: true;
        note: true;
      };
    }): Promise<PrismaLedgerImportExistingRecord[]>;
    create(args: {
      data: LedgerRecordCreateData;
    }): Promise<unknown>;
  };
  ledgerImportBatch: {
    create(args: {
      data: {
        id: string;
        householdId: string;
        fileName: string;
        fileFingerprint: string;
        status: "imported";
        failedRowCount: number;
        importedRowCount: number;
        skippedRowCount: number;
        createdByMemberId: string;
      };
    }): Promise<unknown>;
  };
  ledgerImportRow: {
    createMany(args: {
      data: {
        id: string;
        batchId: string;
        csvRowNumber: number;
        rowFingerprint: string;
        status: "imported" | "failed" | "skipped";
        ledgerRecordId: string | null;
      }[];
    }): Promise<unknown>;
  };
  $transaction?<T>(
    callback: (tx: LedgerImportCommandPrismaClient) => Promise<T>,
  ): Promise<T>;
};

type PrismaLedgerImportExistingRecord = Omit<
  LedgerImportExistingRecord,
  "occurredOn"
> & {
  occurredOn: Date;
};

type LedgerRecordCreateData = {
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

export type PreviewLedgerImportInDatabaseInput = {
  csv: string;
  overrides?: LedgerImportRowOverride[];
};

export type ConfirmLedgerImportInDatabaseInput = {
  csv: string;
  fileName: string;
  removedCsvRowNumbers?: number[];
  overrides?: LedgerImportRowOverride[];
};

export type LedgerImportCommandContext = {
  prisma: LedgerImportCommandPrismaClient;
  householdId: string;
  generateBatchId?: () => string;
  generateRecordId?: (index: number) => string;
  generateImportRowId?: (index: number) => string;
};

export type ConfirmLedgerImportResult =
  | {
      ok: true;
      batchId: string;
      failedCount: number;
      importedCount: number;
      skippedCount: number;
    }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "invalid_preview"
        | "validation_changed"
        | "no_importable_rows";
      rows?: LedgerImportPreviewRow[];
    };

export async function previewLedgerImportInDatabase(
  actor: AuthenticatedMember,
  input: PreviewLedgerImportInDatabaseInput,
  context: LedgerImportCommandContext,
): Promise<LedgerImportPreviewResult | { ok: false; reason: "permission_denied" }> {
  const permission = authorize(actor, { type: "import_ledger_records" });

  if (!permission.allowed) {
    return { ok: false, reason: "permission_denied" };
  }

  const householdId = context.householdId;
  const { members, categories, existingRecords } = await loadPreviewContext(
    context.prisma,
    householdId,
  );

  return previewLedgerImportCsv(input.csv, {
    members,
    categories,
    existingRecords,
    overrides: input.overrides,
  });
}

export async function confirmLedgerImportInDatabase(
  actor: AuthenticatedMember,
  input: ConfirmLedgerImportInDatabaseInput,
  context: LedgerImportCommandContext,
): Promise<ConfirmLedgerImportResult> {
  const permission = authorize(actor, { type: "import_ledger_records" });

  if (!permission.allowed) {
    return { ok: false, reason: "permission_denied" };
  }

  const householdId = context.householdId;
  const run = async (tx: LedgerImportCommandPrismaClient) => {
    const { members, categories, existingRecords } = await loadPreviewContext(
      tx,
      householdId,
    );
    const preview = previewLedgerImportCsv(input.csv, {
      members,
      categories,
      existingRecords,
      overrides: input.overrides,
    });

    if (!preview.ok) {
      return { ok: false, reason: "invalid_preview" } as const;
    }

    const removedCsvRows = new Set(input.removedCsvRowNumbers ?? []);
    const activeRows = preview.rows.filter(
      (row) => !removedCsvRows.has(row.csvRowNumber),
    );
    const skippedRows = preview.rows.filter((row) =>
      removedCsvRows.has(row.csvRowNumber),
    );

    if (activeRows.length === 0) {
      return { ok: false, reason: "no_importable_rows", rows: preview.rows } as const;
    }

    const batchId = context.generateBatchId?.() ?? crypto.randomUUID();
    const failedRows = activeRows.filter((row) => hasBlockingImportIssue(row));
    const importedRows = activeRows.filter((row) =>
      row.command && row.rowFingerprint && !hasBlockingImportIssue(row),
    );

    await tx.ledgerImportBatch.create({
      data: {
        id: batchId,
        householdId,
        fileName: input.fileName,
        fileFingerprint: fileFingerprint(input.csv),
        status: "imported",
        failedRowCount: failedRows.length,
        importedRowCount: importedRows.length,
        skippedRowCount: skippedRows.length,
        createdByMemberId: actor.id,
      },
    });

    const auditRows = [];

    for (const [index, row] of importedRows.entries()) {
      const recordId = context.generateRecordId?.(index) ?? crypto.randomUUID();

      await tx.ledgerRecord.create({
        data: toLedgerRecordCreateData(row.command!, recordId, actor.id, householdId),
      });

      auditRows.push({
        id: context.generateImportRowId?.(index) ?? crypto.randomUUID(),
        batchId,
        csvRowNumber: row.csvRowNumber,
        rowFingerprint: row.rowFingerprint!,
        status: "imported" as const,
        ledgerRecordId: recordId,
      });
    }

    for (const [index, row] of skippedRows.entries()) {
      auditRows.push({
        id:
          context.generateImportRowId?.(importedRows.length + index) ??
          crypto.randomUUID(),
        batchId,
        csvRowNumber: row.csvRowNumber,
        rowFingerprint: row.rowFingerprint ?? `invalid-${row.csvRowNumber}`,
        status: "skipped" as const,
        ledgerRecordId: null,
      });
    }

    for (const [index, row] of failedRows.entries()) {
      auditRows.push({
        id:
          context.generateImportRowId?.(
            importedRows.length + skippedRows.length + index,
          ) ?? crypto.randomUUID(),
        batchId,
        csvRowNumber: row.csvRowNumber,
        rowFingerprint: row.rowFingerprint ?? `invalid-${row.csvRowNumber}`,
        status: "failed" as const,
        ledgerRecordId: null,
      });
    }

    if (auditRows.length > 0) {
      await tx.ledgerImportRow.createMany({ data: auditRows });
    }

    return {
      ok: true,
      batchId,
      failedCount: failedRows.length,
      importedCount: importedRows.length,
      skippedCount: skippedRows.length,
    } as const;
  };

  if (context.prisma.$transaction) {
    return context.prisma.$transaction(run);
  }

  return run(context.prisma);
}

async function loadPreviewContext(
  prisma: LedgerImportCommandPrismaClient,
  householdId: string,
) {
  const [members, categories, records] = await Promise.all([
    prisma.member.findMany({
      where: {
        householdId,
      },
      select: {
        id: true,
        displayName: true,
      },
    }),
    prisma.category.findMany({
      where: {
        householdId,
      },
      select: {
        id: true,
        type: true,
        name: true,
        status: true,
      },
    }),
    prisma.ledgerRecord.findMany({
      where: {
        householdId,
        status: "active",
      },
      select: {
        type: true,
        name: true,
        amountCents: true,
        occurredOn: true,
        categoryId: true,
        sourceMemberId: true,
        paymentSource: true,
        payerMemberId: true,
        note: true,
      },
    }),
  ]);

  return {
    members,
    categories,
    existingRecords: records.map((record) => ({
      ...record,
      occurredOn: record.occurredOn.toISOString().slice(0, 10),
    })),
  };
}

function toLedgerRecordCreateData(
  command: CreateLedgerRecordCommand,
  id: string,
  actorId: string,
  householdId: string,
): LedgerRecordCreateData {
  return {
    id,
    householdId,
    type: command.type,
    name: command.name,
    amountCents: command.amountCents,
    occurredOn: new Date(`${command.occurredOn}T00:00:00.000Z`),
    categoryId: command.categoryId,
    createdByMemberId: actorId,
    sourceMemberId: command.type === "income" ? command.sourceMemberId : null,
    paymentSource: command.type === "expense" ? command.paymentSource : null,
    payerMemberId: command.type === "expense" ? command.payerMemberId ?? null : null,
    reimbursementStatus:
      command.type === "income"
        ? "not_applicable"
        : command.paymentSource === "fund"
          ? "not_refundable"
          : "refundable",
    status: "active",
    note: command.note ?? null,
  };
}

function fileFingerprint(csv: string): string {
  return createHash("sha256").update(csv).digest("hex");
}
