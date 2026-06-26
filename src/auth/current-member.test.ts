import { describe, expect, it, vi } from "vitest";
import { resolveCurrentMember } from "./current-member";
import type { HouseholdMemberAccount } from "../modules/identity-access/member-management";

const members: HouseholdMemberAccount[] = [
  {
    id: "member-mei",
    householdId: "household-demo",
    displayName: "Mei",
    avatarUrl: "https://example.com/old.png",
    googleAccountEmail: "mei@example.com",
    googleSubject: "google-mei",
    roles: ["general_member"],
    capabilities: [],
    status: "active",
  },
];

describe("resolveCurrentMember", () => {
  it("returns an unauthenticated result without loading household data", async () => {
    const dataSource = {
      listAccountsForUser: vi.fn(),
      listHouseholdMembers: vi.fn(),
    };

    await expect(resolveCurrentMember({
      user: null,
      dataSource,
    })).resolves.toEqual({
      ok: false,
      reason: "unauthenticated",
    });
    expect(dataSource.listAccountsForUser).not.toHaveBeenCalled();
    expect(dataSource.listHouseholdMembers).not.toHaveBeenCalled();
  });

  it("returns account-not-linked when the auth user has no Google account", async () => {
    await expect(resolveCurrentMember({
      user: {
        id: "user-mei",
        email: "mei@example.com",
      },
      dataSource: {
        listAccountsForUser: async () => [
          {
            providerId: "github",
            accountId: "github-mei",
            userId: "user-mei",
          },
        ],
        listHouseholdMembers: async () => members,
      },
    })).resolves.toEqual({
      ok: false,
      reason: "google_account_not_linked",
    });
  });

  it("resolves an authenticated Google user to the active household member", async () => {
    await expect(resolveCurrentMember({
      user: {
        id: "user-mei",
        email: "MEI@EXAMPLE.COM",
        name: "Mei Google",
        image: "https://example.com/mei.png",
      },
      dataSource: {
        listAccountsForUser: async () => [
          {
            providerId: "google",
            accountId: "google-mei",
            userId: "user-mei",
          },
        ],
        listHouseholdMembers: async () => members,
        updateMemberGoogleProfile: vi.fn(),
      },
    })).resolves.toMatchObject({
      ok: true,
      member: {
        id: "member-mei",
        googleAccountLinked: true,
        roles: ["general_member"],
      },
      profile: {
        id: "member-mei",
        displayName: "Mei",
        avatarUrl: "https://example.com/mei.png",
      },
    });
  });

  it("syncs Google profile fields when the linked member still has the seed display name", async () => {
    const updateMemberGoogleProfile = vi.fn();

    await expect(resolveCurrentMember({
      user: {
        id: "user-admin",
        email: "ADMIN@EXAMPLE.COM",
        name: "Google Admin",
        image: "https://example.com/admin.png",
      },
      dataSource: {
        listAccountsForUser: async () => [
          {
            providerId: "google",
            accountId: "google-admin",
            userId: "user-admin",
          },
        ],
        listHouseholdMembers: async () => [
          {
            id: "member-admin",
            householdId: "household-demo",
            displayName: "Admin",
            googleAccountEmail: "admin@example.com",
            roles: ["admin"],
            capabilities: [],
            status: "active",
          },
        ],
        updateMemberGoogleProfile,
      },
    })).resolves.toMatchObject({
      ok: true,
      profile: {
        id: "member-admin",
        displayName: "Google Admin",
        avatarUrl: "https://example.com/admin.png",
      },
    });
    expect(updateMemberGoogleProfile).toHaveBeenCalledWith("member-admin", {
      displayName: "Google Admin",
      avatarUrl: "https://example.com/admin.png",
      googleSubject: "google-admin",
    });
  });
});
