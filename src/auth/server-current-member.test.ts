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

  it("returns unauthenticated when Better Auth cannot read the session", async () => {
    await expect(resolveCurrentMemberFromRequest({
      headers: new Headers(),
      auth: {
        api: {
          getSession: async () => {
            throw new Error("Failed to get session");
          },
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
  it("resolves a controlled E2E auth user through the current-member data source", async () => {
    const createAuth = vi.fn();
    const accountFindMany = vi.fn(async () => [
      {
        providerId: "google",
        accountId: "google-mei",
        userId: "user-mei",
      },
    ]);
    const memberFindMany = vi.fn(async () => members.map((member) => ({
      id: member.id,
      displayName: member.displayName,
      googleAccountEmail: member.googleAccountEmail ?? null,
      googleSubject: member.googleSubject ?? null,
      status: member.status,
      roles: member.roles.map((role) => ({ role })),
      capabilities: member.capabilities.map((capability) => ({ capability })),
    })));
    const getPrismaClient = vi.fn(() => ({
      account: { findMany: accountFindMany },
      member: { findMany: memberFindMany },
    }));

    await expect(getCurrentMemberFromHeaders(new Headers({
      "x-e2e-auth-user-id": "user-mei",
    }), {
      createAuth,
      getPrismaClient,
    })).resolves.toMatchObject({
      ok: true,
      member: {
        id: "member-mei",
        googleAccountLinked: true,
      },
    });
    expect(createAuth).not.toHaveBeenCalled();
    expect(getPrismaClient).toHaveBeenCalledOnce();
    expect(accountFindMany).toHaveBeenCalledWith({
      where: { userId: "user-mei" },
      select: {
        providerId: true,
        accountId: true,
        userId: true,
      },
    });
  });

  it("does not use the controlled E2E auth override in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

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

    await expect(getCurrentMemberFromHeaders(new Headers({
      "x-e2e-auth-user-id": "user-mei",
    }), {
      createAuth,
      getPrismaClient,
    })).resolves.toEqual({
      ok: false,
      reason: "unauthenticated",
    });
    expect(createAuth).toHaveBeenCalledOnce();
    expect(getPrismaClient).toHaveBeenCalledOnce();

    vi.unstubAllEnvs();
  });

  it("resolves a guarded E2E current member without auth or Prisma", async () => {
    const createAuth = vi.fn();
    const getPrismaClient = vi.fn();
    const headers = new Headers({
      "x-e2e-current-member-email": "e2e-finance@example.com",
    });

    await expect(getCurrentMemberFromHeaders(headers, {
      createAuth,
      getPrismaClient,
    })).resolves.toMatchObject({
      ok: true,
      profile: {
        id: "member-e2e-fin",
        displayName: "Lin",
      },
    });
    expect(createAuth).not.toHaveBeenCalled();
    expect(getPrismaClient).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
  });

  it("does not use the E2E current member override in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

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

    await expect(getCurrentMemberFromHeaders(new Headers({
      "x-e2e-current-member-email": "e2e-finance@example.com",
    }), {
      createAuth,
      getPrismaClient,
    })).resolves.toEqual({
      ok: false,
      reason: "unauthenticated",
    });
    expect(createAuth).toHaveBeenCalledOnce();
    expect(getPrismaClient).toHaveBeenCalledOnce();

    vi.unstubAllEnvs();
  });

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
