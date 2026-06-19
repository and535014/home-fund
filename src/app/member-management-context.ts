import { createCurrentMemberDataSource } from "@/auth/current-member-data-source";
import { requireAppRouteAccess, type AppAccessSession } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import type {
  HouseholdMemberAccount,
  HouseholdMemberStatus,
} from "@/modules/identity-access/member-management";
import type { MemberRole } from "@/modules/identity-access/authorization";
import type { AppSearchParams } from "./route-search-params";

export type MemberManagementMemberStatus = Extract<
  HouseholdMemberStatus,
  "active" | "invited"
>;

export type MemberManagementMember = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  invitationLink?: string;
  roles: MemberRole[];
  status: MemberManagementMemberStatus;
};

export type ReadyMemberManagementContext = Omit<
  AppAccessSession,
  never
> & {
  kind: "member-management";
  members: MemberManagementMember[];
};

export type MemberManagementContext = ReadyMemberManagementContext;

export async function loadMemberManagementContext({
  searchParams,
}: {
  searchParams?: AppSearchParams;
}): Promise<MemberManagementContext> {
  await searchParams;
  const session = await requireAppRouteAccess("members");
  const members = await createCurrentMemberDataSource(
    getPrismaClient(),
  ).listHouseholdMembers();

  return {
    ...session,
    kind: "member-management",
    members: members
      .filter(isVisibleMember)
      .map(mapMemberAccountToManagementMember),
  };
}

function isVisibleMember(
  member: HouseholdMemberAccount,
): member is HouseholdMemberAccount & { status: MemberManagementMemberStatus } {
  return member.status === "active" || member.status === "invited";
}

function mapMemberAccountToManagementMember(
  member: HouseholdMemberAccount & { status: MemberManagementMemberStatus },
): MemberManagementMember {
  const email = member.googleAccountEmail ?? "";

  return {
    id: member.id,
    displayName: member.displayName,
    email,
    ...(member.avatarUrl ? { avatarUrl: member.avatarUrl } : {}),
    ...(member.status === "invited" && email
      ? { invitationLink: buildInviteLink(email) }
      : {}),
    roles: member.roles,
    status: member.status,
  };
}

function buildInviteLink(email: string): string {
  const token = encodeURIComponent(`preview-existing-${email}`);

  return `/invite/accept?token=${token}`;
}
