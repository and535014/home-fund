import { ArrowRight } from "lucide-react";
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
import {
  RecordCreateDialogHost,
  RecordCreateHeaderActions,
  RecordCreateMobileActionBar,
} from "@/app/record-create-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type HomePageProps = {
  searchParams?: AppSearchParams;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const context = await loadMonthlyWorkspaceContext({
    returnTo: "/",
    searchParams,
  });

  const { dashboardData, homeView, month } = context;
  const { pendingRecurringReminders, reimbursementTable, report } = homeView;
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
  const recurringFeedback = readSearchParam(context.rawSearchParams, "recurring");

  return (
    <PageLayout
      footer={<RecordCreateMobileActionBar context={context} />}
      header={
        <PageHeader
          actions={
            <>
              <MonthSwitcher currentMonth={month} />
              <RecordCreateHeaderActions context={context} />
            </>
          }
          title="總覽"
        />
      }
      overlays={<RecordCreateDialogHost context={context} />}
    >
      <section
        aria-label="月報摘要"
        className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryMetric
          label="確認收入"
          tone="income"
          value={formatAmount(report.totals.confirmedIncomeCents)}
        />
        <SummaryMetric
          label="確認支出"
          tone="expense"
          value={formatAmount(report.totals.confirmedExpenseCents)}
        />
        <SummaryMetric
          label="本月結餘"
          tone="default"
          value={formatAmount(report.totals.netCents)}
        />
        <SummaryMetric
          label="待退款"
          tone="default"
          value={formatAmount(report.reimbursementSummary.refundableTotalCents)}
        />
      </section>

      <section aria-label="待處理事項" className="mt-5 grid gap-3 lg:grid-cols-2">
        <TaskLinkCard
          description={
            reimbursementFeedback === "success"
              ? "已完成退款，退款頁可查看剩餘待處理項目。"
              : "前往退款頁選取成員代墊支出並標記已退款。"
          }
          href={`/reimbursements?month=${encodeURIComponent(month)}`}
          label="退款"
          metric={`${reimbursementTable.groups.reduce(
            (total, group) => total + group.expenseIds.length,
            0,
          )} 筆待處理`}
        />
        <TaskLinkCard
          description={
            recurringFeedback === "confirmed"
              ? "已確認週期提醒，週期頁可查看剩餘待確認項目。"
              : "前往週期頁確認提醒，確認後會建立本月紀錄。"
          }
          href={`/recurring?month=${encodeURIComponent(month)}`}
          label="週期提醒"
          metric={`${pendingRecurringReminders.length} 筆待確認`}
        />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <section aria-labelledby="recent-records-title" className="min-w-0">
          <div className="mb-3">
            <h3 id="recent-records-title" className="text-subheading">
              最近紀錄
            </h3>
            <p className="text-caption text-muted-foreground">
              顯示本月最近 {recentRecords.length} 筆收入與支出。
            </p>
          </div>
          <RecordsTable categoryNames={categoryNames} records={recentRecords} />
        </section>

        <section aria-labelledby="category-title">
          <h3 id="category-title" className="mb-3 text-subheading">
            分類摘要
          </h3>
          <Card>
            <CardContent className="grid gap-3">
              {report.categorySummaries.length === 0 ? (
                <p className="text-body text-muted-foreground">
                  這個月份尚無分類摘要。
                </p>
              ) : (
                report.categorySummaries.map((summary) => (
                  <div className="grid gap-1" key={summary.categoryId}>
                    <div className="flex items-center justify-between gap-3 text-label">
                      <span>{summary.categoryName}</span>
                      <span
                        className={
                          summary.type === "income"
                            ? "text-income"
                            : "text-expense"
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
                            Math.min(
                              100,
                              (summary.totalAmountCents /
                                Math.max(
                                  report.totals.confirmedIncomeCents,
                                  report.totals.confirmedExpenseCents,
                                  1,
                                )) *
                                100,
                            ),
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </PageLayout>
  );
}

function TaskLinkCard({
  description,
  href,
  label,
  metric,
}: {
  description: string;
  href: string;
  label: string;
  metric: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-label text-muted-foreground">{label}</p>
          <p className="mt-1 text-subheading">{metric}</p>
          <p className="mt-1 text-caption text-muted-foreground">{description}</p>
        </div>
        <Button asChild size="icon" variant="secondary">
          <a aria-label={`前往${label}`} href={href}>
            <ArrowRight aria-hidden="true" size={18} />
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
