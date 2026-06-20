import { loadCategoryManagementContext } from "@/app/category-management-context";
import type { AppSearchParams } from "@/app/route-search-params";
import {
  AddCategoryHeaderButton,
  CategoryManagementPanel,
} from "../../(admin)/categories/category-management-panel";

type CategoriesPageProps = {
  searchParams?: AppSearchParams;
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const resolvedSearchParams = await searchParams;

  const context = await loadCategoryManagementContext({
    searchParams: resolvedSearchParams,
  });

  return (
    <section className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-heading text-foreground">分類</h2>
          <p className="mt-1 text-caption text-muted-foreground">
            啟用中的分類可用於新增收入或支出，封存後仍保留在歷史紀錄。
          </p>
        </div>
        <AddCategoryHeaderButton />
      </div>
      <CategoryManagementPanel categories={context.categories} />
    </section>
  );
}
