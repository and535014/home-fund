import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedMember } from "./authorization";
import {
  createMemberInDatabase,
  updateMemberDisplayNameInDatabase,
} from "./member-management-command";

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

const memberRows = [
  {
    id: "member-admin",
    householdId: "household-demo",
    displayName: "Admin",
    avatarUrl: null,
    googleAccountEmail: "admin@example.com",
    googleSubject: "google-admin",
    status: "active" as const,
    roles: [{ role: "admin" as const }],
    capabilities: [],
  },
  {
    id: "member-mei",
    householdId: "household-demo",
    displayName: "Mei",
    avatarUrl: "https://example.com/mei.png",
    googleAccountEmail: "mei@example.com",
    googleSubject: "google-mei",
    status: "active" as const,
    roles: [{ role: "general_member" as const }],
    capabilities: [],
  },
];

describe("createMemberInDatabase", () => {
  it("persists an active member with the selected role", async () => {
    const create = vi.fn(async () => ({
      id: "member-kai",
      householdId: "household-demo",
      displayName: "Kai",
      avatarUrl: null,
      googleAccountEmail: null,
      googleSubject: null,
      status: "active" as const,
      roles: [{ role: "finance_manager" as const }],
      capabilities: [],
    }));

    await expect(createMemberInDatabase(admin, {
      displayName: " Kai ",
      role: "finance_manager",
    }, {
      householdId: "household-demo",
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows),
          create,
          update: vi.fn(),
        },
      },
    })).resolves.toMatchObject({
      ok: true,
      member: {
        id: "member-kai",
        displayName: "Kai",
        roles: ["finance_manager"],
        status: "active",
      },
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        displayName: "Kai",
        householdId: "household-demo",
        status: "active",
        roles: {
          create: [
            {
              role: "finance_manager",
            },
          ],
        },
      },
      select: expect.any(Object),
    });
  });

  it("does not write when the display name is invalid", async () => {
    const create = vi.fn();

    await expect(createMemberInDatabase(admin, {
      displayName: " ",
      role: "general_member",
    }, {
      householdId: "household-demo",
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows),
          create,
          update: vi.fn(),
        },
      },
    })).resolves.toEqual({
      ok: false,
      reason: "invalid_display_name",
    });
    expect(create).not.toHaveBeenCalled();
  });
});

describe("updateMemberDisplayNameInDatabase", () => {
  it("persists an admin display-name change", async () => {
    const update = vi.fn(async () => ({}));

    await expect(updateMemberDisplayNameInDatabase(admin, {
      memberId: "member-mei",
      displayName: "Mei Chen",
    }, {
      householdId: "household-demo",
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows),
          create: vi.fn(),
          update,
        },
      },
    })).resolves.toMatchObject({
      ok: true,
      member: {
        id: "member-mei",
        displayName: "Mei Chen",
        avatarUrl: "https://example.com/mei.png",
      },
    });
    expect(update).toHaveBeenCalledWith({
      where: {
        id: "member-mei",
      },
      data: {
        displayName: "Mei Chen",
      },
    });
  });

  it("does not write when the display name is invalid", async () => {
    const update = vi.fn(async () => ({}));

    await expect(updateMemberDisplayNameInDatabase(admin, {
      memberId: "member-mei",
      displayName: " ",
    }, {
      householdId: "household-demo",
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows),
          create: vi.fn(),
          update,
        },
      },
    })).resolves.toEqual({
      ok: false,
      reason: "invalid_display_name",
    });
    expect(update).not.toHaveBeenCalled();
  });

  it("does not write when the actor cannot manage members", async () => {
    const update = vi.fn(async () => ({}));

    await expect(updateMemberDisplayNameInDatabase(generalMember, {
      memberId: "member-mei",
      displayName: "Mei Chen",
    }, {
      householdId: "household-demo",
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows),
          create: vi.fn(),
          update,
        },
      },
    })).resolves.toMatchObject({
      ok: false,
      reason: "permission_denied",
    });
    expect(update).not.toHaveBeenCalled();
  });
});
