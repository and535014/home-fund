import type { CurrentMemberDataSource } from "./current-member";
import type { BetterAuthAccountIdentity } from "./session-identity";
import {
  householdMemberOrderBy,
  householdMemberSelect,
  mapPrismaMemberToHouseholdMember,
  type PrismaHouseholdMemberRow,
} from "../modules/identity-access/household-member-query";

export { mapPrismaMemberToHouseholdMember } from "../modules/identity-access/household-member-query";

type PrismaAccountRow = BetterAuthAccountIdentity;

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
        householdId: true;
        displayName: true;
        avatarUrl: true;
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
    }): Promise<PrismaHouseholdMemberRow[]>;
    update?(args: {
      where: {
        id: string;
      };
      data: {
        displayName?: string;
        avatarUrl?: string;
        googleAccountEmail?: string;
        googleSubject?: string;
      };
    }): Promise<unknown>;
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
        select: householdMemberSelect,
        orderBy: householdMemberOrderBy,
      });

      return members.map(mapPrismaMemberToHouseholdMember);
    },
    updateMemberGoogleProfile(memberId, profile) {
      if (!prisma.member.update) {
        return Promise.resolve();
      }

      return prisma.member.update({
        where: {
          id: memberId,
        },
        data: profile,
      }).then(() => undefined);
    },
  };
}
