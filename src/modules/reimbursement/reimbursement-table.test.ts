import { describe, expect, it } from "vitest";
import type {
  ExpenseLedgerRecord,
  LedgerRecord,
} from "../fund-ledger/ledger-records";
import { buildMonthlyReimbursementTable } from "./reimbursement-table";

const refundableMeiExpense: ExpenseLedgerRecord = {
  id: "expense-mei-1",
  type: "expense",
  name: "日用品代墊",
  amountCents: 3_200,
  occurredOn: "2026-06-09",
  categoryId: "expense-grocery",
  createdByMemberId: "member-mei",
  paymentSource: "member",
  payerMemberId: "member-mei",
  reimbursementStatus: "refundable",
};

const records: LedgerRecord[] = [
  refundableMeiExpense,
  {
    ...refundableMeiExpense,
    id: "expense-mei-2",
    amountCents: 1_800,
    occurredOn: "2026-06-12",
  },
  {
    ...refundableMeiExpense,
    id: "expense-kai-1",
    amountCents: 2_500,
    payerMemberId: "member-kai",
    occurredOn: "2026-06-10",
  },
  {
    ...refundableMeiExpense,
    id: "expense-reimbursed",
    reimbursementStatus: "reimbursed",
  },
  {
    ...refundableMeiExpense,
    id: "expense-fund",
    paymentSource: "fund",
    payerMemberId: undefined,
    reimbursementStatus: "not_refundable",
  },
  {
    ...refundableMeiExpense,
    id: "expense-other-month",
    occurredOn: "2026-07-01",
  },
  {
    id: "income-rent",
    type: "income",
    name: "六月房租",
    amountCents: 120_000,
    occurredOn: "2026-06-05",
    categoryId: "income-rent",
    createdByMemberId: "member-mei",
    sourceMemberId: "member-mei",
    reimbursementStatus: "not_applicable",
  },
];

describe("buildMonthlyReimbursementTable", () => {
  it("groups monthly refundable member-paid expenses by payer member", () => {
    const table = buildMonthlyReimbursementTable({
      month: "2026-06",
      members: [
        { id: "member-kai", displayName: "Kai" },
        { id: "member-mei", displayName: "Mei" },
      ],
      records,
    });

    expect(table).toEqual({
      month: "2026-06",
      totalAmountCents: 7_500,
      groups: [
        {
          memberId: "member-kai",
          displayName: "Kai",
          totalAmountCents: 2_500,
          expenseIds: ["expense-kai-1"],
          expenses: [
            {
              id: "expense-kai-1",
              amountCents: 2_500,
              occurredOn: "2026-06-10",
              categoryId: "expense-grocery",
              reimbursementStatus: "refundable",
            },
          ],
        },
        {
          memberId: "member-mei",
          displayName: "Mei",
          totalAmountCents: 5_000,
          expenseIds: ["expense-mei-1", "expense-mei-2"],
          expenses: [
            {
              id: "expense-mei-1",
              amountCents: 3_200,
              occurredOn: "2026-06-09",
              categoryId: "expense-grocery",
              reimbursementStatus: "refundable",
            },
            {
              id: "expense-mei-2",
              amountCents: 1_800,
              occurredOn: "2026-06-12",
              categoryId: "expense-grocery",
              reimbursementStatus: "refundable",
            },
          ],
        },
      ],
      events: ["Monthly reimbursement table generated"],
    });
  });

  it("returns an empty traceable table when no refundable expenses exist", () => {
    expect(buildMonthlyReimbursementTable({
      month: "2026-08",
      members: [],
      records,
    })).toEqual({
      month: "2026-08",
      totalAmountCents: 0,
      groups: [],
      events: ["Monthly reimbursement table generated"],
    });
  });
});
