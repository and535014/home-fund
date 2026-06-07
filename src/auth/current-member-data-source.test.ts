import { describe, expect, it, vi } from "vitest";
import {
  createCurrentMemberDataSource,
  mapPrismaMemberToHouseholdMember,
} from "./current-member-data-source";

describe("createCurrentMemberDataSource", () => {
  it("loads Better Auth accounts for the authenticated user", async () => {
    const findMany = vi.fn(async () => [
      {
        providerId: "google",
        accountId: "google-mei",
        userId: "user-mei",
      },
    ]);
    const dataSource = createCurrentMemberDataSource({
      account: { findMany },
      member: { findMany: vi.fn() },
    });

    await expect(dataSource.listAccountsForUser("user-mei")).resolves.toEqual([
      {
        providerId: "google",
        accountId: "google-mei",
        userId: "user-mei",
      },
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: { userId: "user-mei" },
      select: {
        providerId: true,
        accountId: true,
        userId: true,
      },
    });
  });

  it("loads household members with roles and capabilities", async () => {
    const findMany = vi.fn(async () => [
      {
        id: "member-mei",
        displayName: "Mei",
        googleAccountEmail: "mei@example.com",
        googleSubject: "google-mei",
        status: "active" as const,
        roles: [
          {
            role: "general_member" as const,
          },
        ],
        capabilities: [
          {
            capability: "manage_categories" as const,
          },
          {
            capability: "manage_recurring" as const,
          },
        ],
      },
    ]);
    const dataSource = createCurrentMemberDataSource({
      account: { findMany: vi.fn() },
      member: { findMany },
    });

    await expect(dataSource.listHouseholdMembers()).resolves.toEqual([
      {
        id: "member-mei",
        displayName: "Mei",
        googleAccountEmail: "mei@example.com",
        googleSubject: "google-mei",
        status: "active",
        roles: ["general_member"],
        capabilities: ["manage_categories", "manage_recurring"],
      },
    ]);
    expect(findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        displayName: true,
        googleAccountEmail: true,
        googleSubject: true,
        status: true,
        roles: {
          select: {
            role: true,
          },
        },
        capabilities: {
          select: {
            capability: true,
          },
        },
      },
      orderBy: {
        displayName: "asc",
      },
    });
  });
});

describe("mapPrismaMemberToHouseholdMember", () => {
  it("omits nullable Google account fields when the member is not linked yet", () => {
    expect(mapPrismaMemberToHouseholdMember({
      id: "member-invited",
      displayName: "Invited",
      googleAccountEmail: null,
      googleSubject: null,
      status: "invited",
      roles: [
        {
          role: "general_member",
        },
      ],
      capabilities: [],
    })).toEqual({
      id: "member-invited",
      displayName: "Invited",
      status: "invited",
      roles: ["general_member"],
      capabilities: [],
    });
  });
});
