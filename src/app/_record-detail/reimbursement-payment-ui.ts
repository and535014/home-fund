export type { ReimbursementPaymentSearchResult } from "@/modules/reimbursement/reimbursement-payment-search-query";

export function formatPaymentDate(value: string) {
  return value.replaceAll("-", "/");
}
