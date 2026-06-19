import { loadMonthlyWorkspaceContext } from "@/app/monthly-workspace-context";
import type { AppSearchParams } from "@/app/route-search-params";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import { SummaryMetric } from "@/app/dashboard-widgets";
import { MonthSwitcher } from "@/app/month-switcher";
import {
  RecordCreateDialogHost,
  RecordCreateHeaderActions,
  RecordCreateMobileActionBar,
} from "@/app/record-create-actions";
import { confirmRecurringReminderAction } from "@/app/recurring-reminder-actions";
import { RecurringReminderConfirmationPanel } from "@/app/recurring-reminder-confirmation-panel";
import { Card, CardContent } from "@/components/ui/card";

type RecurringPageProps = {
  searchParams?: AppSearchParams;
};

export default async function RecurringPage({ searchParams }: RecurringPageProps) {
  const context = await loadMonthlyWorkspaceContext({
    returnTo: "/recurring",
    searchParams,
  });

  const { dashboardData, homeView, month } = context;

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
          title="週期"
        />
      }
      overlays={<RecordCreateDialogHost context={context} />}
    >
      <section
        aria-label="週期摘要"
        className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        <SummaryMetric
          label="待確認"
          tone="default"
          value={`${homeView.pendingRecurringReminders.length} 筆`}
        />
        <SummaryMetric
          label="本月 occurrence"
          tone="default"
          value={`${dashboardData.pendingOccurrences.length} 筆`}
        />
        <SummaryMetric
          label="規則管理"
          tone="default"
          value="即將推出"
        />
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(20rem,0.6fr)]">
        <RecurringReminderConfirmationPanel
          confirmRecurringReminderAction={confirmRecurringReminderAction}
          month={month}
          pendingReminders={homeView.pendingRecurringReminders}
        />

        <section aria-labelledby="recurring-rules-title">
          <h3 id="recurring-rules-title" className="mb-3 text-subheading">
            週期規則
          </h3>
          <Card>
            <CardContent>
              <p className="text-body-strong">規則管理即將推出</p>
              <p className="mt-1 text-body text-muted-foreground">
                目前先支援確認已產生的週期提醒。新增、暫停與編輯週期規則會在這個頁面延伸。
              </p>
            </CardContent>
          </Card>
        </section>
      </div>
    </PageLayout>
  );
}
