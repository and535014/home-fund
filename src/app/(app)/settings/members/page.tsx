import { loadMemberManagementMembers } from "@/app/member-management-members";
import {
  InviteMemberHeaderButton,
  MemberInviteDialog,
} from "../../(admin)/members/member-invite-dialog";
import { MemberList } from "../../(admin)/members/member-list";

export default async function MembersPage() {
  const members = await loadMemberManagementMembers();

  return (
    <section className="grid gap-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-heading text-foreground">成員</h2>
          <p className="mt-1 text-caption text-muted-foreground">
            邀請家庭成員加入，並管理成員顯示名稱。
          </p>
        </div>
        <InviteMemberHeaderButton />
      </div>
      <MemberList members={members} />
      <MemberInviteDialog />
    </section>
  );
}
