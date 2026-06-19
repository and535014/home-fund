import type { AuthenticatedMember } from "./authorization";
import {
  updateMemberDisplayName,
  type HouseholdMemberAccount,
  type UpdateMemberDisplayNameCommand,
} from "./member-management";
import { mapPrismaMemberToHouseholdMember } from "@/auth/current-member-data-source";

type PrismaMemberRow = Parameters<typeof mapPrismaMemberToHouseholdMember>[0];

export type MemberManagementCommandPrismaClient = {
  member: {
    findMany(args: {
      select: {
        id: true;
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
    }): Promise<PrismaMemberRow[]>;
    update(args: {
      where: {
        id: string;
      };
      data: {
        displayName: string;
      };
    }): Promise<unknown>;
  };
};

export type UpdateMemberDisplayNameInDatabaseContext = {
  prisma: MemberManagementCommandPrismaClient;
};

export async function updateMemberDisplayNameInDatabase(
  actor: AuthenticatedMember,
  command: UpdateMemberDisplayNameCommand,
  context: UpdateMemberDisplayNameInDatabaseContext,
) {
  const members = await listHouseholdMembers(context.prisma);
  const result = updateMemberDisplayName(actor, command, { members });

  if (!result.ok) {
    return result;
  }

  await context.prisma.member.update({
    where: {
      id: result.member.id,
    },
    data: {
      displayName: result.member.displayName,
    },
  });

  return result;
}

async function listHouseholdMembers(
  prisma: MemberManagementCommandPrismaClient,
): Promise<HouseholdMemberAccount[]> {
  const members = await prisma.member.findMany({
    select: {
      id: true,
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
    },
    orderBy: {
      displayName: "asc",
    },
  });

  return members.map(mapPrismaMemberToHouseholdMember);
}
