export type { ReimbursementPaymentSearchResult } from "@/modules/reporting/reimbursement-payment-search-query";

export function formatPaymentDate(value: string) {
  return value.replaceAll("-", "/");
}
