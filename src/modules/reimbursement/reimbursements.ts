import type {
  AuthenticatedMember,
  AuthorizationResult,
} from "../identity-access/authorization";
import { authorize } from "../identity-access/authorization";
import type { ExpenseLedgerRecord } from "../fund-ledger/ledger-records";

export type MarkExpensesReimbursedCommand = {
  selectedExpenseIds: string[];
};

export type MarkExpensesReimbursedResult =
  | {
      ok: true;
      reimbursedExpenses: ExpenseLedgerRecord[];
      events: ("Reimbursement expenses selected" | "Expenses reimbursed")[];
    }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "empty_selection"
        | "expense_not_found"
        | "not_refundable"
        | "already_reimbursed";
      expenseId?: string;
      authorizationReason?: Exclude<AuthorizationResult, { allowed: true }>["reason"];
    };

export function markExpensesReimbursed(
  actor: AuthenticatedMember,
  expenses: ExpenseLedgerRecord[],
  command: MarkExpensesReimbursedCommand,
): MarkExpensesReimbursedResult {
  const authorizationResult = authorize(actor, { type: "perform_reimbursement" });

  if (!authorizationResult.allowed) {
    return {
      ok: false,
      reason: "permission_denied",
      authorizationReason: authorizationResult.reason,
    };
  }

  if (command.selectedExpenseIds.length === 0) {
    return { ok: false, reason: "empty_selection" };
  }

  const expenseById = new Map(
    expenses.map((expense) => [expense.id, expense] as const),
  );
  const selectedExpenses: ExpenseLedgerRecord[] = [];

  for (const expenseId of command.selectedExpenseIds) {
    const expense = expenseById.get(expenseId);

    if (!expense) {
      return { ok: false, reason: "expense_not_found", expenseId };
    }

    if (expense.reimbursementStatus === "reimbursed") {
      return { ok: false, reason: "already_reimbursed", expenseId };
    }

    if (
      expense.paymentSource !== "member" ||
      expense.reimbursementStatus !== "refundable"
    ) {
      return { ok: false, reason: "not_refundable", expenseId };
    }

    selectedExpenses.push(expense);
  }

  return {
    ok: true,
    reimbursedExpenses: selectedExpenses.map((expense) => ({
      ...expense,
      reimbursementStatus: "reimbursed",
    })),
    events: ["Reimbursement expenses selected", "Expenses reimbursed"],
  };
}
