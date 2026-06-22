import { describe, expect, it } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import type {
  ExpenseLedgerRecord,
  IncomeLedgerRecord,
  LedgerRecord,
} from "../fund-ledger/ledger-records";
import { batchMarkLedgerRecordsReimbursed } from "./reimbursement-batch-actions";

const financeManager: AuthenticatedMember = {
  id: "member-fin",
  googleAccountLinked: true,
  roles: ["finance_manager"],
};

const generalMember: AuthenticatedMember = {
  id: "member-mei",
  googleAccountLinked: true,
  roles: ["general_member"],
};

const refundableExpense: ExpenseLedgerRecord = {
  id: "expense-refundable",
  type: "expense",
  name: "日用品代墊",
  amountCents: 3_200,
  occurredOn: "2026-06-09",
  categoryId: "expense-grocery",
  createdByMemberId: "member-mei",
  paymentSource: "member",
  payerMemberId: "member-mei",
  reimbursementStatus: "refundable",
  status: "active",
};

const fundPaidExpense: ExpenseLedgerRecord = {
  ...refundableExpense,
  id: "expense-fund-paid",
  paymentSource: "fund",
  payerMemberId: undefined,
  reimbursementStatus: "not_refundable",
};

const income: IncomeLedgerRecord = {
  id: "income-rent",
  type: "income",
  name: "房租",
  amountCents: 80_000,
  occurredOn: "2026-06-01",
  categoryId: "income-rent",
  createdByMemberId: "member-mei",
  sourceMemberId: "member-mei",
  reimbursementStatus: "not_applicable",
  status: "active",
};

describe("batchMarkLedgerRecordsReimbursed", () => {
  it("reimburses eligible records and returns skipped reasons", () => {
    const records: LedgerRecord[] = [
      refundableExpense,
      fundPaidExpense,
      income,
      {
        ...refundableExpense,
        id: "expense-already-reimbursed",
        reimbursementStatus: "reimbursed",
      },
      {
        ...refundableExpense,
        id: "expense-voided",
        status: "voided",
      },
    ];

    expect(batchMarkLedgerRecordsReimbursed(financeManager, records, {
      selectedRecordIds: [
        "expense-refundable",
        "expense-fund-paid",
        "income-rent",
        "expense-already-reimbursed",
        "expense-voided",
        "missing-record",
      ],
    })).toEqual({
      ok: true,
      reimbursedRecords: [
        { ...refundableExpense, reimbursementStatus: "reimbursed" },
      ],
      skippedRecords: [
        { recordId: "expense-fund-paid", reason: "fund_paid_expense" },
        { recordId: "income-rent", reason: "not_expense" },
        { recordId: "expense-already-reimbursed", reason: "already_reimbursed" },
        { recordId: "expense-voided", reason: "record_voided" },
        { recordId: "missing-record", reason: "record_not_found" },
      ],
      refundTotalCents: 3_200,
      events: ["Reimbursement expenses selected", "Expenses reimbursed"],
    });
  });

  it("rejects the whole batch when actor cannot perform reimbursements", () => {
    expect(batchMarkLedgerRecordsReimbursed(generalMember, [refundableExpense], {
      selectedRecordIds: ["expense-refundable"],
    })).toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "finance_manager_required",
    });
  });

  it("returns no_eligible_records when every selected record is skipped", () => {
    expect(batchMarkLedgerRecordsReimbursed(financeManager, [fundPaidExpense], {
      selectedRecordIds: ["expense-fund-paid"],
    })).toEqual({
      ok: false,
      reason: "no_eligible_records",
      skippedRecords: [
        { recordId: "expense-fund-paid", reason: "fund_paid_expense" },
      ],
    });
  });
});
