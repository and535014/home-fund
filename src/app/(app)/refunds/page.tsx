import { MonthSwitcher } from "@/app/month-switcher";
import { readMonthParam } from "@/app/month-selection";
import {
  readSearchParam,
  type AppSearchParams,
} from "@/app/route-search-params";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requireAuthenticatedMember } from "@/auth/app-access";
import {
  batchRefundRefundPageRecordsAction,
  loadRefundPageDataAction,
} from "./_actions/refund-page-actions";
import { RefundPagePanel } from "./_components/refund-page-panel";

type RefundsPageProps = {
  searchParams?: AppSearchParams;
};

export default async function RefundsPage({ searchParams }: RefundsPageProps) {
  const params = await searchParams;
  const month = readMonthParam(readSearchParam(params, "month"));
  const [session, refundPageResult] = await Promise.all([
    requireAuthenticatedMember(),
    loadRefundPageDataAction(month),
  ]);

  return (
    <PageLayout
      contentClassName="flex h-full min-h-0 flex-col overflow-hidden pb-5"
      header={
        <PageHeader
          actions={
            <MonthSwitcher currentMonth={month} hrefPath="/refunds" />
          }
          title="退款"
        />
      }
    >
      {refundPageResult.ok ? (
        <RefundPagePanel
          actor={session.profile}
          canEditReimbursementPayments={
            refundPageResult.canEditReimbursementPayments
          }
          data={refundPageResult.data}
          onBatchRefund={batchRefundRefundPageRecordsAction}
        />
      ) : (
        <Alert role="alert" variant="destructive">
          <AlertDescription>{refundPageResult.message}</AlertDescription>
        </Alert>
      )}
    </PageLayout>
  );
}
