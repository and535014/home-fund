import { describe, expect, it } from "vitest";
import {
  LEDGER_RECORD_ENTRY_KIND,
  ledgerRecordEntryKindForRecord,
  ledgerRecordFieldsForEntryKind,
} from "./ledger-record-entry-kind";

describe("ledger record entry kind", () => {
  it.each([
    [LEDGER_RECORD_ENTRY_KIND.income, { recordType: "income", paymentSource: null }],
    [LEDGER_RECORD_ENTRY_KIND.memberExpense, { recordType: "expense", paymentSource: "member" }],
    [LEDGER_RECORD_ENTRY_KIND.fundExpense, { recordType: "expense", paymentSource: "fund" }],
  ] as const)("maps %s to submitted ledger fields", (kind, expected) => {
    expect(ledgerRecordFieldsForEntryKind(kind)).toEqual(expected);
  });

  it("derives the initial kind from a persisted ledger record", () => {
    expect(ledgerRecordEntryKindForRecord({ type: "income" })).toBe("income");
    expect(ledgerRecordEntryKindForRecord({
      type: "expense",
      paymentSource: "member",
    })).toBe("member-expense");
    expect(ledgerRecordEntryKindForRecord({
      type: "expense",
      paymentSource: "fund",
    })).toBe("fund-expense");
  });
});
