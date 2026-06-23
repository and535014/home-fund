import { describe, expect, it } from "vitest";
import type { AuthenticatedMember } from "./authorization";
import {
  acceptInvitation,
  createMemberInvitation,
  validateInvitationToken,
  type MemberInvitationRecord,
} from "./member-invitations";

const now = new Date("2026-06-19T10:00:00.000Z");

const admin: AuthenticatedMember = {
  id: "member-admin",
  googleAccountLinked: true,
  roles: ["admin"],
};

const generalMember: AuthenticatedMember = {
  id: "member-mei",
  googleAccountLinked: true,
  roles: ["general_member"],
};

const pendingInvitation: MemberInvitationRecord = {
  id: "invite-kai",
  householdId: "household-demo",
  tokenHash: "hash-kai",
  status: "pending",
  expiresAt: new Date("2026-06-26T10:00:00.000Z"),
};

describe("createMemberInvitation", () => {
  it("allows admins to create an account-agnostic pending invitation", () => {
    expect(createMemberInvitation(admin)).toEqual({
      ok: true,
      events: ["Member invitation created"],
    });
  });

  it("rejects non-admin actors", () => {
    expect(createMemberInvitation(generalMember)).toEqual({
      ok: false,
      reason: "permission_denied",
    });
  });
});

describe("validateInvitationToken", () => {
  it("accepts pending, unexpired invitations", () => {
    expect(validateInvitationToken("raw-kai", pendingInvitation, now)).toEqual({
      ok: true,
      invitation: pendingInvitation,
    });
  });

  it("rejects missing, unknown, expired, accepted, and revoked invitations", () => {
    expect(validateInvitationToken(undefined, undefined, now)).toEqual({
      ok: false,
      reason: "missing_token",
    });
    expect(validateInvitationToken("missing", undefined, now)).toEqual({
      ok: false,
      reason: "invalid_invite",
    });
    expect(validateInvitationToken("raw", {
      ...pendingInvitation,
      expiresAt: now,
    }, now)).toEqual({
      ok: false,
      reason: "expired_invite",
    });
    expect(validateInvitationToken("raw", {
      ...pendingInvitation,
      status: "accepted",
    }, now)).toEqual({
      ok: false,
      reason: "accepted_invite",
    });
    expect(validateInvitationToken("raw", {
      ...pendingInvitation,
      status: "revoked",
    }, now)).toEqual({
      ok: false,
      reason: "revoked_invite",
    });
  });
});

describe("acceptInvitation", () => {
  it("accepts the invitation for the Google email used during sign-in", () => {
    expect(acceptInvitation({
      invitation: pendingInvitation,
      googleEmail: " any-account@example.com ",
    }, now)).toEqual({
      ok: true,
      events: ["Member invitation accepted"],
    });
  });

  it("rejects Google sign-in without an email", () => {
    expect(acceptInvitation({
      invitation: pendingInvitation,
    }, now)).toEqual({
      ok: false,
      reason: "missing_google_account",
    });
  });
});
