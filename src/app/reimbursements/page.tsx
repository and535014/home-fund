import type { DashboardSearchParams } from "../dashboard-page-context";
import {
  loadDashboardPageContext,
  readSearchParam,
} from "../dashboard-page-context";
import { DashboardRouteFrame } from "../dashboard-route-frame";
import { SummaryMetric, formatAmount } from "../dashboard-widgets";
import { markExpensesReimbursedAction } from "../reimbursement-actions";
import { ReimbursementSettlementPanel } from "../reimbursement-settlement-panel";

type ReimbursementsPageProps = {
  searchParams?: DashboardSearchParams;
};

export default async function ReimbursementsPage({
  searchParams,
}: ReimbursementsPageProps) {
  const context = await loadDashboardPageContext({
    activeHref: "/reimbursements",
    searchParams,
  });

  if (context.kind === "blocked") {
    return <DashboardRouteFrame context={context} title="退款" />;
  }

  const { homeView, month } = context;
  const reimbursementTable = homeView.reimbursementTable;
  const pendingExpenseCount = reimbursementTable.groups.reduce(
    (total, group) => total + group.expenseIds.length,
    0,
  );
  const reimbursementFeedback = readReimbursementFeedback(
    readSearchParam(context.rawSearchParams, "reimbursement"),
  );

  return (
    <DashboardRouteFrame context={context} title="退款">
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
          feedback={reimbursementFeedback}
          markExpensesReimbursedAction={markExpensesReimbursedAction}
          month={month}
          reimbursementTable={reimbursementTable}
          returnTo="/reimbursements"
        />
      </div>
    </DashboardRouteFrame>
  );
}

function readReimbursementFeedback(
  reimbursementResult: string | undefined,
):
  | "success"
  | "permission_denied"
  | "empty_selection"
  | "expense_not_found"
  | "not_refundable"
  | "already_reimbursed"
  | undefined {
  if (
    reimbursementResult === "success" ||
    reimbursementResult === "permission_denied" ||
    reimbursementResult === "empty_selection" ||
    reimbursementResult === "expense_not_found" ||
    reimbursementResult === "not_refundable" ||
    reimbursementResult === "already_reimbursed"
  ) {
    return reimbursementResult;
  }

  return undefined;
}
