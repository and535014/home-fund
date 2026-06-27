import { describe, expect, it } from "vitest";
import {
  getBatchRefundDialogState,
  readBatchRefundPaymentFormData,
} from "./batch-refund-client";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";

type ExpenseRecord = Extract<LedgerRecord, { type: "expense" }>;

const linExpense = refundableExpense("expense-lin", "member-lin", 120000);
const wuExpense = refundableExpense("expense-wu", "member-wu", 80000);

describe("getBatchRefundDialogState", () => {
  it("summarizes eligible refund records for one paid-to member", () => {
    expect(
      getBatchRefundDialogState(financeManager, [
        linExpense,
        { ...linExpense, id: "expense-lin-2", amountCents: 30000 },
      ]),
    ).toMatchObject({
      eligibleTotalCents: 150000,
      hasCrossMemberSelection: false,
      hasSinglePaidToMember: true,
      skippedCount: 0,
    });
  });

  it("skips ineligible records in the preview", () => {
    const state = getBatchRefundDialogState(financeManager, [
      linExpense,
      {
        ...linExpense,
        id: "already-reimbursed",
        reimbursementStatus: "reimbursed",
      },
    ]);

    expect(state.eligibleRecords.map((record) => record.id)).toEqual([
      "expense-lin",
    ]);
    expect(state.skippedCount).toBe(1);
    expect(state.eligibleTotalCents).toBe(120000);
  });

  it("detects cross-member eligible selections", () => {
    expect(
      getBatchRefundDialogState(financeManager, [linExpense, wuExpense]),
    ).toMatchObject({
      hasCrossMemberSelection: true,
      hasSinglePaidToMember: false,
    });
  });
});

describe("readBatchRefundPaymentFormData", () => {
  it("reads reimbursement payment fields from the shared form", () => {
    const formData = new FormData();

    formData.set("reimbursementMethod", "bank_transfer");
    formData.set("reimbursementPaidOn", "2026-06-27");
    formData.set("reimbursementReference", "末五碼 12345");

    expect(readBatchRefundPaymentFormData(formData)).toEqual({
      method: "bank_transfer",
      note: "末五碼 12345",
      paidOn: "2026-06-27",
    });
  });
});

const financeManager: HouseholdAccessProfile = {
  id: "member-finance",
  householdId: "household-1",
  displayName: "Finance",
  roles: ["finance_manager"],
  capabilities: [],
};

function refundableExpense(
  id: string,
  payerMemberId: string,
  amountCents: number,
): ExpenseRecord {
  return {
    id,
    type: "expense",
    name: id,
    amountCents,
    occurredOn: "2026-06-10",
    categoryId: "category-food",
    createdByMemberId: payerMemberId,
    paymentSource: "member",
    payerMemberId,
    reimbursementStatus: "refundable",
    status: "active",
  };
}
