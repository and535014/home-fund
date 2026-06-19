import { createHash, randomBytes } from "node:crypto";
import type { AuthenticatedMember } from "./authorization";
import {
  acceptInvitation,
  createMemberInvitation,
  fallbackDisplayNameFromEmail,
  normalizeEmail,
  validateInvitationToken,
  type MemberInvitationRecord,
} from "./member-invitations";
import { mapPrismaMemberToHouseholdMember } from "@/auth/current-member-data-source";

type PrismaMemberRow = Parameters<typeof mapPrismaMemberToHouseholdMember>[0] & {
  householdId: string;
};

type PrismaInvitationRow = {
  id: string;
  householdId: string;
  memberId: string | null;
  googleAccountEmail: string | null;
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
        avatarUrl?: string;
        googleAccountEmail?: string;
        googleSubject?: string;
        status: "active";
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
  };
  memberInvitation: {
    findMany(args: {
      select: InvitationSelect;
    }): Promise<PrismaInvitationRow[]>;
    findFirst(args: {
      where: {
        tokenHash?: string;
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
        googleAccountEmail?: string;
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
        memberId: string;
      };
    }): Promise<unknown>;
  };
};

type InvitationSelect = {
  id: true;
  householdId: true;
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
      invitationLink: string;
    }
  | {
      ok: false;
      reason: "permission_denied" | "unknown_error";
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
  context: CreateMemberInvitationInDatabaseContext,
): Promise<CreateMemberInvitationInDatabaseResult> {
  const now = context.now?.() ?? new Date();
  const memberRows = await listMemberRows(context.prisma);
  const decision = createMemberInvitation(actor);

  if (!decision.ok) {
    return decision;
  }

  const actorRow = memberRows.find((member) => member.id === actor.id);

  if (!actorRow) {
    return { ok: false, reason: "permission_denied" };
  }

  const token = context.generateToken?.() ?? randomBytes(32).toString("base64url");
  const invitation = await context.prisma.memberInvitation.create({
    data: {
      householdId: actorRow.householdId,
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
    invitationLink: buildInvitationLink(invitation.previewToken ?? token, context.baseUrl),
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

  const googleEmail = normalizeEmail(input.googleEmail);

  if (!googleEmail) {
    return { ok: false, reason: "missing_google_account" };
  }

  const memberRows = await listMemberRows(context.prisma);
  const existingLinkedMember = memberRows.find((member) => {
    const hasSameEmail = member.googleAccountEmail?.toLowerCase() === googleEmail;
    const hasSameSubject = member.googleSubject === input.googleSubject;

    return member.status === "active" && (hasSameEmail || hasSameSubject);
  });

  if (existingLinkedMember) {
    return { ok: false, reason: "google_account_already_member" };
  }

  const memberId = (await context.prisma.member.create({
    data: {
      householdId: tokenState.invitation.householdId,
      displayName: input.googleDisplayName ?? fallbackDisplayNameFromEmail(googleEmail),
      ...(input.googleAvatarUrl ? { avatarUrl: input.googleAvatarUrl } : {}),
      googleAccountEmail: googleEmail,
      googleSubject: input.googleSubject,
      status: "active",
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
  await context.prisma.memberInvitation.update({
    where: {
      id: tokenState.invitation.id,
    },
    data: {
      status: "accepted",
      acceptedAt: now,
      memberId,
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
    householdId: row.householdId,
    ...(row.memberId ? { memberId: row.memberId } : {}),
    ...(row.googleAccountEmail ? { googleAccountEmail: row.googleAccountEmail } : {}),
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
  householdId: true,
  memberId: true,
  googleAccountEmail: true,
  tokenHash: true,
  previewToken: true,
  status: true,
  expiresAt: true,
} satisfies InvitationSelect;
