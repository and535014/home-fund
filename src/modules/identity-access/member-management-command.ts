import type { AuthenticatedMember } from "./authorization";
import {
  createMember,
  updateMemberDisplayName,
  type CreateMemberCommand,
  type HouseholdMemberAccount,
  type UpdateMemberDisplayNameCommand,
} from "./member-management";
import { mapPrismaMemberToHouseholdMember } from "@/auth/current-member-data-source";

type PrismaMemberRow = Parameters<typeof mapPrismaMemberToHouseholdMember>[0] & {
  householdId: string;
};

export type MemberManagementCommandPrismaClient = {
  member: {
    findMany(args: {
      select: MemberSelect;
      orderBy: {
        displayName: "asc";
      };
    }): Promise<PrismaMemberRow[]>;
    create(args: {
      data: {
        householdId: string;
        displayName: string;
        status: "invited";
        roles: {
          create: Array<{
            role: "admin" | "finance_manager" | "general_member";
          }>;
        };
      };
      select: MemberSelect;
    }): Promise<PrismaMemberRow>;
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

type MemberSelect = {
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

export async function createMemberInDatabase(
  actor: AuthenticatedMember,
  command: CreateMemberCommand,
  context: UpdateMemberDisplayNameInDatabaseContext,
) {
  const members = await listMemberRows(context.prisma);
  const actorRow = members.find((member) => member.id === actor.id);
  const result = createMember(actor, command, {
    members: members.map(mapPrismaMemberToHouseholdMember),
  });

  if (!result.ok) {
    return result;
  }

  if (!actorRow) {
    return { ok: false as const, reason: "permission_denied" as const };
  }

  const member = await context.prisma.member.create({
    data: {
      householdId: actorRow.householdId,
      displayName: result.member.displayName,
      status: "invited",
      roles: {
        create: result.member.roles.map((role) => ({ role })),
      },
    },
    select: memberSelect,
  });

  return {
    ...result,
    member: mapPrismaMemberToHouseholdMember(member),
  };
}

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
  const members = await listMemberRows(prisma);

  return members.map(mapPrismaMemberToHouseholdMember);
}

async function listMemberRows(
  prisma: MemberManagementCommandPrismaClient,
): Promise<PrismaMemberRow[]> {
  return prisma.member.findMany({
    select: memberSelect,
    orderBy: {
      displayName: "asc",
    },
  });
}

const memberSelect = {
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
} satisfies MemberSelect;
