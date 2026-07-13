export const LEDGER_RECORD_ENTRY_KIND = {
  fundExpense: "fund-expense",
  income: "income",
  memberExpense: "member-expense",
} as const;

export type LedgerRecordEntryKind =
  (typeof LEDGER_RECORD_ENTRY_KIND)[keyof typeof LEDGER_RECORD_ENTRY_KIND];

export type LedgerRecordEntryFields =
  | { recordType: "income"; paymentSource: null }
  | { recordType: "expense"; paymentSource: "fund" | "member" };

export function ledgerRecordFieldsForEntryKind(
  kind: LedgerRecordEntryKind,
): LedgerRecordEntryFields {
  if (kind === LEDGER_RECORD_ENTRY_KIND.income) {
    return { recordType: "income", paymentSource: null };
  }

  return {
    recordType: "expense",
    paymentSource:
      kind === LEDGER_RECORD_ENTRY_KIND.fundExpense ? "fund" : "member",
  };
}

export function ledgerRecordEntryKindForRecord(
  record:
    | { type: "income" }
    | { type: "expense"; paymentSource: "fund" | "member" },
): LedgerRecordEntryKind {
  if (record.type === "income") {
    return LEDGER_RECORD_ENTRY_KIND.income;
  }

  return record.paymentSource === "fund"
    ? LEDGER_RECORD_ENTRY_KIND.fundExpense
    : LEDGER_RECORD_ENTRY_KIND.memberExpense;
}
