import type { Category } from "../categorization/category-catalog";
import {
  DEFAULT_CATEGORY_COLOR,
  DEFAULT_CATEGORY_ICON,
  type CategoryColorKey,
  type CategoryIconKey,
} from "../categorization/category-visual-options";
import type { LedgerRecord, LedgerRecordType } from "../fund-ledger/ledger-records";
import type { MonthlyReimbursementTable } from "../reimbursement/reimbursement-table";

export type MonthlyReportTotals = {
  confirmedIncomeCents: number;
  confirmedExpenseCents: number;
  netCents: number;
};

export type MonthlyCategorySummary = {
  categoryId: string;
  categoryColor: CategoryColorKey;
  categoryIcon: CategoryIconKey;
  categoryName: string;
  categorySortOrder: number;
  type: LedgerRecordType;
  totalAmountCents: number;
  recordIds: string[];
};

export type MonthlyReimbursementSummary = {
  refundableTotalCents: number;
  groupCount: number;
  expenseIds: string[];
};

export type MonthlyReport = {
  month: string;
  totals: MonthlyReportTotals;
  recordIds: string[];
  categorySummaries: MonthlyCategorySummary[];
  reimbursementSummary: MonthlyReimbursementSummary;
  events: ["Monthly records viewed", "Monthly report generated"];
};

export type BuildMonthlyReportInput = {
  month: string;
  records: LedgerRecord[];
  categories: Category[];
  reimbursementTable: MonthlyReimbursementTable;
};

export function buildMonthlyReport(input: BuildMonthlyReportInput): MonthlyReport {
  const monthlyRecords = input.records.filter((record) =>
    record.occurredOn.startsWith(`${input.month}-`),
  );
  const totals = buildTotals(monthlyRecords);

  return {
    month: input.month,
    totals,
    recordIds: monthlyRecords.map((record) => record.id),
    categorySummaries: buildCategorySummaries(monthlyRecords, input.categories),
    reimbursementSummary: {
      refundableTotalCents: input.reimbursementTable.totalAmountCents,
      groupCount: input.reimbursementTable.groups.length,
      expenseIds: input.reimbursementTable.groups.flatMap((group) => group.expenseIds),
    },
    events: ["Monthly records viewed", "Monthly report generated"],
  };
}

function buildTotals(records: LedgerRecord[]): MonthlyReportTotals {
  const confirmedIncomeCents = records
    .filter((record) => record.type === "income")
    .reduce((total, record) => total + record.amountCents, 0);
  const confirmedExpenseCents = records
    .filter((record) => record.type === "expense")
    .reduce((total, record) => total + record.amountCents, 0);

  return {
    confirmedIncomeCents,
    confirmedExpenseCents,
    netCents: confirmedIncomeCents - confirmedExpenseCents,
  };
}

function buildCategorySummaries(
  records: LedgerRecord[],
  categories: Category[],
): MonthlyCategorySummary[] {
  const categoryById = new Map(
    categories.map((category) => [category.id, category] as const),
  );
  const summariesByCategoryId = new Map<string, MonthlyCategorySummary>();

  for (const record of records) {
    const category = categoryById.get(record.categoryId);
    const summary = summariesByCategoryId.get(record.categoryId) ?? {
      categoryId: record.categoryId,
      categoryColor: category?.color ?? DEFAULT_CATEGORY_COLOR,
      categoryIcon: category?.icon ?? DEFAULT_CATEGORY_ICON,
      categoryName: category?.name ?? record.categoryId,
      categorySortOrder: category?.sortOrder ?? 0,
      type: record.type,
      totalAmountCents: 0,
      recordIds: [],
    };

    summary.totalAmountCents += record.amountCents;
    summary.recordIds.push(record.id);
    summariesByCategoryId.set(record.categoryId, summary);
  }

  return [...summariesByCategoryId.values()].sort((left, right) => {
    const byType = left.type.localeCompare(right.type);

    if (byType !== 0) {
    return byType;
  }

    if (left.categorySortOrder !== right.categorySortOrder) {
      return left.categorySortOrder - right.categorySortOrder;
    }

    return left.categoryName.localeCompare(right.categoryName);
  });
}
