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
import { writeReimbursementPaymentSettlement } from "@/modules/reimbursement/reimbursement-command";
import {
  validateReimbursementPaymentEvidence,
  type ReimbursementPaymentEvidenceRejectionReason,
} from "@/modules/reimbursement/reimbursement-payment";
import { authorize } from "@/modules/identity-access/authorization";
import {
  buildRecordSearchPageQuery,
  buildRecordSearchWhere,
  calculateRecordSearchNetTotal,
  cursorFromRecord,
  type SearchRecordCursor,
} from "@/modules/reporting/record-search-query";
import {
  buildReimbursementPaymentSearchPageQuery,
  buildReimbursementPaymentSearchWhere,
  cursorFromReimbursementPayment,
  mapReimbursementPaymentSearchResult,
  REIMBURSEMENT_PAYMENT_PAGE_SIZE,
  reimbursementPaymentSelect,
  type ReimbursementPaymentQueryState,
  type ReimbursementPaymentSearchCursor,
  type ReimbursementPaymentSearchResult,
} from "@/modules/reporting/reimbursement-payment-search-query";
import type { RecordQueryState } from "@/modules/reporting/record-query";
import { mapPrismaLedgerRecordToLedgerRecord } from "@/app/home-dashboard-data-source";

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

export type ReimbursementPaymentPageRequest = {
  query: ReimbursementPaymentQueryState;
  cursor?: ReimbursementPaymentSearchCursor | null;
};

export type ReimbursementPaymentPageResult =
  | {
      ok: true;
      records: ReimbursementPaymentSearchResult[];
      nextCursor: ReimbursementPaymentSearchCursor | null;
      totalCount: number;
      totalAmountCents: number;
    }
  | {
      ok: false;
      reason: "load_failed" | "unauthorized" | "invalid_query";
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
        | ReimbursementPaymentEvidenceRejectionReason
        | "cross_member_batch"
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
  const session = await requireAuthenticatedMember();

  try {
    const prisma = getPrismaClient();
    const householdId = session.access.member.householdId;
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

export async function loadReimbursementPaymentSearchPageAction(
  request: ReimbursementPaymentPageRequest,
): Promise<ReimbursementPaymentPageResult> {
  const session = await requireAuthenticatedMember();
  const authorization = authorize(session.access.member, {
    type: "browse_household_records",
  });

  if (!authorization.allowed) {
    return {
      ok: false,
      reason: "unauthorized",
      message: "目前帳號無法讀取退款紀錄。",
    };
  }

  try {
    const prisma = getPrismaClient();
    const householdId = session.access.member.householdId;
    const pageQuery = buildReimbursementPaymentSearchPageQuery({
      householdId,
      query: request.query,
      cursor: request.cursor,
    });
    const aggregateWhere = buildReimbursementPaymentSearchWhere(
      householdId,
      request.query,
    );
    const [rows, totalCount, aggregate] = await Promise.all([
      prisma.reimbursementPayment.findMany({
        ...pageQuery,
        where: pageQuery.where as Prisma.ReimbursementPaymentWhereInput,
        orderBy:
          pageQuery.orderBy as Prisma.ReimbursementPaymentOrderByWithRelationInput[],
        select: reimbursementPaymentSelect,
      }),
      prisma.reimbursementPayment.count({
        where: aggregateWhere as Prisma.ReimbursementPaymentWhereInput,
      }),
      prisma.reimbursementPayment.aggregate({
        where: aggregateWhere as Prisma.ReimbursementPaymentWhereInput,
        _sum: {
          amountCents: true,
        },
      }),
    ]);
    const pageRows = rows.slice(0, REIMBURSEMENT_PAYMENT_PAGE_SIZE);
    const records = pageRows.map(mapReimbursementPaymentSearchResult);
    const lastRecord = records.at(-1);

    return {
      ok: true,
      records,
      nextCursor: rows.length > REIMBURSEMENT_PAYMENT_PAGE_SIZE && lastRecord
        ? cursorFromReimbursementPayment(lastRecord)
        : null,
      totalCount,
      totalAmountCents: aggregate._sum.amountCents ?? 0,
    };
  } catch {
    return {
      ok: false,
      reason: "load_failed",
      message: "退款紀錄載入失敗，請稍後再試。",
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
          householdId: session.access.member.householdId,
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
          householdId: session.access.member.householdId,
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
  } catch (error) {
    console.error("Batch refund failed", error);

    return {
      ok: false,
      reason: "mutation_failed",
      message: "批次刪除失敗，請稍後再試。",
    };
  }
}

export async function batchRefundSearchRecordsAction(input: {
  recordIds: string[];
  payment: {
    method?: string | null;
    paidOn?: string | null;
    note?: string | null;
  };
}): Promise<BatchSearchRecordActionResult> {
  const session = await requireAuthenticatedMember();
  const selectedRecordIds = [...new Set(input.recordIds)];

  if (selectedRecordIds.length === 0) {
    return {
      ok: false,
      reason: "empty_selection",
      message: "請先選取要退款的紀錄。",
    };
  }

  const payment = validateReimbursementPaymentEvidence(input.payment);

  if (!payment.ok) {
    return {
      ok: false,
      reason: payment.reason,
      message: messageForPaymentError(payment.reason),
    };
  }

  try {
    const prisma = getPrismaClient();

    const result = await prisma.$transaction(async (tx) => {
      const rows = await tx.ledgerRecord.findMany({
        where: {
          householdId: session.access.member.householdId,
          id: {
            in: selectedRecordIds,
          },
        },
        select: ledgerRecordSelect,
      });
      const domainResult = batchMarkLedgerRecordsReimbursed(
        session.access.member,
        rows.map(mapPrismaLedgerRecordToLedgerRecord),
        { selectedRecordIds, requireSinglePayerMember: true },
      );

      if (!domainResult.ok) {
        return domainResult;
      }

      const settlement = await writeReimbursementPaymentSettlement({
        tx,
        householdId: session.access.member.householdId,
        actorId: session.access.member.id,
        reimbursedRecords: domainResult.reimbursedRecords,
        payment: payment.payment,
      });

      if (!settlement.ok) {
        return {
          ok: false as const,
          reason: "cross_member_batch" as const,
          skippedRecords: domainResult.skippedRecords,
        };
      }

      return domainResult;
    });

    if (!result.ok) {
      return {
        ok: false,
        reason: result.reason,
        skippedRecords: result.skippedRecords,
        message: messageForBatchRefundError(result.reason),
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

function messageForPaymentError(
  reason: ReimbursementPaymentEvidenceRejectionReason,
): string {
  const messages: Record<ReimbursementPaymentEvidenceRejectionReason, string> = {
    invalid_payment_date: "付款日期格式不正確。",
    invalid_payment_method: "付款方式不支援。",
    missing_payment_date: "請填寫付款日期。",
    missing_payment_method: "請選擇付款方式。",
  };

  return messages[reason];
}

function messageForBatchRefundError(reason: string): string {
  if (reason === "permission_denied") {
    return "目前帳號沒有批次退款權限。";
  }

  if (reason === "cross_member_batch") {
    return "請一次退款同一位代墊成員的紀錄。";
  }

  return "沒有符合退款條件的紀錄。";
}
