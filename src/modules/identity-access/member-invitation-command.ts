import { createHash, randomBytes } from "node:crypto";
import type { AuthenticatedMember } from "./authorization";
import {
  acceptInvitation,
  createMemberInvitation,
  fallbackDisplayNameFromEmail,
  validateInvitationToken,
  type MemberInvitationRecord,
} from "./member-invitations";
import { mapPrismaMemberToHouseholdMember } from "@/auth/current-member-data-source";

type PrismaMemberRow = Parameters<typeof mapPrismaMemberToHouseholdMember>[0] & {
  householdId: string;
};

type PrismaInvitationRow = {
  id: string;
  memberId: string;
  googleAccountEmail: string;
  tokenHash: string;
  previewToken: string | null;
  status: MemberInvitationRecord["status"];
  expiresAt: Date;
};

export type MemberInvitationCommandPrismaClient = {
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
    }): Promise<PrismaMemberRow[]>;
    create(args: {
      data: {
        householdId: string;
        displayName: string;
        googleAccountEmail: string;
        status: "invited";
        roles: {
          create: Array<{
            role: "general_member";
          }>;
        };
      };
      select: {
        id: true;
      };
    }): Promise<{ id: string }>;
    update(args: {
      where: {
        id: string;
      };
      data: {
        displayName?: string;
        avatarUrl?: string;
        googleAccountEmail?: string;
        googleSubject?: string;
        status?: "active";
      };
    }): Promise<unknown>;
  };
  memberInvitation: {
    findMany(args: {
      select: InvitationSelect;
    }): Promise<PrismaInvitationRow[]>;
    findFirst(args: {
      where: {
        tokenHash?: string;
        memberId?: string;
        status?: "pending";
      };
      select: InvitationSelect;
      orderBy?: {
        createdAt: "desc";
      };
    }): Promise<PrismaInvitationRow | null>;
    create(args: {
      data: {
        householdId: string;
        memberId: string;
        googleAccountEmail: string;
        tokenHash: string;
        previewToken: string;
        status: "pending";
        expiresAt: Date;
        createdById: string;
      };
      select: InvitationSelect;
    }): Promise<PrismaInvitationRow>;
    update(args: {
      where: {
        id: string;
      };
      data: {
        status: "accepted";
        acceptedAt: Date;
      };
    }): Promise<unknown>;
  };
};

type InvitationSelect = {
  id: true;
  memberId: true;
  googleAccountEmail: true;
  tokenHash: true;
  previewToken: true;
  status: true;
  expiresAt: true;
};

export type CreateMemberInvitationInDatabaseContext = {
  baseUrl?: string;
  generateToken?: () => string;
  now?: () => Date;
  prisma: MemberInvitationCommandPrismaClient;
};

export type CreateMemberInvitationInDatabaseResult =
  | {
      ok: true;
      email: string;
      invitationLink: string;
      memberId: string;
    }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "invalid_email"
        | "member_already_active"
        | "unknown_error";
    };

export type AcceptMemberInvitationInDatabaseInput = {
  token: string;
  googleEmail?: string;
  googleSubject: string;
  googleDisplayName?: string;
  googleAvatarUrl?: string;
};

export async function createMemberInvitationInDatabase(
  actor: AuthenticatedMember,
  command: {
    googleEmail: string;
  },
  context: CreateMemberInvitationInDatabaseContext,
): Promise<CreateMemberInvitationInDatabaseResult> {
  const now = context.now?.() ?? new Date();
  const memberRows = await listMemberRows(context.prisma);
  const members = memberRows.map(mapPrismaMemberToHouseholdMember);
  const invitations = await listInvitations(context.prisma);
  const decision = createMemberInvitation(actor, command, {
    members,
    invitations,
    now,
  });

  if (!decision.ok) {
    return decision;
  }

  if (decision.kind === "existing") {
    const invitation = decision.invitation;
    const token = invitation?.previewToken;

    if (!invitation || !token) {
      return { ok: false, reason: "unknown_error" };
    }

    return {
      ok: true,
      email: decision.email,
      invitationLink: buildInvitationLink(token, context.baseUrl),
      memberId: invitation.memberId,
    };
  }

  const actorRow = memberRows.find((member) => member.id === actor.id);

  if (!actorRow) {
    return { ok: false, reason: "permission_denied" };
  }

  const existingInvitedMember = memberRows.find(
    (member) =>
      member.googleAccountEmail?.toLowerCase() === decision.email &&
      member.status === "invited",
  );
  const memberId = existingInvitedMember?.id ?? (await context.prisma.member.create({
    data: {
      householdId: actorRow.householdId,
      displayName: fallbackDisplayNameFromEmail(decision.email),
      googleAccountEmail: decision.email,
      status: "invited",
      roles: {
        create: [
          {
            role: "general_member",
          },
        ],
      },
    },
    select: {
      id: true,
    },
  })).id;
  const token = context.generateToken?.() ?? randomBytes(32).toString("base64url");
  const invitation = await context.prisma.memberInvitation.create({
    data: {
      householdId: actorRow.householdId,
      memberId,
      googleAccountEmail: decision.email,
      tokenHash: hashInvitationToken(token),
      previewToken: token,
      status: "pending",
      expiresAt: addDays(now, 7),
      createdById: actor.id,
    },
    select: invitationSelect,
  });

  return {
    ok: true,
    email: decision.email,
    invitationLink: buildInvitationLink(invitation.previewToken ?? token, context.baseUrl),
    memberId,
  };
}

export async function validateMemberInvitationTokenInDatabase(
  token: string | undefined,
  context: {
    now?: () => Date;
    prisma: MemberInvitationCommandPrismaClient;
  },
) {
  const invitation = token
    ? await findInvitationByToken(context.prisma, token)
    : undefined;

  return validateInvitationToken(token, invitation, context.now?.() ?? new Date());
}

export async function acceptMemberInvitationInDatabase(
  input: AcceptMemberInvitationInDatabaseInput,
  context: {
    now?: () => Date;
    prisma: MemberInvitationCommandPrismaClient;
  },
) {
  const now = context.now?.() ?? new Date();
  const invitation = await findInvitationByToken(context.prisma, input.token);
  const tokenState = validateInvitationToken(input.token, invitation, now);

  if (!tokenState.ok) {
    return tokenState;
  }

  const decision = acceptInvitation({
    invitation: tokenState.invitation,
    googleEmail: input.googleEmail,
  }, now);

  if (!decision.ok) {
    return decision;
  }

  await context.prisma.member.update({
    where: {
      id: tokenState.invitation.memberId,
    },
    data: {
      ...(input.googleDisplayName
        ? { displayName: input.googleDisplayName }
        : {}),
      ...(input.googleAvatarUrl ? { avatarUrl: input.googleAvatarUrl } : {}),
      googleAccountEmail: tokenState.invitation.googleAccountEmail,
      googleSubject: input.googleSubject,
      status: "active",
    },
  });
  await context.prisma.memberInvitation.update({
    where: {
      id: tokenState.invitation.id,
    },
    data: {
      status: "accepted",
      acceptedAt: now,
    },
  });

  return decision;
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildInvitationLink(token: string, baseUrl?: string): string {
  const path = `/invite/accept?token=${encodeURIComponent(token)}`;

  if (!baseUrl) {
    return path;
  }

  return new URL(path, baseUrl).toString();
}

async function listMemberRows(
  prisma: MemberInvitationCommandPrismaClient,
): Promise<PrismaMemberRow[]> {
  return prisma.member.findMany({
    select: {
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
    },
    orderBy: {
      displayName: "asc",
    },
  });
}

async function listInvitations(
  prisma: MemberInvitationCommandPrismaClient,
): Promise<MemberInvitationRecord[]> {
  const invitations = await prisma.memberInvitation.findMany({
    select: invitationSelect,
  });

  return invitations.map(mapInvitationRow);
}

async function findInvitationByToken(
  prisma: MemberInvitationCommandPrismaClient,
  token: string,
): Promise<MemberInvitationRecord | undefined> {
  const invitation = await prisma.memberInvitation.findFirst({
    where: {
      tokenHash: hashInvitationToken(token),
    },
    select: invitationSelect,
  });

  return invitation ? mapInvitationRow(invitation) : undefined;
}

function mapInvitationRow(row: PrismaInvitationRow): MemberInvitationRecord {
  return {
    id: row.id,
    memberId: row.memberId,
    googleAccountEmail: row.googleAccountEmail,
    tokenHash: row.tokenHash,
    ...(row.previewToken ? { previewToken: row.previewToken } : {}),
    status: row.status,
    expiresAt: row.expiresAt,
  };
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

const invitationSelect = {
  id: true,
  memberId: true,
  googleAccountEmail: true,
  tokenHash: true,
  previewToken: true,
  status: true,
  expiresAt: true,
} satisfies InvitationSelect;
