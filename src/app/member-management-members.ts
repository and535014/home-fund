import { requireAppRouteAccess } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import type { HouseholdMemberStatus } from "@/modules/identity-access/member-management";
import type { MemberRole } from "@/modules/identity-access/authorization";
import {
  buildMemberBindingLink,
  createBindingTokenCrypto,
  type BindingTokenCrypto,
} from "@/modules/identity-access/member-invitation-command";

export type MemberManagementMemberStatus = HouseholdMemberStatus;
export type MemberManagementBindingState =
  | "none"
  | "active"
  | "expired"
  | "bound"
  | "disabled";

export type MemberManagementMember = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  roles: MemberRole[];
  status: MemberManagementMemberStatus;
  binding: {
    state: MemberManagementBindingState;
    link: string | null;
    expiresAt: Date | null;
  };
};

type MemberManagementMemberRow = {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  googleAccountEmail: string | null;
  googleSubject: string | null;
  roles: {
    role: MemberRole;
  }[];
  status: MemberManagementMemberStatus;
  invitations: {
    id: string;
    tokenHash: string;
    tokenCiphertext: string | null;
    tokenIv: string | null;
    tokenAuthTag: string | null;
    status: "pending" | "accepted" | "revoked";
    expiresAt: Date;
    createdAt: Date;
  }[];
};

export async function loadMemberManagementMembers(): Promise<MemberManagementMember[]> {
  const session = await requireAppRouteAccess("members");
  const members = await getPrismaClient().member.findMany({
    where: {
      householdId: session.access.member.householdId,
    },
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
      invitations: {
        where: {
          status: "pending",
        },
        select: {
          id: true,
          tokenHash: true,
          tokenCiphertext: true,
          tokenIv: true,
          tokenAuthTag: true,
          status: true,
          expiresAt: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return mapMemberManagementMemberRows(members as MemberManagementMemberRow[], {
    baseUrl: readBaseUrl(),
    now: new Date(),
    tokenCrypto: createBindingTokenCrypto(),
  });
}

export function mapMemberManagementMemberRows(
  members: MemberManagementMemberRow[],
  context: {
    baseUrl?: string;
    now: Date;
    tokenCrypto: BindingTokenCrypto;
  },
): MemberManagementMember[] {
  return members.map((member) => ({
    id: member.id,
    displayName: member.displayName,
    avatarUrl: member.avatarUrl,
    roles: member.roles.map((role) => role.role),
    status: member.status,
    binding: resolveBinding(member, context),
  }));
}

function resolveBinding(
  member: MemberManagementMemberRow,
  context: {
    baseUrl?: string;
    now: Date;
    tokenCrypto: BindingTokenCrypto;
  },
): MemberManagementMember["binding"] {
  if (member.status === "active") {
    return { state: "bound", link: null, expiresAt: null };
  }

  if (member.status === "disabled") {
    return { state: "disabled", link: null, expiresAt: null };
  }

  const invitation = member.invitations[0];

  if (!invitation) {
    return { state: "none", link: null, expiresAt: null };
  }

  if (invitation.expiresAt <= context.now) {
    return {
      state: "expired",
      link: null,
      expiresAt: invitation.expiresAt,
    };
  }

  if (
    !invitation.tokenCiphertext ||
    !invitation.tokenIv ||
    !invitation.tokenAuthTag
  ) {
    return {
      state: "active",
      link: null,
      expiresAt: invitation.expiresAt,
    };
  }

  try {
    const token = context.tokenCrypto.decrypt({
      tokenCiphertext: invitation.tokenCiphertext,
      tokenIv: invitation.tokenIv,
      tokenAuthTag: invitation.tokenAuthTag,
    });

    return {
      state: "active",
      link: buildMemberBindingLink(token, context.baseUrl),
      expiresAt: invitation.expiresAt,
    };
  } catch {
    return {
      state: "active",
      link: null,
      expiresAt: invitation.expiresAt,
    };
  }
}

function readBaseUrl(): string | undefined {
  return process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
}
