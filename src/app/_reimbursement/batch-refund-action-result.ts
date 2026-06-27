import type { ReimbursementPaymentEvidenceRejectionReason } from "@/modules/reimbursement/reimbursement-payment";

export function isPaymentErrorReason(
  reason: string,
): reason is ReimbursementPaymentEvidenceRejectionReason {
  return [
    "invalid_payment_date",
    "invalid_payment_method",
    "missing_payment_date",
    "missing_payment_method",
  ].includes(reason);
}

export function messageForPaymentError(
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

export function messageForBatchRefundError(reason: string): string {
  if (reason === "permission_denied") {
    return "目前帳號沒有批次退款權限。";
  }

  if (reason === "cross_member_batch") {
    return "請一次退款同一位代墊成員的紀錄。";
  }

  return "沒有符合退款條件的紀錄。";
}
