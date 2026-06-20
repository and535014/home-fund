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
  const monthRecords = dashboardData.records.filter((record) =>
    record.occurredOn.startsWith(`${month}-`),
  );
  const recentRecords = monthRecords.slice(-5).reverse();
  const reimbursementFeedback = readSearchParam(
    context.rawSearchParams,
    "reimbursement",
  );

  return (
    <PageLayout
      contentClassName="max-w-none px-5 lg:px-6"
      header={
        <PageHeader
          actions={<MonthSwitcher currentMonth={month} />}
          title="總覽"
        />
      }
    >
      <div className="grid min-h-[calc(100svh-8rem)] gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(22rem,0.92fr)]">
        <div className="grid min-h-0 gap-4">
          <section
            aria-label="月報摘要"
            className="grid gap-3 lg:grid-cols-3"
          >
            <SummaryMetric
              label="本月餘額"
              tone="default"
              value={formatAmount(report.totals.netCents)}
            />
            <SummaryMetric
              label="本月支出"
              tone="expense"
              value={formatAmount(report.totals.confirmedExpenseCents)}
            />
            <SummaryMetric
              label="本月收入"
              tone="income"
              value={formatAmount(report.totals.confirmedIncomeCents)}
            />
          </section>

          <MonthlyTrendCard />

          <div className="grid min-h-[28rem] gap-4 lg:grid-cols-2">
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
              maxTotal={Math.max(
                report.totals.confirmedExpenseCents,
                report.totals.confirmedIncomeCents,
                1,
              )}
              summaries={report.categorySummaries}
            />
          </div>
        </div>

        <section aria-labelledby="month-records-title" className="min-w-0">
          <div className="mb-3">
            <h3 id="month-records-title" className="text-subheading">
              本月紀錄
            </h3>
            <p className="text-caption text-muted-foreground">
              顯示本月最近 {recentRecords.length} 筆收入與支出。
            </p>
          </div>
          <RecordsTable categoryNames={categoryNames} records={recentRecords} />
        </section>
      </div>
    </PageLayout>
  );
}

function MonthlyTrendCard() {
  return (
    <Card className="min-h-[17rem]">
      <CardHeader>
        <CardTitle>本月收支趨勢</CardTitle>
      </CardHeader>
      <CardContent className="flex h-full min-h-44 items-end gap-2">
        {[36, 54, 42, 68, 58, 76, 62, 82, 70, 90].map((height, index) => (
          <div className="flex flex-1 flex-col justify-end gap-2" key={index}>
            <div
              className="rounded-t-sm bg-income/75"
              style={{ height: `${height}%` }}
            />
            <div
              className="rounded-t-sm bg-expense/75"
              style={{ height: `${Math.max(18, 100 - height)}%` }}
            />
          </div>
        ))}
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
    <Card className="min-h-full">
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
  maxTotal,
  summaries,
}: {
  maxTotal: number;
  summaries: {
    categoryId: string;
    categoryName: string;
    totalAmountCents: number;
    type: "expense" | "income";
  }[];
}) {
  return (
    <Card className="min-h-full">
      <CardHeader>
        <CardTitle>支出分類圓餅圖</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="mx-auto grid size-36 place-items-center rounded-full border-[18px] border-expense/70 bg-income/25">
          <span className="text-label text-muted-foreground">分類</span>
        </div>
        <div className="grid gap-2">
          {summaries.length === 0 ? (
            <p className="text-body text-muted-foreground">
              這個月份尚無分類摘要。
            </p>
          ) : (
            summaries.slice(0, 4).map((summary) => (
              <div className="grid gap-1" key={summary.categoryId}>
                <div className="flex items-center justify-between gap-3 text-label">
                  <span>{summary.categoryName}</span>
                  <span
                    className={
                      summary.type === "income" ? "text-income" : "text-expense"
                    }
                  >
                    {formatAmount(summary.totalAmountCents)}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-pill bg-secondary">
                  <div
                    className={`h-full rounded-pill ${
                      summary.type === "income" ? "bg-income" : "bg-expense"
                    }`}
                    style={{
                      width: `${Math.max(
                        12,
                        Math.min(100, (summary.totalAmountCents / maxTotal) * 100),
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
