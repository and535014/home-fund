import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  loadHouseholdMemberOptions,
  type HouseholdMemberOptionQueryPrismaClient,
} from "../identity-access/household-member-query";
import {
  loadImportCategoryLookups,
  type ImportCategoryLookupQueryPrismaClient,
} from "../categorization/category-query";
import { authorize } from "../identity-access/authorization";
import {
  hasBlockingImportIssue,
  isBlockingImportIssueCode,
} from "./ledger-import-issues";
import {
  ledgerImportRowIdentity,
  previewLedgerImportCsv,
  type LedgerImportExistingRecord,
  type LedgerImportPreviewResult,
  type LedgerImportRowOverride,
} from "./ledger-import";
import type { ConfirmCsvRowsInput } from "./ledger-record-creation";

export type LedgerImportCommandPrismaClient = {
  member: HouseholdMemberOptionQueryPrismaClient["member"];
  category: ImportCategoryLookupQueryPrismaClient["category"];
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
  };
};

type PrismaLedgerImportExistingRecord = Omit<
  LedgerImportExistingRecord,
  "occurredOn"
> & {
  occurredOn: Date;
};

export type PreviewLedgerImportInDatabaseInput = {
  csv: string;
  overrides?: LedgerImportRowOverride[];
};

export type PrepareLedgerImportConfirmationInDatabaseInput = {
  csv: string;
  removedCsvRowNumbers?: number[];
  overrides?: LedgerImportRowOverride[];
};

export type LedgerImportCommandContext = {
  prisma: LedgerImportCommandPrismaClient;
  householdId: string;
};

export type PreparedCsvConfirmation = {
  rows: ConfirmCsvRowsInput["rows"];
  sourceRejectedRows: ConfirmCsvRowsInput["sourceRejectedRows"];
  skippedRows: ConfirmCsvRowsInput["skippedRows"];
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

export async function prepareLedgerImportConfirmationInDatabase(
  actor: AuthenticatedMember,
  input: PrepareLedgerImportConfirmationInDatabaseInput,
  context: LedgerImportCommandContext,
): Promise<
  | PreparedCsvConfirmation
  | { ok: false; reason: "permission_denied" | "invalid_preview" }
> {
  const permission = authorize(actor, { type: "import_ledger_records" });

  if (!permission.allowed) {
    return { ok: false, reason: "permission_denied" };
  }

  const { members, categories, existingRecords } = await loadPreviewContext(
    context.prisma,
    context.householdId,
  );
  const preview = previewLedgerImportCsv(input.csv, {
    members,
    categories,
    existingRecords,
    overrides: input.overrides,
  });

  if (!preview.ok) {
    return { ok: false, reason: "invalid_preview" };
  }

  const removedCsvRows = new Set(input.removedCsvRowNumbers ?? []);
  const activeRows = preview.rows.filter(
    (row) => !removedCsvRows.has(row.csvRowNumber),
  );

  return {
    rows: activeRows.flatMap((row) =>
      row.command && row.rowFingerprint && !hasBlockingImportIssue(row)
        ? [{
            rowIdentity: ledgerImportRowIdentity(row.csvRowNumber),
            csvRowNumber: row.csvRowNumber,
            rowFingerprint: row.rowFingerprint,
            draft: row.command,
          }]
        : []
    ),
    sourceRejectedRows: activeRows.flatMap((row) => {
      const issue = row.issues.find((candidate) =>
        isBlockingImportIssueCode(candidate.code)
      );
      if (!issue) {
        return [];
      }
      return [{
        rowIdentity: ledgerImportRowIdentity(row.csvRowNumber),
        csvRowNumber: row.csvRowNumber,
        rowFingerprint: row.rowFingerprint ?? `invalid-${row.csvRowNumber}`,
        reason: issue.code as ConfirmCsvRowsInput["sourceRejectedRows"][number]["reason"],
      }];
    }),
    skippedRows: preview.rows.flatMap((row) =>
      removedCsvRows.has(row.csvRowNumber)
        ? [{
            rowIdentity: ledgerImportRowIdentity(row.csvRowNumber),
            csvRowNumber: row.csvRowNumber,
            rowFingerprint: row.rowFingerprint ?? `invalid-${row.csvRowNumber}`,
          }]
        : []
    ),
  };
}

async function loadPreviewContext(
  prisma: LedgerImportCommandPrismaClient,
  householdId: string,
) {
  const [members, categories, records] = await Promise.all([
    loadHouseholdMemberOptions({ householdId, prisma }),
    loadImportCategoryLookups({ householdId, prisma }),
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
