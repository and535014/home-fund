import { describe, expect, it, vi } from "vitest";
import { resolveCurrentMember } from "./current-member";
import type { HouseholdMemberAccount } from "../modules/identity-access/member-management";

const members: HouseholdMemberAccount[] = [
  {
    id: "member-mei",
    displayName: "Mei",
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
      },
    });
  });
});
