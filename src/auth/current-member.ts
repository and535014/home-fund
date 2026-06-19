import {
  resolveHouseholdAccess,
  type GoogleIdentity,
  type ResolveHouseholdAccessResult,
} from "../modules/identity-access/session-access";
import type { HouseholdMemberAccount } from "../modules/identity-access/member-management";
import {
  resolveGoogleIdentityFromAuthSession,
  type BetterAuthAccountIdentity,
  type BetterAuthSessionUser,
} from "./session-identity";

export type CurrentMemberDataSource = {
  listAccountsForUser(userId: string): Promise<BetterAuthAccountIdentity[]>;
  listHouseholdMembers(): Promise<HouseholdMemberAccount[]>;
  updateMemberGoogleProfile?: (
    memberId: string,
    profile: MemberGoogleProfileUpdate,
  ) => Promise<void>;
};

export type MemberGoogleProfileUpdate = {
  displayName?: string;
  avatarUrl?: string;
  googleAccountEmail?: string;
  googleSubject?: string;
};

export type ResolveCurrentMemberInput = {
  user: BetterAuthSessionUser | null;
  dataSource: CurrentMemberDataSource;
};

export async function resolveCurrentMember(
  input: ResolveCurrentMemberInput,
): Promise<ResolveHouseholdAccessResult> {
  if (!input.user) {
    return resolveHouseholdAccess({
      googleIdentity: null,
      members: [],
    });
  }

  const [accounts, householdMembers] = await Promise.all([
    input.dataSource.listAccountsForUser(input.user.id),
    input.dataSource.listHouseholdMembers(),
  ]);
  const googleIdentity = resolveGoogleIdentityFromAuthSession({
    user: input.user,
    accounts,
  });

  if (!googleIdentity) {
    return {
      ok: false,
      reason: "google_account_not_linked",
    };
  }

  const access = resolveHouseholdAccess({
    googleIdentity,
    members: householdMembers,
  });

  if (!access.ok) {
    return access;
  }

  const linkedMember = householdMembers.find(
    (member) => member.id === access.member.id,
  );
  const nextProfile = buildMemberGoogleProfileUpdate(
    linkedMember,
    googleIdentity,
  );

  if (input.dataSource.updateMemberGoogleProfile && hasProfileUpdates(nextProfile)) {
    await input.dataSource.updateMemberGoogleProfile(access.member.id, nextProfile);
  }

  return {
    ...access,
    profile: {
      ...access.profile,
      ...(nextProfile.displayName
        ? { displayName: nextProfile.displayName }
        : {}),
      ...(nextProfile.avatarUrl
        ? { avatarUrl: nextProfile.avatarUrl }
        : {}),
    },
  };
}

function buildMemberGoogleProfileUpdate(
  member: HouseholdMemberAccount | undefined,
  googleIdentity: GoogleIdentity,
): MemberGoogleProfileUpdate {
  if (!member) {
    return {};
  }

  const nextDisplayName = shouldUseGoogleDisplayName(member, googleIdentity)
    ? googleIdentity.displayName
    : undefined;
  const nextAvatarUrl = googleIdentity.avatarUrl &&
    googleIdentity.avatarUrl !== member.avatarUrl
    ? googleIdentity.avatarUrl
    : undefined;
  const nextGoogleAccountEmail = googleIdentity.email &&
    googleIdentity.email !== member.googleAccountEmail?.toLowerCase()
    ? googleIdentity.email
    : undefined;
  const nextGoogleSubject = googleIdentity.subject !== member.googleSubject
    ? googleIdentity.subject
    : undefined;

  return {
    ...(nextDisplayName ? { displayName: nextDisplayName } : {}),
    ...(nextAvatarUrl ? { avatarUrl: nextAvatarUrl } : {}),
    ...(nextGoogleAccountEmail
      ? { googleAccountEmail: nextGoogleAccountEmail }
      : {}),
    ...(nextGoogleSubject ? { googleSubject: nextGoogleSubject } : {}),
  };
}

function shouldUseGoogleDisplayName(
  member: HouseholdMemberAccount,
  googleIdentity: GoogleIdentity,
): boolean {
  if (!googleIdentity.displayName) {
    return false;
  }

  const currentName = member.displayName.trim();

  return currentName.length === 0 || currentName === "Admin";
}

function hasProfileUpdates(profile: MemberGoogleProfileUpdate): boolean {
  return Object.values(profile).some(Boolean);
}
