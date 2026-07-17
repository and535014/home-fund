import { getPrismaClient } from "@/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import { authorize } from "@/modules/identity-access/authorization";
import {
  findDisabledHouseholdMember,
  findFinancialAttributionMember,
} from "@/modules/identity-access/household-member-query";
import type { HouseholdScopedAuthenticatedMember } from "@/modules/identity-access/session-access";
import type { RecurringPostingSystemActor } from "@/modules/identity-access/system-actor";
import type { LedgerImportIssueCode } from "./ledger-import";

export type LedgerCreationMemberActor = {
  kind: "member";
  member: HouseholdScopedAuthenticatedMember;
};

export type LedgerRecordDraft =
  | {
      type: "income";
      name: string;
      amountCents: number;
      occurredOn: string;
      categoryId: string;
      sourceMemberId: string;
      note?: string;
    }
  | {
      type: "expense";
      name: string;
      amountCents: number;
      occurredOn: string;
      categoryId: string;
      paymentSource: "fund" | "member";
      payerMemberId?: string;
      note?: string;
    };

export type CreateManualRecordResult =
  | { ok: true; recordId: string }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "missing_name"
        | "invalid_amount"
        | "invalid_date"
        | "missing_category"
        | "archived_category"
        | "category_type_mismatch"
        | "missing_member_payer"
        | "fund_paid_expense_cannot_have_member_payer"
        | "member_outside_household"
        | "disabled_member";
    };

type CsvSourceRejectionReason = Exclude<
  LedgerImportIssueCode,
  "duplicate_in_file" | "duplicate_existing"
>;

export type ConfirmCsvRowsInput = {
  batchIdentity: string;
  fileName: string;
  fileFingerprint: string;
  rows: Array<{
    rowIdentity: string;
    csvRowNumber: number;
    rowFingerprint: string;
    draft: LedgerRecordDraft;
  }>;
  sourceRejectedRows: Array<{
    rowIdentity: string;
    csvRowNumber: number;
    rowFingerprint: string;
    reason: CsvSourceRejectionReason;
  }>;
  skippedRows: Array<{
    rowIdentity: string;
    csvRowNumber: number;
    rowFingerprint: string;
  }>;
};

export type CsvTerminalRejectionReason =
  | CsvSourceRejectionReason
  | Extract<CreateManualRecordResult, { ok: false }>["reason"]
  | "legacy_rejection";

export type ConfirmCsvRowResult = {
  rowIdentity: string;
  csvRowNumber: number;
} & (
  | { status: "created"; recordId: string }
  | { status: "already_imported"; recordId: string }
  | {
      status: "rejected";
      reason: CsvTerminalRejectionReason | "unavailable";
      retryable: boolean;
    }
);

export type ConfirmCsvSkippedRowResult = {
  rowIdentity: string;
  csvRowNumber: number;
  status: "skipped";
};

export type ConfirmCsvRowsResult =
  | {
      ok: true;
      batchId: string;
      rows: ConfirmCsvRowResult[];
      skippedRows: ConfirmCsvSkippedRowResult[];
    }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "batch_identity_mismatch"
        | "no_confirmable_rows"
        | "unavailable";
    };

type KernelRequest = {
  actor: LedgerCreationMemberActor | RecurringPostingSystemActor;
  createdByMemberId: string;
  draft: LedgerRecordDraft;
  authorize: (input: {
    attributionMemberId: string;
    createdByMemberId: string;
  }) => { allowed: true } | { allowed: false; reason: string };
};

type KernelResult =
  | { ok: true; recordId: string }
  | {
      ok: false;
      reason: Extract<CreateManualRecordResult, { ok: false }>['reason'];
    };

export async function createManualRecord(
  actor: LedgerCreationMemberActor,
  draft: LedgerRecordDraft,
): Promise<CreateManualRecordResult> {
  return getPrismaClient().$transaction(async (tx) =>
    createLedgerRecordWithinTransaction(tx, {
      actor,
      createdByMemberId: actor.member.id,
      draft,
      authorize: ({ attributionMemberId }) => authorize(actor.member, {
        type:
          draft.type === "income"
            ? "create_income_record"
            : "create_expense_record",
        targetMemberId: attributionMemberId,
      }),
    }),
  );
}

export async function confirmCsvRows(
  actor: LedgerCreationMemberActor,
  input: ConfirmCsvRowsInput,
): Promise<ConfirmCsvRowsResult> {
  const permission = authorize(actor.member, { type: "import_ledger_records" });
  if (!permission.allowed) {
    return { ok: false, reason: "permission_denied" };
  }

  if (
    input.rows.length === 0 &&
    input.sourceRejectedRows.length === 0 &&
    input.skippedRows.length === 0
  ) {
    return { ok: false, reason: "no_confirmable_rows" };
  }

  const prisma = getPrismaClient();
  const acquired = await acquireCsvBatch(prisma, actor, input);
  if (!acquired.ok) {
    return acquired;
  }

  try {
    const outcomes = await Promise.all([
      ...input.rows.map((row) => confirmActiveCsvRow(
        prisma,
        actor,
        acquired.batch.id,
        row,
      )),
      ...input.sourceRejectedRows.map((row) => confirmSourceRejectedCsvRow(
        prisma,
        acquired.batch.id,
        row,
      )),
    ]);
    const skipped = await Promise.all(input.skippedRows.map((row) =>
      confirmSkippedCsvRow(prisma, acquired.batch.id, row)
    ));

    if (skipped.some((result) => !result.ok)) {
      return { ok: false, reason: "unavailable" };
    }
    outcomes.push(...skipped.flatMap((result) =>
      result.ok ? [result.outcome] : []
    ));

    return {
      ok: true,
      batchId: acquired.batch.id,
      rows: outcomes.flatMap((outcome) =>
        outcome.collection === "rows" ? [outcome.row] : []
      ),
      skippedRows: outcomes.flatMap((outcome) =>
        outcome.collection === "skippedRows" ? [outcome.row] : []
      ),
    };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

type PrismaClient = ReturnType<typeof getPrismaClient>;
type CsvBatch = { id: string; fileFingerprint: string };
type ConfirmedCsvRowOutcome =
  | { collection: "rows"; row: ConfirmCsvRowResult }
  | { collection: "skippedRows"; row: ConfirmCsvSkippedRowResult };

async function acquireCsvBatch(
  prisma: PrismaClient,
  actor: LedgerCreationMemberActor,
  input: ConfirmCsvRowsInput,
): Promise<
  | { ok: true; batch: CsvBatch }
  | Extract<ConfirmCsvRowsResult, { ok: false }>
> {
  try {
    const batch = await prisma.ledgerImportBatch.create({
      data: {
        householdId: actor.member.householdId,
        batchIdentity: input.batchIdentity,
        fileName: input.fileName,
        fileFingerprint: input.fileFingerprint,
        status: "imported",
        failedRowCount: 0,
        importedRowCount: 0,
        skippedRowCount: 0,
        createdByMemberId: actor.member.id,
      },
      select: { id: true, fileFingerprint: true },
    });
    return { ok: true, batch };
  } catch (error) {
    if (!isUniqueConstraintError(error)) {
      return { ok: false, reason: "unavailable" };
    }
  }

  try {
    const batch = await prisma.ledgerImportBatch.findUnique({
      where: {
        householdId_batchIdentity: {
          householdId: actor.member.householdId,
          batchIdentity: input.batchIdentity,
        },
      },
      select: { id: true, fileFingerprint: true },
    });
    if (!batch) {
      return { ok: false, reason: "unavailable" };
    }
    if (batch.fileFingerprint !== input.fileFingerprint) {
      return { ok: false, reason: "batch_identity_mismatch" };
    }
    return { ok: true, batch };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}

async function confirmActiveCsvRow(
  prisma: PrismaClient,
  actor: LedgerCreationMemberActor,
  batchId: string,
  row: ConfirmCsvRowsInput["rows"][number],
): Promise<ConfirmedCsvRowOutcome> {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await findCsvRow(tx, batchId, row.rowIdentity);
      if (existing) {
        return outcomeFromExisting(row, existing);
      }

      const result = await createLedgerRecordWithinTransaction(tx, {
        actor,
        createdByMemberId: actor.member.id,
        draft: row.draft,
        authorize: ({ attributionMemberId }) => authorize(actor.member, {
          type:
            row.draft.type === "income"
              ? "create_income_record"
              : "create_expense_record",
          targetMemberId: attributionMemberId,
        }),
      });

      if (!result.ok) {
        await tx.ledgerImportRow.create({
          data: {
            batchId,
            rowIdentity: row.rowIdentity,
            csvRowNumber: row.csvRowNumber,
            rowFingerprint: row.rowFingerprint,
            status: "failed",
            ledgerRecordId: null,
            failureReason: result.reason,
          },
        });
        await tx.ledgerImportBatch.update({
          where: { id: batchId },
          data: { failedRowCount: { increment: 1 } },
        });
        return confirmedCsvRow(rejectedCsvRow(row, result.reason, false));
      }

      await tx.ledgerImportRow.create({
        data: {
          batchId,
          rowIdentity: row.rowIdentity,
          csvRowNumber: row.csvRowNumber,
          rowFingerprint: row.rowFingerprint,
          status: "imported",
          ledgerRecordId: result.recordId,
          failureReason: null,
        },
      });
      await tx.ledgerImportBatch.update({
        where: { id: batchId },
        data: { importedRowCount: { increment: 1 } },
      });
      return confirmedCsvRow({
        rowIdentity: row.rowIdentity,
        csvRowNumber: row.csvRowNumber,
        status: "created",
        recordId: result.recordId,
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const existing = await reloadCsvRow(prisma, batchId, row.rowIdentity);
      if (existing) {
        return outcomeFromExisting(row, existing);
      }
    }
    return confirmedCsvRow(rejectedCsvRow(row, "unavailable", true));
  }
}

async function confirmSourceRejectedCsvRow(
  prisma: PrismaClient,
  batchId: string,
  row: ConfirmCsvRowsInput["sourceRejectedRows"][number],
): Promise<ConfirmedCsvRowOutcome> {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await findCsvRow(tx, batchId, row.rowIdentity);
      if (existing) {
        return outcomeFromExisting(row, existing);
      }

      await tx.ledgerImportRow.create({
        data: {
          batchId,
          rowIdentity: row.rowIdentity,
          csvRowNumber: row.csvRowNumber,
          rowFingerprint: row.rowFingerprint,
          status: "failed",
          ledgerRecordId: null,
          failureReason: row.reason,
        },
      });
      await tx.ledgerImportBatch.update({
        where: { id: batchId },
        data: { failedRowCount: { increment: 1 } },
      });
      return confirmedCsvRow(rejectedCsvRow(row, row.reason, false));
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const existing = await reloadCsvRow(prisma, batchId, row.rowIdentity);
      if (existing) {
        return outcomeFromExisting(row, existing);
      }
    }
    return confirmedCsvRow(rejectedCsvRow(row, "unavailable", true));
  }
}

async function confirmSkippedCsvRow(
  prisma: PrismaClient,
  batchId: string,
  row: ConfirmCsvRowsInput["skippedRows"][number],
): Promise<
  | { ok: true; outcome: ConfirmedCsvRowOutcome }
  | { ok: false }
> {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await findCsvRow(tx, batchId, row.rowIdentity);
      if (existing) {
        return { ok: true as const, outcome: outcomeFromExisting(row, existing) };
      }

      await tx.ledgerImportRow.create({
        data: {
          batchId,
          rowIdentity: row.rowIdentity,
          csvRowNumber: row.csvRowNumber,
          rowFingerprint: row.rowFingerprint,
          status: "skipped",
          ledgerRecordId: null,
          failureReason: null,
        },
      });
      await tx.ledgerImportBatch.update({
        where: { id: batchId },
        data: { skippedRowCount: { increment: 1 } },
      });
      return { ok: true as const, outcome: skippedCsvRow(skippedCsvRowResult(row)) };
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      const existing = await reloadCsvRow(prisma, batchId, row.rowIdentity);
      if (existing) {
        return { ok: true, outcome: outcomeFromExisting(row, existing) };
      }
    }
    return { ok: false };
  }
}

type ExistingCsvRow = {
  status: "imported" | "failed" | "skipped";
  ledgerRecordId: string | null;
  failureReason: string | null;
};

function findCsvRow(
  tx: Prisma.TransactionClient,
  batchId: string,
  rowIdentity: string,
): Promise<ExistingCsvRow | null> {
  return tx.ledgerImportRow.findUnique({
    where: { batchId_rowIdentity: { batchId, rowIdentity } },
    select: { status: true, ledgerRecordId: true, failureReason: true },
  });
}

function reloadCsvRow(
  prisma: PrismaClient,
  batchId: string,
  rowIdentity: string,
): Promise<ExistingCsvRow | null> {
  return prisma.ledgerImportRow.findUnique({
    where: { batchId_rowIdentity: { batchId, rowIdentity } },
    select: { status: true, ledgerRecordId: true, failureReason: true },
  });
}

function outcomeFromExisting(
  row: { rowIdentity: string; csvRowNumber: number },
  existing: ExistingCsvRow,
): ConfirmedCsvRowOutcome {
  if (existing.status === "imported" && existing.ledgerRecordId) {
    return confirmedCsvRow({
      rowIdentity: row.rowIdentity,
      csvRowNumber: row.csvRowNumber,
      status: "already_imported",
      recordId: existing.ledgerRecordId,
    });
  }
  if (existing.status === "skipped") {
    return skippedCsvRow(skippedCsvRowResult(row));
  }
  return confirmedCsvRow(
    rejectedCsvRow(
      row,
      (existing.failureReason as CsvTerminalRejectionReason | null) ??
        "legacy_rejection",
      false,
    ),
  );
}

function confirmedCsvRow(row: ConfirmCsvRowResult): ConfirmedCsvRowOutcome {
  return { collection: "rows", row };
}

function skippedCsvRow(
  row: ConfirmCsvSkippedRowResult,
): ConfirmedCsvRowOutcome {
  return { collection: "skippedRows", row };
}

function rejectedCsvRow(
  row: { rowIdentity: string; csvRowNumber: number },
  reason: CsvTerminalRejectionReason | "unavailable",
  retryable: boolean,
): ConfirmCsvRowResult {
  return {
    rowIdentity: row.rowIdentity,
    csvRowNumber: row.csvRowNumber,
    status: "rejected",
    reason,
    retryable,
  };
}

function skippedCsvRowResult(
  row: { rowIdentity: string; csvRowNumber: number },
): ConfirmCsvSkippedRowResult {
  return {
    rowIdentity: row.rowIdentity,
    csvRowNumber: row.csvRowNumber,
    status: "skipped",
  };
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002";
}

async function createLedgerRecordWithinTransaction(
  tx: Prisma.TransactionClient,
  request: KernelRequest,
): Promise<KernelResult> {
  const householdId = householdIdFor(request.actor);
  const category = await tx.category.findFirst({
    where: { id: request.draft.categoryId, householdId },
    select: { id: true, status: true, type: true },
  });

  const attribution = await resolveAttributionMember({
    tx,
    householdId,
    draft: request.draft,
    createdByMemberId: request.createdByMemberId,
  });

  const validation = validateDraft(request.draft, category, attribution);
  if (!validation.ok) {
    return validation;
  }
  if (!attribution.ok) {
    return attribution;
  }

  const authorization = request.authorize({
    attributionMemberId: attribution.memberId,
    createdByMemberId: request.createdByMemberId,
  });
  if (!authorization.allowed) {
    return { ok: false, reason: "permission_denied" };
  }

  const recordId = crypto.randomUUID();
  await tx.ledgerRecord.create({
    data: toPrismaLedgerRecordCreateData({
      id: recordId,
      householdId,
      createdByMemberId: request.createdByMemberId,
      draft: request.draft,
    }),
  });

  return { ok: true, recordId };
}

function householdIdFor(
  actor: LedgerCreationMemberActor | RecurringPostingSystemActor,
): string {
  return actor.kind === "member" ? actor.member.householdId : actor.householdId;
}

type AttributionResolution =
  | { ok: true; memberId: string }
  | { ok: false; reason: "missing_member_payer" | "member_outside_household" | "disabled_member" };

async function resolveAttributionMember({
  tx,
  householdId,
  draft,
  createdByMemberId,
}: {
  tx: Prisma.TransactionClient;
  householdId: string;
  draft: LedgerRecordDraft;
  createdByMemberId: string;
}): Promise<AttributionResolution> {
  const memberId = draft.type === "income"
    ? draft.sourceMemberId
    : draft.paymentSource === "member"
      ? draft.payerMemberId
      : createdByMemberId;

  if (!memberId) {
    return { ok: false, reason: "missing_member_payer" };
  }

  if (draft.type === "expense" && draft.paymentSource === "fund") {
    return { ok: true, memberId };
  }

  const availableMember = await findFinancialAttributionMember({
    householdId,
    memberId,
    prisma: tx,
  });
  if (availableMember) {
    return { ok: true, memberId: availableMember.id };
  }

  const disabledMember = await findDisabledHouseholdMember({
    householdId,
    memberId,
    prisma: tx,
  });
  return disabledMember
    ? { ok: false, reason: "disabled_member" }
    : { ok: false, reason: "member_outside_household" };
}

function validateDraft(
  draft: LedgerRecordDraft,
  category: { id: string; status: "active" | "archived"; type: "income" | "expense" } | null,
  attribution: AttributionResolution,
): { ok: true } | Extract<KernelResult, { ok: false }> {
  if (!draft.name.trim()) {
    return { ok: false, reason: "missing_name" };
  }
  if (!Number.isInteger(draft.amountCents) || draft.amountCents <= 0) {
    return { ok: false, reason: "invalid_amount" };
  }
  if (!isIsoDate(draft.occurredOn)) {
    return { ok: false, reason: "invalid_date" };
  }
  if (!category) {
    return { ok: false, reason: "missing_category" };
  }
  if (category.status === "archived") {
    return { ok: false, reason: "archived_category" };
  }
  if (category.type !== draft.type) {
    return { ok: false, reason: "category_type_mismatch" };
  }
  if (draft.type === "expense" && draft.paymentSource === "fund" && draft.payerMemberId) {
    return { ok: false, reason: "fund_paid_expense_cannot_have_member_payer" };
  }
  return attribution;
}

function toPrismaLedgerRecordCreateData({
  id,
  householdId,
  createdByMemberId,
  draft,
}: {
  id: string;
  householdId: string;
  createdByMemberId: string;
  draft: LedgerRecordDraft;
}): Prisma.LedgerRecordCreateInput {
  const base = {
    id,
    household: { connect: { id: householdId } },
    type: draft.type,
    name: draft.name,
    amountCents: draft.amountCents,
    occurredOn: new Date(`${draft.occurredOn}T00:00:00.000Z`),
    category: { connect: { id: draft.categoryId } },
    createdByMember: { connect: { id: createdByMemberId } },
    status: "active" as const,
    ...(draft.note ? { note: draft.note } : {}),
  };

  if (draft.type === "income") {
    return {
      ...base,
      sourceMember: { connect: { id: draft.sourceMemberId } },
      reimbursementStatus: "not_applicable",
    };
  }

  if (draft.paymentSource === "fund") {
    return {
      ...base,
      paymentSource: "fund",
      reimbursementStatus: "not_refundable",
    };
  }

  return {
    ...base,
    paymentSource: "member",
    payerMember: { connect: { id: draft.payerMemberId } },
    reimbursementStatus: "refundable",
  };
}

function isIsoDate(value: string): boolean {
  const match = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/u.exec(value);
  if (!match?.groups) {
    return false;
  }

  const year = Number(match.groups.year);
  const month = Number(match.groups.month);
  const day = Number(match.groups.day);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}
