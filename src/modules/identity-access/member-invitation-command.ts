import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from "node:crypto";
import type { AuthenticatedMember } from "./authorization";
import {
  acceptInvitation,
  createMemberInvitation,
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
  tokenCiphertext: string | null;
  tokenIv: string | null;
  tokenAuthTag: string | null;
  status: MemberInvitationRecord["status"];
  expiresAt: Date;
};

export type MemberInvitationCommandPrismaClient = {
  $transaction?<T>(
    callback: (transaction: MemberInvitationCommandPrismaClient) => Promise<T>,
  ): Promise<T>;
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
    update(args: {
      where: {
        id: string;
      };
      data: {
        status: "active";
        avatarUrl?: string;
        googleAccountEmail: string;
        googleSubject: string;
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
        memberId?: string;
        googleAccountEmail?: string;
        tokenHash: string;
        tokenCiphertext: string;
        tokenIv: string;
        tokenAuthTag: string;
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
    updateMany(args: {
      where: {
        memberId: string;
        status: "pending";
      };
      data: {
        status: "revoked";
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
  tokenCiphertext: true;
  tokenIv: true;
  tokenAuthTag: true;
  status: true;
  expiresAt: true;
};

export type BindingTokenEncrypted = {
  tokenCiphertext: string;
  tokenIv: string;
  tokenAuthTag: string;
};

export type BindingTokenCrypto = {
  encrypt(token: string): BindingTokenEncrypted;
  decrypt(encrypted: BindingTokenEncrypted): string;
};

export class BindingTokenConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BindingTokenConfigurationError";
  }
}

export function isBindingTokenConfigurationError(
  error: unknown,
): error is BindingTokenConfigurationError {
  return error instanceof BindingTokenConfigurationError;
}

export type MemberBindingLinkInDatabaseContext = {
  baseUrl?: string;
  generateToken?: () => string;
  now?: () => Date;
  tokenCrypto?: BindingTokenCrypto;
  prisma: MemberInvitationCommandPrismaClient;
};

export type GenerateMemberBindingLinkInDatabaseContext =
  MemberBindingLinkInDatabaseContext & {
    memberId: string;
  };

export type GenerateMemberBindingLinkInDatabaseResult =
  | {
      ok: true;
      bindingLink: string;
      expiresAt: Date;
    }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "member_not_found"
        | "member_already_bound"
        | "member_disabled"
        | "unknown_error";
    };

export type AcceptMemberInvitationInDatabaseInput = {
  token: string;
  googleEmail?: string;
  googleSubject: string;
  googleDisplayName?: string;
  googleAvatarUrl?: string;
};

export async function generateMemberBindingLinkInDatabase(
  actor: AuthenticatedMember,
  context: GenerateMemberBindingLinkInDatabaseContext,
): Promise<GenerateMemberBindingLinkInDatabaseResult> {
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

  const targetMember = memberRows.find((member) => member.id === context.memberId);

  if (!targetMember || targetMember.householdId !== actorRow.householdId) {
    return { ok: false, reason: "member_not_found" };
  }

  if (targetMember.status === "disabled") {
    return { ok: false, reason: "member_disabled" };
  }

  if (
    targetMember.status !== "invited" ||
    targetMember.googleSubject ||
    targetMember.googleAccountEmail
  ) {
    return { ok: false, reason: "member_already_bound" };
  }

  const latestPending = await findPendingBindingInvitation(
    context.prisma,
    context.memberId,
  );

  if (latestPending && latestPending.expiresAt > now) {
    const token = decryptInvitationToken(latestPending, context.tokenCrypto);

    if (!token) {
      return { ok: false, reason: "unknown_error" };
    }

    return {
      ok: true,
      bindingLink: buildMemberBindingLink(token, context.baseUrl),
      expiresAt: latestPending.expiresAt,
    };
  }

  if (latestPending) {
    await context.prisma.memberInvitation.updateMany({
      where: {
        memberId: context.memberId,
        status: "pending",
      },
      data: {
        status: "revoked",
      },
    });
  }

  const token = context.generateToken?.() ?? randomBytes(32).toString("base64url");
  const encrypted = (context.tokenCrypto ?? createBindingTokenCrypto()).encrypt(token);
  const invitation = await createPendingBindingInvitation({
    context,
    actorId: actor.id,
    householdId: actorRow.householdId,
    memberId: targetMember.id,
    token,
    encrypted,
    now,
  });

  if (!invitation) {
    const concurrentPending = await findPendingBindingInvitation(
      context.prisma,
      context.memberId,
    );
    const concurrentToken = concurrentPending && concurrentPending.expiresAt > now
      ? decryptInvitationToken(concurrentPending, context.tokenCrypto)
      : undefined;

    if (!concurrentPending || !concurrentToken) {
      return { ok: false, reason: "unknown_error" };
    }

    return {
      ok: true,
      bindingLink: buildMemberBindingLink(concurrentToken, context.baseUrl),
      expiresAt: concurrentPending.expiresAt,
    };
  }

  return {
    ok: true,
    bindingLink: buildMemberBindingLink(token, context.baseUrl),
    expiresAt: invitation.expiresAt,
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

export async function validateMemberBindingTokenInDatabase(
  token: string | undefined,
  context: {
    now?: () => Date;
    prisma: MemberInvitationCommandPrismaClient;
  },
) {
  const now = context.now?.() ?? new Date();
  const invitation = token
    ? await findInvitationByToken(context.prisma, token)
    : undefined;
  const tokenState = validateInvitationToken(token, invitation, now);

  if (!tokenState.ok) {
    return tokenState;
  }

  const memberRows = await listMemberRows(context.prisma);

  if (!isValidBindingTarget(tokenState.invitation, memberRows)) {
    return { ok: false as const, reason: "invalid_invite" as const };
  }

  return tokenState;
}

export async function acceptMemberInvitationInDatabase(
  input: AcceptMemberInvitationInDatabaseInput,
  context: {
    now?: () => Date;
    prisma: MemberInvitationCommandPrismaClient;
  },
) {
  const now = context.now?.() ?? new Date();
  const runTransaction = <T>(
    callback: (transaction: MemberInvitationCommandPrismaClient) => Promise<T>,
  ) => context.prisma.$transaction
    ? context.prisma.$transaction(callback)
    : callback(context.prisma);

  return runTransaction(async (prisma) => {
    const invitation = await findInvitationByToken(prisma, input.token);
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

    const memberRows = await listMemberRows(prisma);
    const existingLinkedMember = memberRows.find((member) => {
      const hasSameEmail = member.googleAccountEmail?.toLowerCase() === googleEmail;
      const hasSameSubject = member.googleSubject === input.googleSubject;

      return member.status === "active" && (hasSameEmail || hasSameSubject);
    });

    if (existingLinkedMember) {
      return { ok: false, reason: "google_account_already_member" };
    }

    const targetMember = findBindingTarget(tokenState.invitation, memberRows);

    if (!targetMember) {
      return { ok: false, reason: "invalid_invite" };
    }

    await prisma.member.update({
      where: {
        id: targetMember.id,
      },
      data: {
        status: "active",
        ...(!targetMember.avatarUrl && input.googleAvatarUrl
          ? { avatarUrl: input.googleAvatarUrl }
          : {}),
        googleAccountEmail: googleEmail,
        googleSubject: input.googleSubject,
      },
    });
    await prisma.memberInvitation.update({
      where: {
        id: tokenState.invitation.id,
      },
      data: {
        status: "accepted",
        acceptedAt: now,
        memberId: targetMember.id,
      },
    });

    return decision;
  });
}

export function hashInvitationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function buildMemberBindingLink(token: string, baseUrl?: string): string {
  const path = `/members/bind?token=${encodeURIComponent(token)}`;

  if (!baseUrl) {
    return path;
  }

  return new URL(path, baseUrl).toString();
}

async function createPendingBindingInvitation({
  context,
  actorId,
  householdId,
  memberId,
  token,
  encrypted,
  now,
}: {
  context: GenerateMemberBindingLinkInDatabaseContext;
  actorId: string;
  householdId: string;
  memberId: string;
  token: string;
  encrypted: BindingTokenEncrypted;
  now: Date;
}): Promise<PrismaInvitationRow | null> {
  try {
    return await context.prisma.memberInvitation.create({
      data: {
        householdId,
        memberId,
        tokenHash: hashInvitationToken(token),
        ...encrypted,
        status: "pending",
        expiresAt: addDays(now, 7),
        createdById: actorId,
      },
      select: invitationSelect,
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return null;
    }

    throw error;
  }
}

async function findPendingBindingInvitation(
  prisma: MemberInvitationCommandPrismaClient,
  memberId: string,
): Promise<PrismaInvitationRow | null> {
  return prisma.memberInvitation.findFirst({
    where: {
      memberId,
      status: "pending",
    },
    select: invitationSelect,
    orderBy: {
      createdAt: "desc",
    },
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "P2002";
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
    ...(row.tokenCiphertext ? { tokenCiphertext: row.tokenCiphertext } : {}),
    ...(row.tokenIv ? { tokenIv: row.tokenIv } : {}),
    ...(row.tokenAuthTag ? { tokenAuthTag: row.tokenAuthTag } : {}),
    status: row.status,
    expiresAt: row.expiresAt,
  };
}

function isValidBindingTarget(
  invitation: MemberInvitationRecord,
  memberRows: PrismaMemberRow[],
): boolean {
  return Boolean(findBindingTarget(invitation, memberRows));
}

function findBindingTarget(
  invitation: MemberInvitationRecord,
  memberRows: PrismaMemberRow[],
): PrismaMemberRow | undefined {
  const targetMemberId = invitation.memberId;

  if (!targetMemberId) {
    return undefined;
  }

  const targetMember = memberRows.find((member) => member.id === targetMemberId);

  if (
    !targetMember ||
    targetMember.householdId !== invitation.householdId ||
    targetMember.status !== "invited" ||
    targetMember.googleSubject ||
    targetMember.googleAccountEmail
  ) {
    return undefined;
  }

  return targetMember;
}

function decryptInvitationToken(
  invitation: PrismaInvitationRow,
  tokenCrypto: BindingTokenCrypto | undefined,
): string | undefined {
  if (
    !invitation.tokenCiphertext ||
    !invitation.tokenIv ||
    !invitation.tokenAuthTag
  ) {
    return undefined;
  }

  try {
    return (tokenCrypto ?? createBindingTokenCrypto()).decrypt({
      tokenCiphertext: invitation.tokenCiphertext,
      tokenIv: invitation.tokenIv,
      tokenAuthTag: invitation.tokenAuthTag,
    });
  } catch {
    return undefined;
  }
}

export function createBindingTokenCrypto(): BindingTokenCrypto {
  return {
    encrypt(token) {
      const key = readBindingTokenEncryptionKey();
      const iv = randomBytes(12);
      const cipher = createCipheriv("aes-256-gcm", key, iv);
      const tokenCiphertext = Buffer.concat([
        cipher.update(token, "utf8"),
        cipher.final(),
      ]).toString("base64url");

      return {
        tokenCiphertext,
        tokenIv: iv.toString("base64url"),
        tokenAuthTag: cipher.getAuthTag().toString("base64url"),
      };
    },
    decrypt(encrypted) {
      const key = readBindingTokenEncryptionKey();
      const decipher = createDecipheriv(
        "aes-256-gcm",
        key,
        Buffer.from(encrypted.tokenIv, "base64url"),
      );
      decipher.setAuthTag(Buffer.from(encrypted.tokenAuthTag, "base64url"));

      return Buffer.concat([
        decipher.update(Buffer.from(encrypted.tokenCiphertext, "base64url")),
        decipher.final(),
      ]).toString("utf8");
    },
  };
}

function readBindingTokenEncryptionKey(): Buffer {
  const encoded = process.env.MEMBER_BINDING_TOKEN_ENCRYPTION_KEY;

  if (!encoded) {
      throw new BindingTokenConfigurationError(
        "MEMBER_BINDING_TOKEN_ENCRYPTION_KEY is required",
      );
  }

  const key = Buffer.from(encoded, "base64");

  if (key.length !== 32) {
    throw new BindingTokenConfigurationError(
      "MEMBER_BINDING_TOKEN_ENCRYPTION_KEY must be 32 base64 bytes",
    );
  }

  return key;
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
  tokenCiphertext: true,
  tokenIv: true,
  tokenAuthTag: true,
  status: true,
  expiresAt: true,
} satisfies InvitationSelect;
