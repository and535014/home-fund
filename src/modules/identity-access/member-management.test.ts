import { describe, expect, it } from "vitest";
import type { AuthenticatedMember } from "./authorization";
import {
  createMember,
  updateMemberDisplayName,
  updateMemberPermissions,
  type HouseholdMemberAccount,
} from "./member-management";

const admin: AuthenticatedMember = {
  id: "member-admin",
  googleAccountLinked: true,
  roles: ["admin"],
};

const generalActor: AuthenticatedMember = {
  id: "member-mei",
  googleAccountLinked: true,
  roles: ["general_member"],
};

const members: HouseholdMemberAccount[] = [
  {
    id: "member-admin",
    displayName: "Ana",
    googleAccountEmail: "ana@example.com",
    roles: ["admin"],
    capabilities: [],
    status: "active",
  },
  {
    id: "member-bo",
    displayName: "Bo",
    googleAccountEmail: "bo@example.com",
    roles: ["general_member"],
    capabilities: [],
    status: "active",
  },
];

describe("member management", () => {
  it("allows admins to create invited household members", () => {
    expect(createMember(admin, {
      displayName: "Kai",
      googleAccountEmail: "kai@example.com",
    }, {
      members,
      generateId: () => "member-kai",
    })).toEqual({
      ok: true,
      member: {
        id: "member-kai",
        displayName: "Kai",
        googleAccountEmail: "kai@example.com",
        roles: ["general_member"],
        capabilities: [],
        status: "invited",
      },
      events: ["Member invited"],
    });
  });

  it("rejects non-admin member management", () => {
    expect(createMember(generalActor, {
      displayName: "Kai",
    }, { members })).toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "admin_required",
    });
  });

  it("updates a member display name", () => {
    expect(updateMemberDisplayName(admin, {
      memberId: "member-bo",
      displayName: "柏",
    }, { members })).toEqual({
      ok: true,
      member: {
        ...members[1],
        displayName: "柏",
      },
      events: ["Member account updated"],
    });
  });

  it("updates roles and capabilities for future authorization checks", () => {
    expect(updateMemberPermissions(admin, {
      memberId: "member-bo",
      roles: ["general_member", "finance_manager"],
      capabilities: ["manage_categories", "manage_recurring"],
    }, { members })).toEqual({
      ok: true,
      member: {
        ...members[1],
        roles: ["general_member", "finance_manager"],
        capabilities: ["manage_categories", "manage_recurring"],
      },
      events: ["Member permissions changed"],
    });
  });

  it("rejects blank display names, duplicate emails, and unknown members", () => {
    expect(createMember(admin, {
      displayName: " ",
    }, { members })).toEqual({
      ok: false,
      reason: "invalid_display_name",
    });

    expect(createMember(admin, {
      displayName: "Kai",
      googleAccountEmail: "BO@example.com",
    }, { members })).toEqual({
      ok: false,
      reason: "duplicate_google_account_email",
    });

    expect(updateMemberDisplayName(admin, {
      memberId: "member-missing",
      displayName: "Missing",
    }, { members })).toEqual({
      ok: false,
      reason: "member_not_found",
    });
  });

  it("prevents removing the last admin", () => {
    expect(updateMemberPermissions(admin, {
      memberId: "member-admin",
      roles: ["general_member"],
      capabilities: [],
    }, { members })).toEqual({
      ok: false,
      reason: "cannot_remove_last_admin",
    });
  });
});
