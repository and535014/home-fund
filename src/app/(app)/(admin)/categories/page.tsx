import { loadCategoryManagementContext } from "@/app/category-management-context";
import type { AppSearchParams } from "@/app/route-search-params";
import {
  MobileActionBar,
  PageHeader,
  PageLayout,
} from "@/components/layout/page-layout";
import {
  AddCategoryHeaderButton,
  CategoryManagementPanel,
} from "./category-management-panel";

type CategoriesPageProps = {
  searchParams?: AppSearchParams;
};

const CATEGORY_HEADER_DESCRIPTION =
  "啟用中的分類可用於新增收入或支出，封存後仍保留在歷史紀錄。";

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const resolvedSearchParams = await searchParams;

  const context = await loadCategoryManagementContext({
    searchParams: resolvedSearchParams,
  });

  return (
    <PageLayout
      footer={
        <MobileActionBar>
          <AddCategoryHeaderButton className="h-12 min-w-0 flex-1 px-3" size="lg" />
        </MobileActionBar>
      }
      header={
        <PageHeader
          actions={<AddCategoryHeaderButton className="hidden md:inline-flex" />}
          description={CATEGORY_HEADER_DESCRIPTION}
          title="分類"
        />
      }
    >
      <CategoryManagementPanel categories={context.categories} />
    </PageLayout>
  );
}
