import type {
  ExpenseLedgerRecord,
  LedgerRecord,
} from "../fund-ledger/ledger-records";

export type ReimbursementTableMember = {
  id: string;
  displayName: string;
};

export type ReimbursementTableExpense = {
  id: string;
  amountCents: number;
  occurredOn: string;
  categoryId: string;
  reimbursementStatus: "refundable";
};

export type ReimbursementTableGroup = {
  memberId: string;
  displayName: string;
  totalAmountCents: number;
  expenseIds: string[];
  expenses: ReimbursementTableExpense[];
};

export type MonthlyReimbursementTable = {
  month: string;
  totalAmountCents: number;
  groups: ReimbursementTableGroup[];
  events: ["Monthly reimbursement table generated"];
};

export type BuildMonthlyReimbursementTableInput = {
  month: string;
  members: ReimbursementTableMember[];
  records: LedgerRecord[];
};

export function buildMonthlyReimbursementTable(
  input: BuildMonthlyReimbursementTableInput,
): MonthlyReimbursementTable {
  const memberNameById = new Map(
    input.members.map((member) => [member.id, member.displayName] as const),
  );
  const groupsByMemberId = new Map<string, ReimbursementTableGroup>();

  for (const expense of refundableExpensesForMonth(input.records, input.month)) {
    const payerMemberId = expense.payerMemberId;

    if (!payerMemberId) {
      continue;
    }

    const group = groupsByMemberId.get(payerMemberId) ?? {
      memberId: payerMemberId,
      displayName: memberNameById.get(payerMemberId) ?? payerMemberId,
      totalAmountCents: 0,
      expenseIds: [],
      expenses: [],
    };

    group.totalAmountCents += expense.amountCents;
    group.expenseIds.push(expense.id);
    group.expenses.push({
      id: expense.id,
      amountCents: expense.amountCents,
      occurredOn: expense.occurredOn,
      categoryId: expense.categoryId,
      reimbursementStatus: "refundable",
    });

    groupsByMemberId.set(payerMemberId, group);
  }

  const groups = [...groupsByMemberId.values()].sort((left, right) =>
    left.displayName.localeCompare(right.displayName),
  );

  return {
    month: input.month,
    totalAmountCents: groups.reduce(
      (total, group) => total + group.totalAmountCents,
      0,
    ),
    groups,
    events: ["Monthly reimbursement table generated"],
  };
}

function refundableExpensesForMonth(
  records: LedgerRecord[],
  month: string,
): ExpenseLedgerRecord[] {
  return records.filter(
    (record): record is ExpenseLedgerRecord =>
      record.type === "expense" &&
      record.occurredOn.startsWith(`${month}-`) &&
      record.paymentSource === "member" &&
      record.reimbursementStatus === "refundable",
  );
}
