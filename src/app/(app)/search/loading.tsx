import { PageLoading, SearchPageLoading } from "@/components/layout/page-loading";

export default function Loading() {
  return (
    <PageLoading label="搜尋頁載入中">
      <SearchPageLoading />
    </PageLoading>
  );
}
