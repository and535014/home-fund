import { loadMemberManagementMembers } from "@/app/member-management-members";
import {
  InviteMemberHeaderButton,
  MemberInviteDialog,
} from "./member-invite-dialog";
import { MemberList } from "./member-list";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";

export default async function MembersPage() {
  const members = await loadMemberManagementMembers();

  return (
    <PageLayout
      header={
        <PageHeader actions={<InviteMemberHeaderButton />} title="成員" />
      }
    >
      <MemberList members={members} />
      <MemberInviteDialog />
    </PageLayout>
  );
}
