import { describe, expect, it, vi } from "vitest";
import {
  getCurrentMemberFromHeaders,
  resolveCurrentMemberFromRequest,
} from "./server-current-member";
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

describe("resolveCurrentMemberFromRequest", () => {
  it("reads Better Auth session from request headers", async () => {
    const headers = new Headers({ cookie: "better-auth.session=token" });
    const getSession = vi.fn(async () => null);

    await resolveCurrentMemberFromRequest({
      headers,
      auth: {
        api: { getSession },
      },
      dataSource: {
        listAccountsForUser: vi.fn(),
        listHouseholdMembers: vi.fn(),
      },
    });

    expect(getSession).toHaveBeenCalledWith({ headers });
  });

  it("returns unauthenticated when Better Auth has no session", async () => {
    await expect(resolveCurrentMemberFromRequest({
      headers: new Headers(),
      auth: {
        api: {
          getSession: async () => null,
        },
      },
      dataSource: {
        listAccountsForUser: vi.fn(),
        listHouseholdMembers: vi.fn(),
      },
    })).resolves.toEqual({
      ok: false,
      reason: "unauthenticated",
    });
  });

  it("resolves the session user through the current-member data source", async () => {
    await expect(resolveCurrentMemberFromRequest({
      headers: new Headers(),
      auth: {
        api: {
          getSession: async () => ({
            user: {
              id: "user-mei",
              email: "MEI@EXAMPLE.COM",
            },
          }),
        },
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
      },
    });
  });
});

describe("getCurrentMemberFromHeaders", () => {
  it("uses the default auth and Prisma factories with server headers", async () => {
    const headers = new Headers();
    const auth = {
      api: {
        getSession: async () => null,
      },
    };
    const createAuth = vi.fn(async () => auth);
    const getPrismaClient = vi.fn(() => ({
      account: { findMany: vi.fn() },
      member: { findMany: vi.fn() },
    }));

    await expect(getCurrentMemberFromHeaders(headers, {
      createAuth,
      getPrismaClient,
    })).resolves.toEqual({
      ok: false,
      reason: "unauthenticated",
    });
    expect(createAuth).toHaveBeenCalledOnce();
    expect(getPrismaClient).toHaveBeenCalledOnce();
  });
});
