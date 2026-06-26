"use server";

import { revalidatePath } from "next/cache";
import {
  actionError,
  actionSuccess,
  type ActionState,
} from "@/app/action-state";
import { requireAuthenticatedMember } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import { authorize } from "@/modules/identity-access/authorization";
import {
  correctReimbursementPaymentEvidence,
} from "@/modules/reimbursement/reimbursement-payment-corrections";
import type {
  ReimbursementPaymentEvidenceRejectionReason,
} from "@/modules/reimbursement/reimbursement-payment";
import {
  mapReimbursementPaymentSearchResult,
  reimbursementPaymentSelect,
  type ReimbursementPaymentSearchResult,
} from "@/modules/reporting/reimbursement-payment-search-query";
import type { ActionFieldErrors } from "@/app/action-state";

export type EditReimbursementPaymentInput = {
  paymentId: string;
  paidOn?: string | null;
  method?: string | null;
  note?: string | null;
};

export type EditReimbursementPaymentField = "paidOn" | "method" | "note";
export type EditReimbursementPaymentActionCode =
  | ReimbursementPaymentEvidenceRejectionReason
  | "unauthorized"
  | "not_found"
  | "mutation_failed";
export type EditReimbursementPaymentActionState = ActionState<
  ReimbursementPaymentSearchResult,
  EditReimbursementPaymentField,
  EditReimbursementPaymentActionCode
>;

export type EditReimbursementPaymentActionResult =
  | {
      ok: true;
      record: ReimbursementPaymentSearchResult;
      message: "退款紀錄已更新";
    }
  | {
      ok: false;
      reason: EditReimbursementPaymentActionCode;
      message: string;
      fieldErrors?: ActionFieldErrors<EditReimbursementPaymentField>;
    };

export async function editReimbursementPaymentFormAction(
  _previousState: EditReimbursementPaymentActionState,
  formData: FormData,
): Promise<EditReimbursementPaymentActionState> {
  const result = await editReimbursementPaymentAction({
    paymentId: readFormValue(formData, "paymentId") ?? "",
    method: readFormValue(formData, "method"),
    paidOn: readFormValue(formData, "paidOn"),
    note: readFormValue(formData, "note"),
  });

  if (!result.ok) {
    return actionError<
      ReimbursementPaymentSearchResult,
      EditReimbursementPaymentField,
      EditReimbursementPaymentActionCode
    >(result.message, {
      code: result.reason,
      fieldErrors: result.fieldErrors,
    });
  }

  return actionSuccess<
    ReimbursementPaymentSearchResult,
    EditReimbursementPaymentField,
    EditReimbursementPaymentActionCode
  >(result.message, result.record);
}

export async function editReimbursementPaymentAction(
  input: EditReimbursementPaymentInput,
): Promise<EditReimbursementPaymentActionResult> {
  const session = await requireAuthenticatedMember();
  const authorization = authorize(session.access.member, {
    type: "edit_reimbursement_payment",
  });

  if (!authorization.allowed) {
    return {
      ok: false,
      reason: "unauthorized",
      message: "目前帳號沒有編輯退款紀錄權限。",
    };
  }

  const correction = correctReimbursementPaymentEvidence({
    method: input.method,
    paidOn: input.paidOn,
    note: input.note,
  });

  if (!correction.ok) {
    return {
      ok: false,
      reason: correction.reason,
      message: messageForPaymentError(correction.reason),
      fieldErrors: fieldErrorsForPaymentError(correction.reason),
    };
  }

  try {
    const prisma = getPrismaClient();
    const householdId = session.access.member.householdId;
    const actorId = session.access.member.id;
    const updatedRow = await prisma.$transaction(async (tx) => {
      const existing = await tx.reimbursementPayment.findFirst({
        where: {
          id: input.paymentId,
          householdId,
        },
        select: {
          id: true,
        },
      });

      if (!existing) {
        return null;
      }

      await tx.reimbursementPayment.update({
        where: {
          id: existing.id,
        },
        data: {
          method: correction.payment.method,
          paidOn: dateOnly(correction.payment.paidOn),
          note: correction.payment.note,
          editedAt: new Date(),
          editedByMemberId: actorId,
        },
      });

      return tx.reimbursementPayment.findFirst({
        where: {
          id: existing.id,
          householdId,
        },
        select: reimbursementPaymentSelect,
      });
    });

    if (!updatedRow) {
      return {
        ok: false,
        reason: "not_found",
        message: "找不到這筆退款紀錄。",
      };
    }

    revalidatePath("/");
    revalidatePath("/search");

    return {
      ok: true,
      record: mapReimbursementPaymentSearchResult(updatedRow),
      message: "退款紀錄已更新",
    };
  } catch {
    return {
      ok: false,
      reason: "mutation_failed",
      message: "退款紀錄儲存失敗，請稍後再試。",
    };
  }
}

function dateOnly(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`);
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

function fieldErrorsForPaymentError(
  reason: ReimbursementPaymentEvidenceRejectionReason,
): ActionFieldErrors<EditReimbursementPaymentField> {
  if (reason === "missing_payment_date" || reason === "invalid_payment_date") {
    return { paidOn: [messageForPaymentError(reason)] };
  }

  if (
    reason === "missing_payment_method" ||
    reason === "invalid_payment_method"
  ) {
    return { method: [messageForPaymentError(reason)] };
  }

  return {};
}

function readFormValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}
