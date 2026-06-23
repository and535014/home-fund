import { CreateMemberHeaderButton, MemberList } from "./member-list";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";

export default function MembersPage() {
  return (
    <PageLayout
      header={
        <PageHeader
          actions={<CreateMemberHeaderButton />}
          description="管理者先建立成員，再產生成員專屬連結讓使用者綁定 Google 帳號。"
          title="成員"
        />
      }
    >
      <MemberList />
    </PageLayout>
  );
}
