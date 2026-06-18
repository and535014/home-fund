import type { DashboardSearchParams } from "../dashboard-page-context";
import { loadDashboardPageContext } from "../dashboard-page-context";
import { DashboardRouteFrame } from "../dashboard-route-frame";
import { Card, CardContent } from "@/components/ui/card";

type CategoriesPageProps = {
  searchParams?: DashboardSearchParams;
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const context = await loadDashboardPageContext({
    activeHref: "/categories",
    searchParams,
  });

  if (context.kind === "blocked") {
    return <DashboardRouteFrame context={context} title="分類" />;
  }

  return (
    <DashboardRouteFrame context={context} title="分類">
      <section aria-labelledby="categories-title" className="mt-5 max-w-2xl">
        <h3 id="categories-title" className="mb-3 text-subheading">
          分類管理
        </h3>
        <Card>
          <CardContent>
            <p className="text-body-strong">分類管理即將推出</p>
            <p className="mt-1 text-body text-muted-foreground">
              這裡會放收入與支出分類的新增、封存與排序。現在先保留正式入口，避免 sidebar 指向不存在的頁面。
            </p>
          </CardContent>
        </Card>
      </section>
    </DashboardRouteFrame>
  );
}
