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
    householdId: "household-demo",
    displayName: "Ana",
    googleAccountEmail: "ana@example.com",
    roles: ["admin"],
    capabilities: [],
    status: "active",
  },
  {
    id: "member-bo",
    householdId: "household-demo",
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
      role: "finance_manager",
    }, {
      householdId: "household-demo",
      members,
      generateId: () => "member-kai",
    })).toEqual({
      ok: true,
      member: {
        id: "member-kai",
        householdId: "household-demo",
        displayName: "Kai",
        roles: ["finance_manager"],
        capabilities: [],
        status: "invited",
      },
      events: ["Member invited"],
    });
  });

  it("rejects non-admin member management", () => {
    expect(createMember(generalActor, {
      displayName: "Kai",
    }, { householdId: "household-demo", members })).toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "admin_required",
    });
  });

  it("updates a member display name", () => {
    expect(updateMemberDisplayName(admin, {
      memberId: "member-bo",
      displayName: "柏",
    }, { householdId: "household-demo", members })).toEqual({
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
      capabilities: ["manage_categories"],
    }, { householdId: "household-demo", members })).toEqual({
      ok: true,
      member: {
        ...members[1],
        roles: ["general_member", "finance_manager"],
        capabilities: ["manage_categories"],
      },
      events: ["Member permissions changed"],
    });
  });

  it("rejects blank display names, duplicate emails, and unknown members", () => {
    expect(createMember(admin, {
      displayName: " ",
    }, { householdId: "household-demo", members })).toEqual({
      ok: false,
      reason: "invalid_display_name",
    });

    expect(createMember(admin, {
      displayName: "Kai",
      googleAccountEmail: "BO@example.com",
    }, { householdId: "household-demo", members })).toEqual({
      ok: false,
      reason: "duplicate_google_account_email",
    });

    expect(updateMemberDisplayName(admin, {
      memberId: "member-missing",
      displayName: "Missing",
    }, { householdId: "household-demo", members })).toEqual({
      ok: false,
      reason: "member_not_found",
    });
  });

  it("prevents removing the last admin", () => {
    expect(updateMemberPermissions(admin, {
      memberId: "member-admin",
      roles: ["general_member"],
      capabilities: [],
    }, { householdId: "household-demo", members })).toEqual({
      ok: false,
      reason: "cannot_remove_last_admin",
    });
  });
});
