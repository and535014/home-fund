import type {
  MemberCapability,
  MemberRole,
} from "@/modules/identity-access/authorization";
import type { HouseholdMemberAccount } from "@/modules/identity-access/member-management";

export type HouseholdMemberOption = {
  id: string;
  displayName: string;
};

export type PrismaHouseholdMemberRow = {
  id: string;
  householdId: string;
  displayName: string;
  avatarUrl: string | null;
  googleAccountEmail: string | null;
  googleSubject: string | null;
  status: HouseholdMemberAccount["status"];
  roles: { role: unknown }[];
  capabilities: { capability: unknown }[];
};

export const householdMemberSelect = {
  id: true,
  householdId: true,
  displayName: true,
  avatarUrl: true,
  googleAccountEmail: true,
  googleSubject: true,
  status: true,
  roles: {
    select: {
      role: true,
    },
  },
  capabilities: {
    select: {
      capability: true,
    },
  },
} as const;

export const householdMemberOptionSelect = {
  id: true,
  displayName: true,
} as const;

export const householdMemberOrderBy = {
  displayName: "asc",
} as const;

export type HouseholdMemberQueryPrismaClient = {
  member: {
    findMany(args: {
      where: {
        householdId: string;
      };
      select: typeof householdMemberSelect;
      orderBy: typeof householdMemberOrderBy;
    }): Promise<PrismaHouseholdMemberRow[]>;
  };
};

export type HouseholdMemberOptionQueryPrismaClient = {
  member: {
    findMany(args: {
      where: {
        householdId: string;
      };
      select: typeof householdMemberOptionSelect;
      orderBy: typeof householdMemberOrderBy;
    }): Promise<HouseholdMemberOption[]>;
  };
};

const memberRoles = ["admin", "finance_manager", "general_member"] as const;
const memberCapabilities = ["manage_categories", "manage_recurring"] as const;

export async function loadHouseholdMembers({
  householdId,
  prisma,
}: {
  householdId: string;
  prisma: HouseholdMemberQueryPrismaClient;
}): Promise<HouseholdMemberAccount[]> {
  const rows = await prisma.member.findMany({
    where: {
      householdId,
    },
    select: householdMemberSelect,
    orderBy: householdMemberOrderBy,
  });

  return rows.map(mapPrismaMemberToHouseholdMember);
}

export function loadHouseholdMemberOptions({
  householdId,
  prisma,
}: {
  householdId: string;
  prisma: HouseholdMemberOptionQueryPrismaClient;
}): Promise<HouseholdMemberOption[]> {
  return prisma.member.findMany({
    where: {
      householdId,
    },
    select: householdMemberOptionSelect,
    orderBy: householdMemberOrderBy,
  });
}

export function mapPrismaMemberToHouseholdMember(
  member: PrismaHouseholdMemberRow,
): HouseholdMemberAccount {
  return {
    id: member.id,
    householdId: member.householdId,
    displayName: member.displayName,
    ...(member.avatarUrl ? { avatarUrl: member.avatarUrl } : {}),
    ...(member.googleAccountEmail
      ? { googleAccountEmail: member.googleAccountEmail }
      : {}),
    ...(member.googleSubject ? { googleSubject: member.googleSubject } : {}),
    status: member.status,
    roles: member.roles
      .map((role) => role.role)
      .filter(isMemberRole),
    capabilities: member.capabilities
      .map((capability) => capability.capability)
      .filter(isMemberCapability),
  };
}

function isMemberRole(role: unknown): role is MemberRole {
  return memberRoles.includes(role as MemberRole);
}

function isMemberCapability(
  capability: unknown,
): capability is MemberCapability {
  return memberCapabilities.includes(capability as MemberCapability);
}
