import { loadMonthlyWorkspaceContext } from "@/app/monthly-workspace-context";
import type { AppSearchParams } from "@/app/route-search-params";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import { RecordsTable, SummaryMetric, formatAmount } from "@/app/dashboard-widgets";
import { MonthSwitcher } from "@/app/month-switcher";
import {
  RecordCreateDialogHost,
  RecordCreateHeaderActions,
  RecordCreateMobileActionBar,
  buildCreateRecordHref,
} from "@/app/record-create-actions";
import { Button } from "@/components/ui/button";

type RecordsPageProps = {
  searchParams?: AppSearchParams;
};

export default async function RecordsPage({ searchParams }: RecordsPageProps) {
  const context = await loadMonthlyWorkspaceContext({
    returnTo: "/records",
    searchParams,
  });

  const { dashboardData, homeView, month } = context;
  const { report } = homeView;
  const categoryNames = new Map(
    dashboardData.categories.map((category) => [category.id, category.name]),
  );
  const monthRecords = dashboardData.records.filter((record) =>
    record.occurredOn.startsWith(`${month}-`),
  );

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
          title="紀錄"
        />
      }
      overlays={<RecordCreateDialogHost context={context} />}
    >
      <section
        aria-label="紀錄摘要"
        className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryMetric
          label="本月紀錄"
          tone="default"
          value={`${monthRecords.length} 筆`}
        />
        <SummaryMetric
          label="收入"
          tone="income"
          value={formatAmount(report.totals.confirmedIncomeCents)}
        />
        <SummaryMetric
          label="支出"
          tone="expense"
          value={formatAmount(report.totals.confirmedExpenseCents)}
        />
        <SummaryMetric
          label="結餘"
          tone="default"
          value={formatAmount(report.totals.netCents)}
        />
      </section>

      <section aria-labelledby="records-title" className="mt-5 min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 id="records-title" className="text-subheading">
              本月完整紀錄
            </h3>
            <p className="text-caption text-muted-foreground">
              收入、基金支出與成員代墊支出集中在這裡管理。
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm" variant="secondary">
              <a href={buildCreateRecordHref("/records", month, "income")}>
                新增收入
              </a>
            </Button>
            <Button asChild size="sm">
              <a href={buildCreateRecordHref("/records", month, "expense")}>
                新增支出
              </a>
            </Button>
          </div>
        </div>
        <RecordsTable categoryNames={categoryNames} records={monthRecords} />
      </section>
    </PageLayout>
  );
}
