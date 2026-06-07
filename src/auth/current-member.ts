import {
  resolveHouseholdAccess,
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

  return resolveHouseholdAccess({
    googleIdentity,
    members: householdMembers,
  });
}
