import { MonthSwitcher } from "@/app/month-switcher";
import {
  readSearchParam,
  type AppSearchParams,
} from "@/app/route-search-params";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import { RefundPagePrototype } from "./_components/refund-page-prototype";

type RefundsPageProps = {
  searchParams?: AppSearchParams;
};

export default async function RefundsPage({ searchParams }: RefundsPageProps) {
  const params = await searchParams;
  const month = readSearchParam(params, "month") ?? "2026-06";

  return (
    <PageLayout
      contentClassName="md:h-full md:min-h-0"
      header={
        <PageHeader
          actions={
            <MonthSwitcher currentMonth={month} hrefPath="/refunds" />
          }
          title="退款"
        />
      }
    >
      <RefundPagePrototype />
    </PageLayout>
  );
}
