import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedMember } from "./authorization";
import { updateMemberDisplayNameInDatabase } from "./member-management-command";

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
    displayName: "Mei",
    avatarUrl: "https://example.com/mei.png",
    googleAccountEmail: "mei@example.com",
    googleSubject: "google-mei",
    status: "active" as const,
    roles: [{ role: "general_member" as const }],
    capabilities: [],
  },
];

describe("updateMemberDisplayNameInDatabase", () => {
  it("persists an admin display-name change", async () => {
    const update = vi.fn(async () => ({}));

    await expect(updateMemberDisplayNameInDatabase(admin, {
      memberId: "member-mei",
      displayName: "Mei Chen",
    }, {
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows),
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
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows),
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
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows),
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
