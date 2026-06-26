import {
  authorize,
  type AuthenticatedMember,
  type AuthorizationResult,
  type MemberCapability,
  type MemberRole,
} from "./authorization";

export type HouseholdMemberStatus = "invited" | "active" | "disabled";

export type HouseholdMemberAccount = {
  id: string;
  householdId: string;
  displayName: string;
  avatarUrl?: string;
  googleAccountEmail?: string;
  googleSubject?: string;
  roles: MemberRole[];
  capabilities: MemberCapability[];
  status: HouseholdMemberStatus;
};

export type MemberManagementContext = {
  householdId: string;
  members: HouseholdMemberAccount[];
  generateId?: () => string;
};

export type CreateMemberCommand = {
  displayName: string;
  googleAccountEmail?: string;
  role?: MemberRole;
};

export type UpdateMemberDisplayNameCommand = {
  memberId: string;
  displayName: string;
};

export type UpdateMemberPermissionsCommand = {
  memberId: string;
  roles: MemberRole[];
  capabilities: MemberCapability[];
};

export type MemberManagementResult =
  | {
      ok: true;
      member: HouseholdMemberAccount;
      events: (
        | "Member created"
        | "Member account updated"
        | "Member permissions changed"
      )[];
    }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "invalid_display_name"
        | "duplicate_google_account_email"
        | "member_not_found"
        | "cannot_remove_last_admin"
        | "member_must_have_role";
      authorizationReason?: Exclude<AuthorizationResult, { allowed: true }>["reason"];
    };

export function createMember(
  actor: AuthenticatedMember,
  command: CreateMemberCommand,
  context: MemberManagementContext,
): MemberManagementResult {
  const permission = canManageMembers(actor);

  if (permission.ok === false) {
    return permission;
  }

  const displayName = normalizeDisplayName(command.displayName);

  if (!displayName) {
    return { ok: false, reason: "invalid_display_name" };
  }

  const googleAccountEmail = normalizeEmail(command.googleAccountEmail);

  if (
    googleAccountEmail &&
    context.members.some(
      (member) =>
        member.googleAccountEmail?.toLowerCase() === googleAccountEmail.toLowerCase(),
    )
  ) {
    return { ok: false, reason: "duplicate_google_account_email" };
  }

  return {
    ok: true,
    member: {
      id: context.generateId?.() ?? crypto.randomUUID(),
      householdId: context.householdId,
      displayName,
      ...(googleAccountEmail ? { googleAccountEmail } : {}),
      roles: [command.role ?? "general_member"],
      capabilities: [],
      status: "active",
    },
    events: ["Member created"],
  };
}

export function updateMemberDisplayName(
  actor: AuthenticatedMember,
  command: UpdateMemberDisplayNameCommand,
  context: MemberManagementContext,
): MemberManagementResult {
  const permission = canManageMembers(actor);

  if (permission.ok === false) {
    return permission;
  }

  const member = findMember(context.members, command.memberId);

  if (!member) {
    return { ok: false, reason: "member_not_found" };
  }

  const displayName = normalizeDisplayName(command.displayName);

  if (!displayName) {
    return { ok: false, reason: "invalid_display_name" };
  }

  return {
    ok: true,
    member: {
      ...member,
      displayName,
    },
    events: ["Member account updated"],
  };
}

export function updateMemberPermissions(
  actor: AuthenticatedMember,
  command: UpdateMemberPermissionsCommand,
  context: MemberManagementContext,
): MemberManagementResult {
  const permission = canManageMembers(actor);

  if (permission.ok === false) {
    return permission;
  }

  const member = findMember(context.members, command.memberId);

  if (!member) {
    return { ok: false, reason: "member_not_found" };
  }

  const roles = unique(command.roles);
  const capabilities = unique(command.capabilities);

  if (roles.length === 0) {
    return { ok: false, reason: "member_must_have_role" };
  }

  if (
    member.roles.includes("admin") &&
    !roles.includes("admin") &&
    countAdmins(context.members) === 1
  ) {
    return { ok: false, reason: "cannot_remove_last_admin" };
  }

  return {
    ok: true,
    member: {
      ...member,
      roles,
      capabilities,
    },
    events: ["Member permissions changed"],
  };
}

function canManageMembers(
  actor: AuthenticatedMember,
): Extract<MemberManagementResult, { ok: false }> | { ok: true } {
  const authorization = authorize(actor, { type: "manage_members" });

  if (!authorization.allowed) {
    return {
      ok: false,
      reason: "permission_denied",
      authorizationReason: authorization.reason,
    };
  }

  return { ok: true };
}

function normalizeDisplayName(displayName: string): string {
  return displayName.trim();
}

function normalizeEmail(email: string | undefined): string | undefined {
  const normalized = email?.trim().toLowerCase();

  return normalized || undefined;
}

function findMember(
  members: HouseholdMemberAccount[],
  memberId: string,
): HouseholdMemberAccount | undefined {
  return members.find((member) => member.id === memberId);
}

function countAdmins(members: HouseholdMemberAccount[]): number {
  return members.filter((member) => member.roles.includes("admin")).length;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}
