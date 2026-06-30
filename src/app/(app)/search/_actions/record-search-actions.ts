"use server";

import { requireAuthenticatedMember } from "@/auth/app-access";
import {
  actionError,
  type ActionState,
} from "@/app/action-state";
import { actionSuccessWithRevalidation } from "@/app/server-action-adapter";
import { getPrismaClient } from "@/db/prisma";
import {
  mapPrismaLedgerRecordToLedgerRecord,
  prismaLedgerRecordSelect,
} from "@/modules/fund-ledger/ledger-record-prisma-adapter";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import {
  batchDeleteLedgerRecords,
  type BatchDeleteSkippedRecord,
} from "@/modules/fund-ledger/ledger-record-batch-actions";
import {
  type BatchReimbursementSkippedRecord,
} from "@/modules/reimbursement/reimbursement-batch-actions";
import { batchMarkLedgerRecordsReimbursedInDatabase } from "@/modules/reimbursement/reimbursement-command";
import {
  type ReimbursementPaymentEvidenceRejectionReason,
} from "@/modules/reimbursement/reimbursement-payment";
import {
  isPaymentErrorReason,
  messageForBatchRefundError,
  messageForPaymentError,
} from "@/app/_reimbursement/batch-refund-action-result";
import { authorize } from "@/modules/identity-access/authorization";
import {
  loadRecordSearchPageInDatabase,
  type SearchRecordCursor,
} from "@/modules/fund-ledger/search/record-search-query";
import {
  loadReimbursementPaymentSearchPageInDatabase,
  type ReimbursementPaymentQueryState,
  type ReimbursementPaymentSearchCursor,
  type ReimbursementPaymentSearchResult,
} from "@/modules/reimbursement/reimbursement-payment-search-query";
import type { RecordQueryState } from "@/modules/fund-ledger/search/record-search-state";
import {
  loadPendingRecurringOccurrenceRecordsForSearch,
  type PendingRecurringOccurrencePrismaClient,
} from "@/modules/recurring/recurring-occurrence-query";

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

export type BatchSearchRecordActionData = {
  processedRecordIds: string[];
  skippedRecords: (BatchDeleteSkippedRecord | BatchReimbursementSkippedRecord)[];
  processedCount: number;
  skippedCount: number;
  refundTotalCents?: number;
};

export type BatchSearchRecordActionCode =
  | ReimbursementPaymentEvidenceRejectionReason
  | "cross_member_batch"
  | "empty_selection"
  | "mutation_failed"
  | "no_eligible_records"
  | "permission_denied";

export type BatchSearchRecordActionField =
  | "recordIds"
  | "reimbursementMethod"
  | "reimbursementPaidOn";

export type BatchSearchRecordActionState = ActionState<
  BatchSearchRecordActionData,
  BatchSearchRecordActionField,
  BatchSearchRecordActionCode
>;

export async function loadRecordSearchPageAction(
  request: SearchRecordPageRequest,
): Promise<SearchRecordPageResult> {
  const session = await requireAuthenticatedMember();

  try {
    const prisma = getPrismaClient();
    const page = await loadRecordSearchPageInDatabase({
      prisma,
      householdId: session.access.member.householdId,
      query: request.query,
      cursor: request.cursor,
    });
    const pendingRecurringRecords = request.cursor
      ? []
      : await loadPendingRecurringOccurrenceRecordsForSearch({
          householdId: session.access.member.householdId,
          prisma: prisma as unknown as PendingRecurringOccurrencePrismaClient,
          query: request.query,
        });

    return {
      ok: true,
      ...page,
      records: [...pendingRecurringRecords, ...page.records],
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
    const page = await loadReimbursementPaymentSearchPageInDatabase({
      prisma: getPrismaClient(),
      householdId: session.access.member.householdId,
      query: request.query,
      cursor: request.cursor,
    });

    return {
      ok: true,
      ...page,
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
): Promise<BatchSearchRecordActionState> {
  const session = await requireAuthenticatedMember();
  const selectedRecordIds = [...new Set(recordIds)];

  if (selectedRecordIds.length === 0) {
    return batchSearchRecordActionError(
      "empty_selection",
      "請先選取要刪除的紀錄。",
    );
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
        select: prismaLedgerRecordSelect,
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
      return batchSearchRecordActionError(
        result.reason,
        "請先選取要刪除的紀錄。",
      );
    }

    return actionSuccessWithRevalidation<
      BatchSearchRecordActionData,
      BatchSearchRecordActionField,
      BatchSearchRecordActionCode
    >(
      `已刪除 ${result.processedRecords.length} 筆紀錄。`,
      {
        processedRecordIds: result.processedRecords.map((record) => record.id),
        skippedRecords: result.skippedRecords,
        processedCount: result.processedRecords.length,
        skippedCount: result.skippedRecords.length,
      },
      ["/", "/search"],
    );
  } catch (error) {
    console.error("Batch refund failed", error);

    return batchSearchRecordActionError(
      "mutation_failed",
      "批次刪除失敗，請稍後再試。",
    );
  }
}

export async function batchRefundSearchRecordsAction(input: {
  recordIds: string[];
  payment: {
    method?: string | null;
    paidOn?: string | null;
    note?: string | null;
  };
}): Promise<BatchSearchRecordActionState> {
  const session = await requireAuthenticatedMember();
  const selectedRecordIds = [...new Set(input.recordIds)];

  if (selectedRecordIds.length === 0) {
    return batchSearchRecordActionError(
      "empty_selection",
      "請先選取要退款的紀錄。",
    );
  }

  try {
    const result = await batchMarkLedgerRecordsReimbursedInDatabase(
      session.access.member,
      { selectedRecordIds, requireSinglePayerMember: true },
      {
        prisma: getPrismaClient(),
        householdId: session.access.member.householdId,
        payment: input.payment,
      },
    );

    if (!result.ok) {
      return batchSearchRecordActionError(
        result.reason,
        isPaymentErrorReason(result.reason)
          ? messageForPaymentError(result.reason)
          : messageForBatchRefundError(result.reason),
      );
    }

    return actionSuccessWithRevalidation<
      BatchSearchRecordActionData,
      BatchSearchRecordActionField,
      BatchSearchRecordActionCode
    >(
      `已退款 ${result.reimbursedRecords.length} 筆紀錄。`,
      {
        processedRecordIds: result.reimbursedRecords.map((record) => record.id),
        skippedRecords: result.skippedRecords,
        processedCount: result.reimbursedRecords.length,
        skippedCount: result.skippedRecords.length,
        refundTotalCents: result.refundTotalCents,
      },
      ["/", "/search", "/refunds"],
    );
  } catch {
    return batchSearchRecordActionError(
      "mutation_failed",
      "批次退款失敗，請稍後再試。",
    );
  }
}

function batchSearchRecordActionError(
  code: BatchSearchRecordActionCode,
  message: string,
): BatchSearchRecordActionState {
  return actionError<
    BatchSearchRecordActionData,
    BatchSearchRecordActionField,
    BatchSearchRecordActionCode
  >(message, {
    code,
    fieldErrors: {
      [batchSearchRecordActionFieldForError(code)]: [message],
    },
  });
}

function batchSearchRecordActionFieldForError(
  code: BatchSearchRecordActionCode,
): BatchSearchRecordActionField {
  if (
    code === "invalid_payment_method" ||
    code === "missing_payment_method"
  ) {
    return "reimbursementMethod";
  }

  if (code === "invalid_payment_date" || code === "missing_payment_date") {
    return "reimbursementPaidOn";
  }

  return "recordIds";
}
