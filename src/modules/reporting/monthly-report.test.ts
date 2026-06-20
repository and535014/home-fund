import { describe, expect, it } from "vitest";
import type { Category } from "../categorization/category-catalog";
import type { LedgerRecord } from "../fund-ledger/ledger-records";
import { buildMonthlyReport } from "./monthly-report";

const categories: Category[] = [
  { id: "income-rent", type: "income", name: "房租", status: "active" },
  { id: "expense-grocery", type: "expense", name: "日用品", status: "active" },
  { id: "expense-internet", type: "expense", name: "網路費", status: "active" },
];

const records: LedgerRecord[] = [
  {
    id: "income-june-rent",
    type: "income",
    name: "六月房租",
    amountCents: 120_000,
    occurredOn: "2026-06-05",
    categoryId: "income-rent",
    createdByMemberId: "member-mei",
    sourceMemberId: "member-mei",
    reimbursementStatus: "not_applicable",
  },
  {
    id: "expense-grocery-june",
    type: "expense",
    name: "日用品代墊",
    amountCents: 3_200,
    occurredOn: "2026-06-09",
    categoryId: "expense-grocery",
    createdByMemberId: "member-mei",
    paymentSource: "member",
    payerMemberId: "member-mei",
    reimbursementStatus: "refundable",
  },
  {
    id: "expense-internet-june",
    type: "expense",
    name: "網路費",
    amountCents: 899,
    occurredOn: "2026-06-05",
    categoryId: "expense-internet",
    createdByMemberId: "member-admin",
    paymentSource: "fund",
    reimbursementStatus: "not_refundable",
  },
  {
    id: "income-july-rent",
    type: "income",
    name: "七月房租",
    amountCents: 120_000,
    occurredOn: "2026-07-05",
    categoryId: "income-rent",
    createdByMemberId: "member-mei",
    sourceMemberId: "member-mei",
    reimbursementStatus: "not_applicable",
  },
];

describe("buildMonthlyReport", () => {
  it("derives monthly totals, category summaries, and reimbursement summary", () => {
    const report = buildMonthlyReport({
      month: "2026-06",
      records,
      categories,
      reimbursementTable: {
        month: "2026-06",
        totalAmountCents: 3_200,
        groups: [
          {
            memberId: "member-mei",
            displayName: "Mei",
            totalAmountCents: 3_200,
            expenseIds: ["expense-grocery-june"],
            expenses: [
              {
                id: "expense-grocery-june",
                amountCents: 3_200,
                occurredOn: "2026-06-09",
                categoryId: "expense-grocery",
                reimbursementStatus: "refundable",
              },
            ],
          },
        ],
        events: ["Monthly reimbursement table generated"],
      },
    });

    expect(report).toEqual({
      month: "2026-06",
      totals: {
        confirmedIncomeCents: 120_000,
        confirmedExpenseCents: 4_099,
        netCents: 115_901,
      },
      recordIds: [
        "income-june-rent",
        "expense-grocery-june",
        "expense-internet-june",
      ],
      categorySummaries: [
        {
          categoryId: "expense-grocery",
          categoryName: "日用品",
          type: "expense",
          totalAmountCents: 3_200,
          recordIds: ["expense-grocery-june"],
        },
        {
          categoryId: "expense-internet",
          categoryName: "網路費",
          type: "expense",
          totalAmountCents: 899,
          recordIds: ["expense-internet-june"],
        },
        {
          categoryId: "income-rent",
          categoryName: "房租",
          type: "income",
          totalAmountCents: 120_000,
          recordIds: ["income-june-rent"],
        },
      ],
      reimbursementSummary: {
        refundableTotalCents: 3_200,
        groupCount: 1,
        expenseIds: ["expense-grocery-june"],
      },
      events: ["Monthly records viewed", "Monthly report generated"],
    });
  });

  it("returns an empty traceable report for months without records", () => {
    expect(buildMonthlyReport({
      month: "2026-08",
      records,
      categories,
      reimbursementTable: {
        month: "2026-08",
        totalAmountCents: 0,
        groups: [],
        events: ["Monthly reimbursement table generated"],
      },
    })).toEqual({
      month: "2026-08",
      totals: {
        confirmedIncomeCents: 0,
        confirmedExpenseCents: 0,
        netCents: 0,
      },
      recordIds: [],
      categorySummaries: [],
      reimbursementSummary: {
        refundableTotalCents: 0,
        groupCount: 0,
        expenseIds: [],
      },
      events: ["Monthly records viewed", "Monthly report generated"],
    });
  });
});
