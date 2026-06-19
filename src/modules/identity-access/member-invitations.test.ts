import { describe, expect, it } from "vitest";
import type { AuthenticatedMember } from "./authorization";
import {
  acceptInvitation,
  createMemberInvitation,
  validateInvitationToken,
  type MemberInvitationRecord,
} from "./member-invitations";
import type { HouseholdMemberAccount } from "./member-management";

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

const members: HouseholdMemberAccount[] = [
  {
    id: "member-admin",
    displayName: "Admin",
    googleAccountEmail: "admin@example.com",
    roles: ["admin"],
    capabilities: [],
    status: "active",
  },
  {
    id: "member-invited",
    displayName: "kai",
    googleAccountEmail: "kai@example.com",
    roles: ["general_member"],
    capabilities: [],
    status: "invited",
  },
];

const pendingInvitation: MemberInvitationRecord = {
  id: "invite-kai",
  memberId: "member-invited",
  googleAccountEmail: "kai@example.com",
  tokenHash: "hash-kai",
  previewToken: "raw-kai",
  status: "pending",
  expiresAt: new Date("2026-06-26T10:00:00.000Z"),
};

describe("createMemberInvitation", () => {
  it("allows admins to create a pending invitation for a new email", () => {
    expect(createMemberInvitation(admin, {
      googleEmail: " LIN@example.com ",
    }, {
      members,
      invitations: [pendingInvitation],
      now,
    })).toEqual({
      ok: true,
      kind: "created",
      email: "lin@example.com",
      events: ["Member invitation created"],
    });
  });

  it("returns an existing pending invitation instead of creating a duplicate", () => {
    expect(createMemberInvitation(admin, {
      googleEmail: "KAI@example.com",
    }, {
      members,
      invitations: [pendingInvitation],
      now,
    })).toEqual({
      ok: true,
      kind: "existing",
      email: "kai@example.com",
      invitation: pendingInvitation,
      events: ["Existing invitation returned"],
    });
  });

  it("rejects invalid email, active members, and non-admin actors", () => {
    expect(createMemberInvitation(admin, {
      googleEmail: "not-an-email",
    }, {
      members,
      invitations: [],
      now,
    })).toEqual({
      ok: false,
      reason: "invalid_email",
    });

    expect(createMemberInvitation(admin, {
      googleEmail: "admin@example.com",
    }, {
      members,
      invitations: [],
      now,
    })).toEqual({
      ok: false,
      reason: "member_already_active",
    });

    expect(createMemberInvitation(generalMember, {
      googleEmail: "lin@example.com",
    }, {
      members,
      invitations: [],
      now,
    })).toEqual({
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
  it("accepts the invitation for the intended Google email", () => {
    expect(acceptInvitation({
      invitation: pendingInvitation,
      googleEmail: " KAI@example.com ",
    }, now)).toEqual({
      ok: true,
      events: ["Member invitation accepted"],
    });
  });

  it("rejects the wrong Google account", () => {
    expect(acceptInvitation({
      invitation: pendingInvitation,
      googleEmail: "mei@example.com",
    }, now)).toEqual({
      ok: false,
      reason: "wrong_google_account",
    });
  });
});
