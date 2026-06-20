import { loadMonthlyWorkspaceContext } from "@/app/monthly-workspace-context";
import type { AppSearchParams } from "@/app/route-search-params";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import { redirect } from "next/navigation";

type ReimbursementsPageProps = {
  searchParams?: AppSearchParams;
};

export default async function ReimbursementsPage({
  searchParams,
}: ReimbursementsPageProps) {
  const context = await loadMonthlyWorkspaceContext({ searchParams });

  const { homeView } = context;
  if (!homeView.accessHints.actions.canPerformReimbursement) {
    redirect("/");
  }

  return (
    <PageLayout header={<PageHeader title="退款" />}>
      <div className="grid min-h-88 place-items-center">
        <p className="text-subheading text-muted-foreground">敬請期待</p>
      </div>
    </PageLayout>
  );
}
