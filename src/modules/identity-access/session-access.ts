import type { AuthenticatedMember } from "./authorization";
import type { HouseholdMemberAccount, HouseholdMemberStatus } from "./member-management";

export type GoogleIdentity = {
  subject: string;
  email?: string;
  displayName?: string;
  avatarUrl?: string;
};

export type ResolveHouseholdAccessInput = {
  googleIdentity: GoogleIdentity | null;
  members: HouseholdMemberAccount[];
};

export type HouseholdAccessProfile = {
  id: string;
  householdId: string;
  displayName: string;
  avatarUrl?: string;
  roles: AuthenticatedMember["roles"];
  capabilities: NonNullable<AuthenticatedMember["capabilities"]>;
};

export type HouseholdScopedAuthenticatedMember = AuthenticatedMember & {
  householdId: string;
};

export type ResolveHouseholdAccessResult =
  | {
      ok: true;
      member: HouseholdScopedAuthenticatedMember;
      profile: HouseholdAccessProfile;
      events: ["Household member access resolved"];
    }
  | {
      ok: false;
      reason:
        | "unauthenticated"
        | "google_account_not_linked"
        | "member_not_active";
      memberStatus?: HouseholdMemberStatus;
    };

export function resolveHouseholdAccess(
  input: ResolveHouseholdAccessInput,
): ResolveHouseholdAccessResult {
  if (!input.googleIdentity) {
    return { ok: false, reason: "unauthenticated" };
  }

  const member = findLinkedMember(input.members, input.googleIdentity);

  if (!member) {
    return { ok: false, reason: "google_account_not_linked" };
  }

  if (member.status !== "active") {
    return {
      ok: false,
      reason: "member_not_active",
      memberStatus: member.status,
    };
  }

  return {
    ok: true,
    member: {
      id: member.id,
      householdId: member.householdId,
      googleAccountLinked: true,
      roles: member.roles,
      capabilities: member.capabilities,
    },
    profile: {
      id: member.id,
      householdId: member.householdId,
      displayName: member.displayName,
      ...(member.avatarUrl ? { avatarUrl: member.avatarUrl } : {}),
      roles: member.roles,
      capabilities: member.capabilities,
    },
    events: ["Household member access resolved"],
  };
}

function findLinkedMember(
  members: HouseholdMemberAccount[],
  googleIdentity: GoogleIdentity,
): HouseholdMemberAccount | undefined {
  const bySubject = members.find(
    (member) => member.googleSubject === googleIdentity.subject,
  );

  if (bySubject) {
    return bySubject;
  }

  const normalizedEmail = googleIdentity.email?.trim().toLowerCase();

  if (!normalizedEmail) {
    return undefined;
  }

  return members.find(
    (member) => member.googleAccountEmail?.toLowerCase() === normalizedEmail,
  );
}
