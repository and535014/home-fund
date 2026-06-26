import { describe, expect, it } from "vitest";
import { resolveHouseholdAccess } from "./session-access";
import type { HouseholdMemberAccount } from "./member-management";

const members: HouseholdMemberAccount[] = [
  {
    id: "member-admin",
    householdId: "household-demo",
    displayName: "Ana",
    googleAccountEmail: "ana@example.com",
    googleSubject: "google-ana",
    roles: ["admin"],
    capabilities: ["manage_categories"],
    status: "active",
  },
  {
    id: "member-invited",
    householdId: "household-demo",
    displayName: "Invited",
    googleAccountEmail: "invited@example.com",
    roles: ["general_member"],
    capabilities: [],
    status: "invited",
  },
  {
    id: "member-disabled",
    householdId: "household-demo",
    displayName: "Disabled",
    googleAccountEmail: "disabled@example.com",
    roles: ["general_member"],
    capabilities: [],
    status: "disabled",
  },
];

describe("resolveHouseholdAccess", () => {
  it("maps a Google identity to an active app member by Google subject", () => {
    expect(resolveHouseholdAccess({
      googleIdentity: {
        subject: "google-ana",
        email: "wrong@example.com",
      },
      members,
    })).toEqual({
      ok: true,
      member: {
        id: "member-admin",
        householdId: "household-demo",
        googleAccountLinked: true,
        roles: ["admin"],
        capabilities: ["manage_categories"],
      },
      profile: {
        id: "member-admin",
        householdId: "household-demo",
        displayName: "Ana",
        roles: ["admin"],
        capabilities: ["manage_categories"],
      },
      events: ["Household member access resolved"],
    });
  });

  it("falls back to a normalized Google email when subject is not linked yet", () => {
    expect(resolveHouseholdAccess({
      googleIdentity: {
        subject: "google-new",
        email: "ANA@EXAMPLE.COM",
      },
      members,
    })).toMatchObject({
      ok: true,
      member: {
        id: "member-admin",
      },
    });
  });

  it("rejects unauthenticated, unlinked, invited, and disabled accounts", () => {
    expect(resolveHouseholdAccess({
      googleIdentity: null,
      members,
    })).toEqual({
      ok: false,
      reason: "unauthenticated",
    });

    expect(resolveHouseholdAccess({
      googleIdentity: {
        subject: "google-unknown",
        email: "unknown@example.com",
      },
      members,
    })).toEqual({
      ok: false,
      reason: "google_account_not_linked",
    });

    expect(resolveHouseholdAccess({
      googleIdentity: {
        subject: "google-invited",
        email: "invited@example.com",
      },
      members,
    })).toEqual({
      ok: false,
      reason: "member_not_active",
      memberStatus: "invited",
    });

    expect(resolveHouseholdAccess({
      googleIdentity: {
        subject: "google-disabled",
        email: "disabled@example.com",
      },
      members,
    })).toEqual({
      ok: false,
      reason: "member_not_active",
      memberStatus: "disabled",
    });
  });
});
