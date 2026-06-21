import { requireAppRouteAccess } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import type { HouseholdMemberStatus } from "@/modules/identity-access/member-management";
import type { MemberRole } from "@/modules/identity-access/authorization";

export type MemberManagementMemberStatus = HouseholdMemberStatus;

export type MemberManagementMember = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  roles: MemberRole[];
  status: MemberManagementMemberStatus;
};

type MemberManagementMemberRow = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  roles: {
    role: MemberRole;
  }[];
  status: MemberManagementMemberStatus;
};

export async function loadMemberManagementMembers(): Promise<MemberManagementMember[]> {
  await requireAppRouteAccess("members");
  const members = await getPrismaClient().member.findMany({
    where: {
      status: "active",
    },
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      status: true,
      roles: {
        select: {
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (members as MemberManagementMemberRow[]).map((member) => ({
    id: member.id,
    displayName: member.displayName,
    avatarUrl: member.avatarUrl,
    roles: member.roles.map((role) => role.role),
    status: member.status,
  }));
}
