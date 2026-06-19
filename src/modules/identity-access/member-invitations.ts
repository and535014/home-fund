import { authorize, type AuthenticatedMember } from "./authorization";
import type { HouseholdMemberAccount } from "./member-management";

export type MemberInvitationStatus = "pending" | "accepted" | "revoked";

export type MemberInvitationRecord = {
  id: string;
  memberId: string;
  googleAccountEmail: string;
  tokenHash: string;
  previewToken?: string;
  status: MemberInvitationStatus;
  expiresAt: Date;
};

export type CreateMemberInvitationCommand = {
  googleEmail: string;
};

export type CreateMemberInvitationResult =
  | {
      ok: true;
      kind: "created" | "existing";
      email: string;
      member?: HouseholdMemberAccount;
      invitation?: MemberInvitationRecord;
      events: ["Member invitation created"] | ["Existing invitation returned"];
    }
  | {
      ok: false;
      reason:
        | "permission_denied"
        | "invalid_email"
        | "member_already_active";
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
        | "wrong_google_account"
        | "missing_token"
        | "invalid_invite"
        | "expired_invite"
        | "accepted_invite"
        | "revoked_invite";
    };

export function createMemberInvitation(
  actor: AuthenticatedMember,
  command: CreateMemberInvitationCommand,
  context: {
    members: HouseholdMemberAccount[];
    invitations: MemberInvitationRecord[];
    now: Date;
  },
): CreateMemberInvitationResult {
  const authorization = authorize(actor, { type: "manage_members" });

  if (!authorization.allowed) {
    return { ok: false, reason: "permission_denied" };
  }

  const email = normalizeEmail(command.googleEmail);

  if (!email || !isValidEmail(email)) {
    return { ok: false, reason: "invalid_email" };
  }

  const existingMember = context.members.find(
    (member) => member.googleAccountEmail?.toLowerCase() === email,
  );

  if (existingMember?.status === "active") {
    return { ok: false, reason: "member_already_active" };
  }

  const existingInvitation = context.invitations.find(
    (invitation) =>
      invitation.googleAccountEmail.toLowerCase() === email &&
      invitation.status === "pending" &&
      invitation.expiresAt > context.now,
  );

  if (existingInvitation) {
    return {
      ok: true,
      kind: "existing",
      email,
      invitation: existingInvitation,
      events: ["Existing invitation returned"],
    };
  }

  return {
    ok: true,
    kind: "created",
    email,
    member: existingMember,
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

  if (!googleEmail || googleEmail !== input.invitation.googleAccountEmail.toLowerCase()) {
    return { ok: false, reason: "wrong_google_account" };
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

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email);
}
