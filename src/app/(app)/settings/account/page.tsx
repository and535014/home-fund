import { requireAuthenticatedMember } from "@/auth/app-access";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import { Item, ItemContent, ItemGroup, ItemTitle } from "@/components/ui/item";

export default async function AccountSettingsPage() {
  const session = await requireAuthenticatedMember();

  return (
    <PageLayout header={<PageHeader title="帳號資訊" />}>
      <ItemGroup>
        <Item>
          <ItemContent>
            <ItemTitle>顯示名稱</ItemTitle>
          </ItemContent>
          <p className="text-body-strong text-foreground">
            {session.profile.displayName}
          </p>
        </Item>
      </ItemGroup>
    </PageLayout>
  );
}
