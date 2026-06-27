import { describe, expect, it, vi } from "vitest";
import {
  loadHouseholdMemberOptions,
  loadHouseholdMembers,
} from "./household-member-query";

describe("household member query", () => {
  it("loads full household members with stable mapping", async () => {
    const prisma = {
      member: {
        findMany: vi.fn(async () => [
          {
            id: "member-lin",
            householdId: "household-demo",
            displayName: "Lin",
            avatarUrl: null,
            googleAccountEmail: "lin@example.com",
            googleSubject: "google-lin",
            status: "active" as const,
            roles: [{ role: "finance_manager" }],
            capabilities: [{ capability: "manage_categories" }],
          },
        ]),
      },
    };

    await expect(loadHouseholdMembers({
      householdId: "household-demo",
      prisma,
    })).resolves.toEqual([
      {
        id: "member-lin",
        householdId: "household-demo",
        displayName: "Lin",
        googleAccountEmail: "lin@example.com",
        googleSubject: "google-lin",
        status: "active",
        roles: ["finance_manager"],
        capabilities: ["manage_categories"],
      },
    ]);
    expect(prisma.member.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { householdId: "household-demo" },
      orderBy: { displayName: "asc" },
    }));
  });

  it("loads lightweight member options without status filtering", async () => {
    const prisma = {
      member: {
        findMany: vi.fn(async () => [
          { id: "member-lin", displayName: "Lin" },
        ]),
      },
    };

    await expect(loadHouseholdMemberOptions({
      householdId: "household-demo",
      prisma,
    })).resolves.toEqual([
      { id: "member-lin", displayName: "Lin" },
    ]);
    expect(prisma.member.findMany).toHaveBeenCalledWith({
      where: { householdId: "household-demo" },
      select: {
        id: true,
        displayName: true,
      },
      orderBy: { displayName: "asc" },
    });
  });
});
