import { loadMonthlyWorkspaceContext } from "@/app/monthly-workspace-context";
import {
  readSearchParam,
  type AppSearchParams,
} from "@/app/route-search-params";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import {
  formatAmount,
  RecordsTable,
  SummaryMetric,
} from "@/app/dashboard-widgets";
import { MonthSwitcher } from "@/app/month-switcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ExpenseCategoryPieChart,
  MonthlyTrendChart,
  type ExpenseCategoryPoint,
  type MonthlyTrendPoint,
} from "@/app/dashboard-charts";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";

type HomePageProps = {
  searchParams?: AppSearchParams;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const context = await loadMonthlyWorkspaceContext({ searchParams });

  const { dashboardData, homeView, month } = context;
  const { reimbursementTable, report } = homeView;
  const categoryNames = new Map(
    dashboardData.categories.map((category) => [category.id, category.name]),
  );
  const memberNames = new Map(
    dashboardData.householdMembers.map((member) => [
      member.id,
      member.displayName,
    ]),
  );
  const monthRecords = dashboardData.records.filter((record) =>
    record.occurredOn.startsWith(`${month}-`),
  );
  const recentRecords = monthRecords.slice(-5).reverse();
  const trendPoints = buildMonthlyTrendPoints(month, monthRecords);
  const reimbursementFeedback = readSearchParam(
    context.rawSearchParams,
    "reimbursement",
  );

  return (
    <PageLayout
      contentClassName="h-full min-h-0 pb-5"
      header={
        <PageHeader
          actions={<MonthSwitcher currentMonth={month} />}
          title="總覽"
        />
      }
    >
      <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(22rem,0.92fr)]">
        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_minmax(0,1.15fr)] gap-4">
          <section
            aria-label="月報摘要"
            className="grid gap-3 lg:grid-cols-3"
          >
            <SummaryMetric
              label="餘額"
              tone="default"
              value={formatAmount(report.totals.netCents)}
            />
            <SummaryMetric
              label="支出"
              tone="expense"
              value={formatAmount(report.totals.confirmedExpenseCents)}
            />
            <SummaryMetric
              label="收入"
              tone="income"
              value={formatAmount(report.totals.confirmedIncomeCents)}
            />
          </section>

          <MonthlyTrendCard data={trendPoints} />

          <div className="grid min-h-0 gap-4 lg:grid-cols-2">
            <PendingReimbursementsCard
              feedback={reimbursementFeedback}
              pendingCount={reimbursementTable.groups.reduce(
                (total, group) => total + group.expenseIds.length,
                0,
              )}
              totalAmount={formatAmount(
                report.reimbursementSummary.refundableTotalCents,
              )}
            />
            <CategoryPieCard
              summaries={report.categorySummaries}
            />
          </div>
        </div>

        <section
          aria-labelledby="month-records-title"
          className="flex min-h-0 min-w-0 flex-col overflow-hidden"
        >
          <div className="mb-3">
            <h3 id="month-records-title" className="text-subheading">
              紀錄
            </h3>
          </div>
          <RecordsTable
            categoryNames={categoryNames}
            memberNames={memberNames}
            records={recentRecords}
          />
        </section>
      </div>
    </PageLayout>
  );
}

function MonthlyTrendCard({ data }: { data: MonthlyTrendPoint[] }) {
  return (
    <Card className="min-h-0 min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle>收支趨勢</CardTitle>
      </CardHeader>
      <CardContent className="min-h-64 min-w-0 flex-1">
        <div className="h-full min-h-64 min-w-0">
          <MonthlyTrendChart data={data} />
        </div>
      </CardContent>
    </Card>
  );
}

function PendingReimbursementsCard({
  feedback,
  pendingCount,
  totalAmount,
}: {
  feedback?: string;
  pendingCount: number;
  totalAmount: string;
}) {
  return (
    <Card className="min-h-0">
      <CardHeader>
        <CardTitle>待退款</CardTitle>
      </CardHeader>
      <CardContent className="grid content-center gap-2">
        <p className="text-heading text-foreground">{totalAmount}</p>
        <p className="text-caption text-muted-foreground">
          {feedback === "success"
            ? "已完成退款，退款頁可查看剩餘待處理項目。"
            : `${pendingCount} 筆成員代墊支出待處理。`}
        </p>
      </CardContent>
    </Card>
  );
}

function CategoryPieCard({
  summaries,
}: {
  summaries: {
    categoryId: string;
    categoryName: string;
    totalAmountCents: number;
    type: "expense" | "income";
  }[];
}) {
  const expenseSummaries = summaries
    .filter((summary) => summary.type === "expense")
    .slice(0, 5);
  const totalExpenseCents = expenseSummaries.reduce(
    (total, summary) => total + summary.totalAmountCents,
    0,
  );
  const pieData: ExpenseCategoryPoint[] = expenseSummaries.map(
    (summary, index) => ({
      color: PIE_COLORS[index % PIE_COLORS.length],
      name: summary.categoryName,
      value: summary.totalAmountCents,
    }),
  );

  return (
    <Card className="min-h-0 min-w-0 overflow-hidden">
      <CardHeader>
        <CardTitle>支出分類</CardTitle>
      </CardHeader>
      <CardContent className="flex min-h-72 min-w-0 flex-1">
        {totalExpenseCents > 0 ? (
          <div className="h-full min-h-72 min-w-0 flex-1">
            <ExpenseCategoryPieChart
              centerLabel={formatChartAmount(totalExpenseCents)}
              data={pieData}
              totalValue={totalExpenseCents}
            />
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-caption text-muted-foreground">
            尚無支出分類資料
          </div>
        )}
      </CardContent>
    </Card>
  );
}

const PIE_COLORS = [
  "oklch(0.65 0.19 30)",
  "oklch(0.72 0.13 192)",
  "oklch(0.73 0.17 148)",
  "oklch(0.74 0.14 70)",
  "oklch(0.68 0.16 315)",
];

function buildMonthlyTrendPoints(
  month: string,
  records: LedgerRecord[],
): MonthlyTrendPoint[] {
  const byDate = new Map<string, MonthlyTrendPoint>();
  const [year, monthNumber] = month.split("-").map(Number);
  const daysInMonth = new Date(year, monthNumber, 0).getDate();

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${month}-${String(day).padStart(2, "0")}`;

    byDate.set(date, {
      balance: 0,
      date: `${monthNumber}/${day}`,
      expense: 0,
      income: 0,
    });
  }

  for (const record of records) {
    const point = byDate.get(record.occurredOn);

    if (!point) {
      continue;
    }

    if (record.type === "income") {
      point.income += record.amountCents / 100;
    } else {
      point.expense += record.amountCents / 100;
    }
  }

  let balance = 0;

  return Array.from(byDate.values()).map((point) => {
    balance += point.income - point.expense;

    return {
      ...point,
      balance,
    };
  });
}

function formatChartAmount(amountCents: number): string {
  return new Intl.NumberFormat("zh-TW", {
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}
