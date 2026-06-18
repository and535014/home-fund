import type { DashboardSearchParams } from "../dashboard-page-context";
import { loadDashboardPageContext } from "../dashboard-page-context";
import { DashboardRouteFrame } from "../dashboard-route-frame";
import { Card, CardContent } from "@/components/ui/card";

type MembersPageProps = {
  searchParams?: DashboardSearchParams;
};

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const context = await loadDashboardPageContext({
    activeHref: "/members",
    searchParams,
  });

  if (context.kind === "blocked") {
    return <DashboardRouteFrame context={context} title="成員" />;
  }

  return (
    <DashboardRouteFrame context={context} title="成員">
      <section aria-labelledby="members-title" className="mt-5 max-w-2xl">
        <h3 id="members-title" className="mb-3 text-subheading">
          成員管理
        </h3>
        <Card>
          <CardContent>
            <p className="text-body-strong">成員管理即將推出</p>
            <p className="mt-1 text-body text-muted-foreground">
              這裡會放家庭成員邀請、狀態與權限設定。現在先保留正式入口，讓導覽結構完整。
            </p>
          </CardContent>
        </Card>
      </section>
    </DashboardRouteFrame>
  );
}
