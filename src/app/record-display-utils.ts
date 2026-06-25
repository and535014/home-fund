import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";

export function recordActorLabel(
  record: LedgerRecord,
  memberNames: Record<string, string>,
): string {
  if (record.type === "income") {
    return memberNames[record.sourceMemberId] ?? "成員";
  }

  if (record.paymentSource === "member") {
    return memberNames[record.payerMemberId ?? ""] ?? "成員";
  }

  return "基金";
}

export function formatRecordDate(date: string): string {
  return date.replaceAll("-", "/");
}
