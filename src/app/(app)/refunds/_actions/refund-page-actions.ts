"use server";

import { requireAuthenticatedMember } from "@/auth/app-access";
import {
  isPaymentErrorReason,
  messageForBatchRefundError,
  messageForPaymentError,
} from "@/app/_reimbursement/batch-refund-action-result";
import {
  actionError,
  type ActionState,
} from "@/app/action-state";
import { actionSuccessWithRevalidation } from "@/app/server-action-adapter";
import { getPrismaClient } from "@/db/prisma";
import { authorize } from "@/modules/identity-access/authorization";
import {
  type BatchReimbursementSkippedRecord,
} from "@/modules/reimbursement/reimbursement-batch-actions";
import { batchMarkLedgerRecordsReimbursedInDatabase } from "@/modules/reimbursement/reimbursement-command";
import {
  type ReimbursementPaymentEvidenceRejectionReason,
} from "@/modules/reimbursement/reimbursement-payment";
import {
  loadRefundPageInDatabase,
  type RefundPageData,
} from "@/modules/reimbursement/refund-page/refund-page-query";

export type RefundPageLoadResult =
  | {
      ok: true;
      canEditReimbursementPayments: boolean;
      data: RefundPageData;
    }
  | {
      ok: false;
      reason: "unauthorized" | "load_failed";
      message: string;
    };

export type BatchRefundPageActionData = {
  processedRecordIds: string[];
  skippedRecords: BatchReimbursementSkippedRecord[];
  processedCount: number;
  skippedCount: number;
  refundTotalCents: number;
};

export type BatchRefundPageActionCode =
  | ReimbursementPaymentEvidenceRejectionReason
  | "cross_member_batch"
  | "empty_selection"
  | "mutation_failed"
  | "no_eligible_records"
  | "permission_denied";

export type BatchRefundPageActionField =
  | "recordIds"
  | "reimbursementMethod"
  | "reimbursementPaidOn";

export type BatchRefundPageActionState = ActionState<
  BatchRefundPageActionData,
  BatchRefundPageActionField,
  BatchRefundPageActionCode
>;

export async function loadRefundPageDataAction(
  month: string,
): Promise<RefundPageLoadResult> {
  const session = await requireAuthenticatedMember();
  const browseAuthorization = authorize(session.access.member, {
    type: "browse_household_records",
  });

  if (!browseAuthorization.allowed) {
    return {
      ok: false,
      reason: "unauthorized",
      message: "目前帳號無法讀取退款資料。",
    };
  }

  try {
    return {
      ok: true,
      canEditReimbursementPayments: authorize(session.access.member, {
        type: "edit_reimbursement_payment",
      }).allowed,
      data: await loadRefundPageInDatabase({
        householdId: session.access.member.householdId,
        month,
        prisma: getPrismaClient(),
      }),
    };
  } catch {
    return {
      ok: false,
      reason: "load_failed",
      message: "退款資料載入失敗，請稍後再試。",
    };
  }
}

export async function batchRefundRefundPageRecordsAction(input: {
  recordIds: string[];
  payment: {
    method?: string | null;
    paidOn?: string | null;
    note?: string | null;
  };
}): Promise<BatchRefundPageActionState> {
  const session = await requireAuthenticatedMember();
  const selectedRecordIds = [...new Set(input.recordIds)];

  if (selectedRecordIds.length === 0) {
    return batchRefundPageActionError(
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
      const message = isPaymentErrorReason(result.reason)
        ? messageForPaymentError(result.reason)
        : messageForBatchRefundError(result.reason);

      return batchRefundPageActionError(result.reason, message);
    }

    return actionSuccessWithRevalidation<
      BatchRefundPageActionData,
      BatchRefundPageActionField,
      BatchRefundPageActionCode
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
    return batchRefundPageActionError(
      "mutation_failed",
      "批次退款失敗，請稍後再試。",
    );
  }
}

function batchRefundPageActionError(
  code: BatchRefundPageActionCode,
  message: string,
): BatchRefundPageActionState {
  return actionError<
    BatchRefundPageActionData,
    BatchRefundPageActionField,
    BatchRefundPageActionCode
  >(message, {
    code,
    fieldErrors: {
      [batchRefundPageActionFieldForError(code)]: [message],
    },
  });
}

function batchRefundPageActionFieldForError(
  code: BatchRefundPageActionCode,
): BatchRefundPageActionField {
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
