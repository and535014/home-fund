import { authorize, type AuthenticatedMember } from "./authorization";

export type MemberInvitationStatus = "pending" | "accepted" | "revoked";

export type MemberInvitationRecord = {
  id: string;
  householdId: string;
  memberId?: string;
  googleAccountEmail?: string;
  tokenHash: string;
  tokenCiphertext?: string;
  tokenIv?: string;
  tokenAuthTag?: string;
  status: MemberInvitationStatus;
  expiresAt: Date;
};

export type CreateMemberInvitationResult =
  | {
      ok: true;
      events: ["Member invitation created"];
    }
  | {
      ok: false;
      reason: "permission_denied";
    };

export type ValidateInvitationTokenResult =
  | {
      ok: true;
      invitation: MemberInvitationRecord;
    }
  | {
      ok: false;
      reason:
        | "missing_token"
        | "invalid_invite"
        | "expired_invite"
        | "accepted_invite"
        | "revoked_invite";
    };

export type AcceptInvitationInput = {
  invitation: MemberInvitationRecord;
  googleEmail?: string;
};

export type AcceptInvitationResult =
  | {
      ok: true;
      events: ["Member invitation accepted"];
    }
  | {
      ok: false;
      reason:
        | "missing_google_account"
        | "missing_token"
        | "invalid_invite"
        | "expired_invite"
        | "accepted_invite"
        | "revoked_invite";
    };

export function createMemberInvitation(
  actor: AuthenticatedMember,
): CreateMemberInvitationResult {
  const authorization = authorize(actor, { type: "manage_members" });

  if (!authorization.allowed) {
    return { ok: false, reason: "permission_denied" };
  }

  return {
    ok: true,
    events: ["Member invitation created"],
  };
}

export function validateInvitationToken(
  token: string | undefined,
  invitation: MemberInvitationRecord | undefined,
  now: Date,
): ValidateInvitationTokenResult {
  if (!token) {
    return { ok: false, reason: "missing_token" };
  }

  if (!invitation) {
    return { ok: false, reason: "invalid_invite" };
  }

  if (invitation.status === "accepted") {
    return { ok: false, reason: "accepted_invite" };
  }

  if (invitation.status === "revoked") {
    return { ok: false, reason: "revoked_invite" };
  }

  if (invitation.expiresAt <= now) {
    return { ok: false, reason: "expired_invite" };
  }

  return { ok: true, invitation };
}

export function acceptInvitation(
  input: AcceptInvitationInput,
  now: Date,
): AcceptInvitationResult {
  const tokenState = validateInvitationToken("present", input.invitation, now);

  if (!tokenState.ok) {
    return tokenState;
  }

  const googleEmail = normalizeEmail(input.googleEmail);

  if (!googleEmail) {
    return { ok: false, reason: "missing_google_account" };
  }

  return {
    ok: true,
    events: ["Member invitation accepted"],
  };
}

export function fallbackDisplayNameFromEmail(email: string): string {
  return email.split("@")[0]?.trim() || email;
}

export function normalizeEmail(email: string | undefined): string | undefined {
  const normalized = email?.trim().toLowerCase();

  return normalized || undefined;
}
