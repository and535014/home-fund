import { loadMemberManagementMembers } from "@/app/member-management-members";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import {
  InviteMemberHeaderButton,
  MemberInviteDialog,
} from "./member-invite-dialog";
import { MemberList } from "./member-list";

export default async function MembersPage() {
  const members = await loadMemberManagementMembers();

  return (
    <PageLayout
      header={
        <PageHeader
          actions={<InviteMemberHeaderButton />}
          description="邀請家庭成員加入，並管理成員顯示名稱。"
          title="成員"
        />
      }
    >
      <MemberList members={members} />
      <MemberInviteDialog />
    </PageLayout>
  );
}
