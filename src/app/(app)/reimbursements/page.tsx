import { loadMonthlyWorkspaceContext } from "@/app/monthly-workspace-context";
import type { AppSearchParams } from "@/app/route-search-params";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import { SummaryMetric, formatAmount } from "@/app/dashboard-widgets";
import { MonthSwitcher } from "@/app/month-switcher";
import { ReimbursementSettlementPanel } from "@/app/reimbursement-settlement-panel";

type ReimbursementsPageProps = {
  searchParams?: AppSearchParams;
};

export default async function ReimbursementsPage({
  searchParams,
}: ReimbursementsPageProps) {
  const context = await loadMonthlyWorkspaceContext({
    returnTo: "/reimbursements",
    searchParams,
  });

  const { homeView, month } = context;
  const reimbursementTable = homeView.reimbursementTable;
  const pendingExpenseCount = reimbursementTable.groups.reduce(
    (total, group) => total + group.expenseIds.length,
    0,
  );

  return (
    <PageLayout
      header={
        <PageHeader
          actions={<MonthSwitcher currentMonth={month} />}
          title="退款"
        />
      }
    >
      <section
        aria-label="退款摘要"
        className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        <SummaryMetric
          label="待退款總額"
          tone="default"
          value={formatAmount(reimbursementTable.totalAmountCents)}
        />
        <SummaryMetric
          label="待處理支出"
          tone="default"
          value={`${pendingExpenseCount} 筆`}
        />
        <SummaryMetric
          label="涉及成員"
          tone="default"
          value={`${reimbursementTable.groups.length} 人`}
        />
      </section>

      <div className="mt-5 max-w-3xl">
        <ReimbursementSettlementPanel
          canPerformReimbursement={
            homeView.accessHints.actions.canPerformReimbursement
          }
          month={month}
          reimbursementTable={reimbursementTable}
        />
      </div>
    </PageLayout>
  );
}
