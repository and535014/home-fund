import { PageLoading } from "@/components/layout/page-loading";

export default function Loading() {
  return (
    <div className="grid min-h-svh bg-background text-foreground">
      <PageLoading label="頁面載入中">
        <div className="flex h-full min-h-[18rem] items-center justify-center px-4">
          <div className="size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
        </div>
      </PageLoading>
    </div>
  );
}
