import { loadMemberManagementContext } from "@/app/member-management-context";
import { updateMemberDisplayNameAction } from "@/app/member-actions";
import type { AppSearchParams } from "@/app/route-search-params";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import {
  InviteMemberHeaderButton,
  MemberManagementPanel,
} from "./member-management-panel";

type MembersPageProps = {
  searchParams?: AppSearchParams;
};

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const context = await loadMemberManagementContext({
    searchParams,
  });

  return (
    <PageLayout
      header={
        <PageHeader
          actions={<InviteMemberHeaderButton />}
          description="邀請家庭成員、管理全站顯示名稱，並檢視 Google 頭像來源。"
          title="成員"
        />
      }
    >
      <MemberManagementPanel
        memberResult={context.memberResult}
        members={context.members}
        updateDisplayNameAction={updateMemberDisplayNameAction}
      />
    </PageLayout>
  );
}
