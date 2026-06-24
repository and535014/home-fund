import { PageLoading } from "@/components/layout/page-loading";

export default function Loading() {
  return (
    <PageLoading label="頁面載入中" className="bg-background/95">
      <div className="flex h-full min-h-[18rem] items-center justify-center px-4">
        <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    </PageLoading>
  );
}
