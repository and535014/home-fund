import { loadCategoryManagementContext } from "@/app/category-management-context";
import type { AppSearchParams } from "@/app/route-search-params";
import {
  AddCategoryHeaderButton,
  CategoryManagementPanel,
} from "./category-management-panel";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";

type CategoriesPageProps = {
  searchParams?: AppSearchParams;
};

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const resolvedSearchParams = await searchParams;

  const context = await loadCategoryManagementContext({
    searchParams: resolvedSearchParams,
  });

  return (
    <PageLayout
      header={
        <PageHeader actions={<AddCategoryHeaderButton />} title="分類" />
      }
    >
      <CategoryManagementPanel categories={context.categories} />
    </PageLayout>
  );
}
