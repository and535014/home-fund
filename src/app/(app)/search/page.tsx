import { PageHeader, PageLayout } from "@/components/layout/page-layout";

export default function SearchPage() {
  return (
    <PageLayout header={<PageHeader title="搜尋" />}>
      <div className="grid min-h-88 place-items-center">
        <p className="text-subheading text-muted-foreground">敬請期待</p>
      </div>
    </PageLayout>
  );
}
