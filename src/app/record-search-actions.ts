"use server";

import { revalidatePath } from "next/cache";
import { requireAuthenticatedMember } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import type { Prisma } from "@/generated/prisma/client";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import {
  batchDeleteLedgerRecords,
  type BatchDeleteSkippedRecord,
} from "@/modules/fund-ledger/ledger-record-batch-actions";
import {
  batchMarkLedgerRecordsReimbursed,
  type BatchReimbursementSkippedRecord,
} from "@/modules/reimbursement/reimbursement-batch-actions";
import {
  buildRecordSearchPageQuery,
  buildRecordSearchWhere,
  calculateRecordSearchNetTotal,
  cursorFromRecord,
  type SearchRecordCursor,
} from "@/modules/reporting/record-search-query";
import type { RecordQueryState } from "./record-query";
import { mapPrismaLedgerRecordToLedgerRecord } from "./home-dashboard-data-source";

const DEFAULT_HOUSEHOLD_ID = "household-demo";

export type SearchRecordPageRequest = {
  query: RecordQueryState;
  cursor?: SearchRecordCursor | null;
};

export type SearchRecordPageResult =
  | {
      ok: true;
      records: LedgerRecord[];
      nextCursor: SearchRecordCursor | null;
      totalCount: number;
      totalNetAmountCents: number;
    }
  | {
      ok: false;
      reason: "load_failed";
      message: string;
    };

export type BatchSearchRecordActionResult =
  | {
      ok: true;
      processedRecordIds: string[];
      skippedRecords: (BatchDeleteSkippedRecord | BatchReimbursementSkippedRecord)[];
      processedCount: number;
      skippedCount: number;
      refundTotalCents?: number;
      message: string;
    }
  | {
      ok: false;
      reason:
        | "empty_selection"
        | "no_eligible_records"
        | "permission_denied"
        | "mutation_failed";
      skippedRecords?: (BatchDeleteSkippedRecord | BatchReimbursementSkippedRecord)[];
      message: string;
    };

const ledgerRecordSelect = {
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
} as const;

export async function loadRecordSearchPageAction(
  request: SearchRecordPageRequest,
): Promise<SearchRecordPageResult> {
  await requireAuthenticatedMember();

  try {
    const prisma = getPrismaClient();
    const householdId = DEFAULT_HOUSEHOLD_ID;
    const pageQuery = buildRecordSearchPageQuery({
      householdId,
      query: request.query,
      cursor: request.cursor,
    });
    const aggregateWhere = buildRecordSearchWhere(householdId, request.query);
    const [rows, totalCount, groups] = await Promise.all([
      prisma.ledgerRecord.findMany({
        ...pageQuery,
        where: pageQuery.where as Prisma.LedgerRecordWhereInput,
        orderBy: pageQuery.orderBy as Prisma.LedgerRecordOrderByWithRelationInput[],
        select: ledgerRecordSelect,
      }),
      prisma.ledgerRecord.count({
        where: aggregateWhere as Prisma.LedgerRecordWhereInput,
      }),
      prisma.ledgerRecord.groupBy({
        by: ["type"],
        where: aggregateWhere as Prisma.LedgerRecordWhereInput,
        _sum: {
          amountCents: true,
        },
      }),
    ]);
    const pageRows = rows.slice(0, 100);
    const records = pageRows.map(mapPrismaLedgerRecordToLedgerRecord);
    const lastRecord = records.at(-1);

    return {
      ok: true,
      records,
      nextCursor: rows.length > 100 && lastRecord
        ? cursorFromRecord(lastRecord)
        : null,
      totalCount,
      totalNetAmountCents: calculateRecordSearchNetTotal(groups),
    };
  } catch {
    return {
      ok: false,
      reason: "load_failed",
      message: "搜尋結果載入失敗，請稍後再試。",
    };
  }
}

export async function batchDeleteSearchRecordsAction(
  recordIds: string[],
): Promise<BatchSearchRecordActionResult> {
  const session = await requireAuthenticatedMember();
  const selectedRecordIds = [...new Set(recordIds)];

  if (selectedRecordIds.length === 0) {
    return {
      ok: false,
      reason: "empty_selection",
      message: "請先選取要刪除的紀錄。",
    };
  }

  try {
    const prisma = getPrismaClient();

    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.ledgerRecord.findMany({
        where: {
          householdId: DEFAULT_HOUSEHOLD_ID,
          id: {
            in: selectedRecordIds,
          },
        },
        select: ledgerRecordSelect,
      });
      const domainResult = batchDeleteLedgerRecords(
        session.access.member,
        rows.map(mapPrismaLedgerRecordToLedgerRecord),
        { selectedRecordIds },
      );

      if (!domainResult.ok) {
        return domainResult;
      }

      await tx.ledgerRecord.updateMany({
        where: {
          householdId: DEFAULT_HOUSEHOLD_ID,
          id: {
            in: domainResult.processedRecords.map((record) => record.id),
          },
        },
        data: {
          status: "voided",
        },
      });

      return domainResult;
    });

    if (!result.ok) {
      return {
        ok: false,
        reason: result.reason,
        message: "請先選取要刪除的紀錄。",
      };
    }

    revalidatePath("/");
    revalidatePath("/search");

    return {
      ok: true,
      processedRecordIds: result.processedRecords.map((record) => record.id),
      skippedRecords: result.skippedRecords,
      processedCount: result.processedRecords.length,
      skippedCount: result.skippedRecords.length,
      message: `已刪除 ${result.processedRecords.length} 筆紀錄。`,
    };
  } catch {
    return {
      ok: false,
      reason: "mutation_failed",
      message: "批次刪除失敗，請稍後再試。",
    };
  }
}

export async function batchRefundSearchRecordsAction(
  recordIds: string[],
): Promise<BatchSearchRecordActionResult> {
  const session = await requireAuthenticatedMember();
  const selectedRecordIds = [...new Set(recordIds)];

  if (selectedRecordIds.length === 0) {
    return {
      ok: false,
      reason: "empty_selection",
      message: "請先選取要退款的紀錄。",
    };
  }

  try {
    const prisma = getPrismaClient();

    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.ledgerRecord.findMany({
        where: {
          householdId: DEFAULT_HOUSEHOLD_ID,
          id: {
            in: selectedRecordIds,
          },
        },
        select: ledgerRecordSelect,
      });
      const domainResult = batchMarkLedgerRecordsReimbursed(
        session.access.member,
        rows.map(mapPrismaLedgerRecordToLedgerRecord),
        { selectedRecordIds },
      );

      if (!domainResult.ok) {
        return domainResult;
      }

      const reimbursedRecordIds = domainResult.reimbursedRecords.map(
        (record) => record.id,
      );

      await tx.reimbursementBatch.create({
        data: {
          id: crypto.randomUUID(),
          householdId: DEFAULT_HOUSEHOLD_ID,
          reimbursedById: session.access.member.id,
          reimbursedAt: new Date(),
          items: {
            create: reimbursedRecordIds.map((ledgerRecordId) => ({
              ledgerRecordId,
            })),
          },
        },
      });
      await tx.ledgerRecord.updateMany({
        where: {
          householdId: DEFAULT_HOUSEHOLD_ID,
          id: {
            in: reimbursedRecordIds,
          },
          status: "active",
        },
        data: {
          reimbursementStatus: "reimbursed",
        },
      });

      return domainResult;
    });

    if (!result.ok) {
      return {
        ok: false,
        reason: result.reason,
        skippedRecords: result.skippedRecords,
        message: result.reason === "permission_denied"
          ? "目前帳號沒有批次退款權限。"
          : "沒有符合退款條件的紀錄。",
      };
    }

    revalidatePath("/");
    revalidatePath("/search");

    return {
      ok: true,
      processedRecordIds: result.reimbursedRecords.map((record) => record.id),
      skippedRecords: result.skippedRecords,
      processedCount: result.reimbursedRecords.length,
      skippedCount: result.skippedRecords.length,
      refundTotalCents: result.refundTotalCents,
      message: `已退款 ${result.reimbursedRecords.length} 筆紀錄。`,
    };
  } catch {
    return {
      ok: false,
      reason: "mutation_failed",
      message: "批次退款失敗，請稍後再試。",
    };
  }
}
