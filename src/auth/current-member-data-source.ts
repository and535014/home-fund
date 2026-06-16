import type { CurrentMemberDataSource } from "./current-member";
import type { BetterAuthAccountIdentity } from "./session-identity";
import type { HouseholdMemberAccount } from "../modules/identity-access/member-management";
import type {
  MemberCapability,
  MemberRole,
} from "../modules/identity-access/authorization";

type PrismaAccountRow = BetterAuthAccountIdentity;

type PrismaMemberRow = {
  id: string;
  displayName: string;
  googleAccountEmail: string | null;
  googleSubject: string | null;
  status: HouseholdMemberAccount["status"];
  roles: { role: unknown }[];
  capabilities: { capability: unknown }[];
};

const memberRoles = ["admin", "finance_manager", "general_member"] as const;
const memberCapabilities = [
  "manage_categories",
  "manage_recurring",
] as const;

export type CurrentMemberPrismaClient = {
  account: {
    findMany(args: {
      where: { userId: string };
      select: {
        providerId: true;
        accountId: true;
        userId: true;
      };
    }): Promise<PrismaAccountRow[]>;
  };
  member: {
    findMany(args: {
      select: {
        id: true;
        displayName: true;
        googleAccountEmail: true;
        googleSubject: true;
        status: true;
        roles: {
          select: {
            role: true;
          };
        };
        capabilities: {
          select: {
            capability: true;
          };
        };
      };
      orderBy: {
        displayName: "asc";
      };
    }): Promise<PrismaMemberRow[]>;
  };
};

export function createCurrentMemberDataSource(
  prisma: CurrentMemberPrismaClient,
): CurrentMemberDataSource {
  return {
    listAccountsForUser(userId) {
      return prisma.account.findMany({
        where: { userId },
        select: {
          providerId: true,
          accountId: true,
          userId: true,
        },
      });
    },
    async listHouseholdMembers() {
      const members = await prisma.member.findMany({
        select: {
          id: true,
          displayName: true,
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
        },
        orderBy: {
          displayName: "asc",
        },
      });

      return members.map(mapPrismaMemberToHouseholdMember);
    },
  };
}

export function mapPrismaMemberToHouseholdMember(
  member: PrismaMemberRow,
): HouseholdMemberAccount {
  return {
    id: member.id,
    displayName: member.displayName,
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
