import type { GoogleIdentity } from "../modules/identity-access/session-access";

export type BetterAuthSessionUser = {
  id: string;
  email?: string | null;
};

export type BetterAuthAccountIdentity = {
  providerId: string;
  accountId: string;
  userId: string;
};

export type ResolveGoogleIdentityFromAuthSessionInput = {
  user: BetterAuthSessionUser | null;
  accounts: BetterAuthAccountIdentity[];
};

export function resolveGoogleIdentityFromAuthSession(
  input: ResolveGoogleIdentityFromAuthSessionInput,
): GoogleIdentity | null {
  if (!input.user) {
    return null;
  }

  const googleAccount = input.accounts.find(
    (account) =>
      account.userId === input.user?.id && account.providerId === "google",
  );

  if (!googleAccount) {
    return null;
  }

  const normalizedEmail = input.user.email?.trim().toLowerCase();

  return {
    subject: googleAccount.accountId,
    ...(normalizedEmail ? { email: normalizedEmail } : {}),
  };
}
