import { describe, expect, it } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import type { ExpenseLedgerRecord } from "../fund-ledger/ledger-records";
import { markExpensesReimbursed } from "./reimbursements";

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

describe("markExpensesReimbursed", () => {
  it("allows a finance manager to mark refundable expenses reimbursed once", () => {
    const result = markExpensesReimbursed(financeManager, [refundableExpense], {
      selectedExpenseIds: ["expense-refundable"],
    });

    expect(result).toEqual({
      ok: true,
      reimbursedExpenses: [
        {
          ...refundableExpense,
          reimbursementStatus: "reimbursed",
        },
      ],
      events: ["Reimbursement expenses selected", "Expenses reimbursed"],
    });
  });

  it("rejects reimbursement by a general member", () => {
    const result = markExpensesReimbursed(generalMember, [refundableExpense], {
      selectedExpenseIds: ["expense-refundable"],
    });

    expect(result).toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "finance_manager_required",
    });
  });

  it("rejects already reimbursed expenses", () => {
    const result = markExpensesReimbursed(financeManager, [
      {
        ...refundableExpense,
        reimbursementStatus: "reimbursed",
      },
    ], {
      selectedExpenseIds: ["expense-refundable"],
    });

    expect(result).toEqual({
      ok: false,
      reason: "already_reimbursed",
      expenseId: "expense-refundable",
    });
  });

  it("rejects fund-paid expenses and empty selections", () => {
    expect(markExpensesReimbursed(financeManager, [{
      ...refundableExpense,
      id: "expense-fund",
      paymentSource: "fund",
      payerMemberId: undefined,
      reimbursementStatus: "not_refundable",
    }], {
      selectedExpenseIds: ["expense-fund"],
    })).toEqual({
      ok: false,
      reason: "not_refundable",
      expenseId: "expense-fund",
    });

    expect(markExpensesReimbursed(financeManager, [refundableExpense], {
      selectedExpenseIds: [],
    })).toEqual({
      ok: false,
      reason: "empty_selection",
    });
  });

  it("rejects unknown selected expense ids", () => {
    const result = markExpensesReimbursed(financeManager, [refundableExpense], {
      selectedExpenseIds: ["expense-missing"],
    });

    expect(result).toEqual({
      ok: false,
      reason: "expense_not_found",
      expenseId: "expense-missing",
    });
  });

  it("rejects voided expenses", () => {
    const result = markExpensesReimbursed(financeManager, [
      {
        ...refundableExpense,
        status: "voided",
      },
    ], {
      selectedExpenseIds: ["expense-refundable"],
    });

    expect(result).toEqual({
      ok: false,
      reason: "not_refundable",
      expenseId: "expense-refundable",
    });
  });
});
