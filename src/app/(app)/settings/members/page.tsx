import {
  CreateMemberHeaderButton,
  CreateMemberMobileFab,
  MemberList,
} from "./member-list";
import { loadMemberManagementMembers } from "@/app/member-management-members";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";

export default async function MembersPage() {
  const members = await loadMemberManagementMembers();

  return (
    <PageLayout
      header={
        <PageHeader
          actions={<CreateMemberHeaderButton />}
          hideOnMobile
          title="成員"
        />
      }
    >
      <MemberList members={members} />
      <CreateMemberMobileFab />
    </PageLayout>
  );
}
