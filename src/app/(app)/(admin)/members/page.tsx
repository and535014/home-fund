import { loadMemberManagementContext } from "@/app/member-management-context";
import type { AppSearchParams } from "@/app/route-search-params";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import {
  InviteMemberHeaderButton,
  MemberManagementPrototype,
  type PrototypeMember,
} from "./member-management-prototype";

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
      <MemberManagementPrototype
        members={buildMembersFromContext(context.members)}
      />
    </PageLayout>
  );
}

function buildMembersFromContext(
  members: Array<{
    id: string;
    displayName: string;
    googleAccountEmail?: string;
    roles: PrototypeMember["roles"];
    status: PrototypeMember["status"] | "disabled";
  }>,
): PrototypeMember[] {
  return members.filter(isRenderablePrototypeMember).map((member) => {
    const email = member.googleAccountEmail ?? `${member.id}@example.com`;

    return {
      id: member.id,
      avatarUrl: avatarForEmail(email),
      displayName: member.displayName,
      email,
      googleName: member.displayName,
      invitationLink: member.status === "invited"
        ? buildPreviewInviteLink(email)
        : undefined,
      roles: member.roles,
      status: member.status,
    };
  });
}

function isRenderablePrototypeMember(member: {
  id: string;
  displayName: string;
  googleAccountEmail?: string;
  roles: PrototypeMember["roles"];
  status: PrototypeMember["status"] | "disabled";
}): member is {
  id: string;
  displayName: string;
  googleAccountEmail?: string;
  roles: PrototypeMember["roles"];
  status: PrototypeMember["status"];
} {
  return member.status !== "disabled";
}

function avatarForEmail(email: string): string {
  const encoded = encodeURIComponent(email);
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encoded}&backgroundColor=0f766e,2563eb,9333ea`;
}

function buildPreviewInviteLink(email: string): string {
  const token = encodeURIComponent(`preview-existing-${email}`);

  return `/invite/accept?token=${token}`;
}
