import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedMember } from "./authorization";
import {
  acceptMemberInvitationInDatabase,
  buildInvitationLink,
  createMemberInvitationInDatabase,
  hashInvitationToken,
} from "./member-invitation-command";

const now = new Date("2026-06-19T10:00:00.000Z");

const admin: AuthenticatedMember = {
  id: "member-admin",
  googleAccountLinked: true,
  roles: ["admin"],
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
];

describe("createMemberInvitationInDatabase", () => {
  it("creates an account-agnostic pending invitation without creating a member", async () => {
    const memberCreate = vi.fn(async () => ({ id: "member-kai" }));
    const invitationCreate = vi.fn(async (args) => ({
      id: "invite-kai",
      householdId: args.data.householdId,
      memberId: args.data.memberId ?? null,
      googleAccountEmail: args.data.googleAccountEmail ?? null,
      tokenHash: args.data.tokenHash,
      previewToken: args.data.previewToken,
      status: "pending" as const,
      expiresAt: args.data.expiresAt,
    }));

    await expect(createMemberInvitationInDatabase(admin, {
      baseUrl: "http://localhost:3000",
      generateToken: () => "raw-token",
      now: () => now,
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows),
          create: memberCreate,
        },
        memberInvitation: {
          findMany: vi.fn(async () => []),
          findFirst: vi.fn(),
          create: invitationCreate,
          update: vi.fn(),
        },
      },
    })).resolves.toEqual({
      ok: true,
      invitationLink: "http://localhost:3000/invite/accept?token=raw-token",
    });
    expect(memberCreate).not.toHaveBeenCalled();
    expect(invitationCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        householdId: "household-demo",
        tokenHash: hashInvitationToken("raw-token"),
        previewToken: "raw-token",
      }),
    }));
  });
});

describe("acceptMemberInvitationInDatabase", () => {
  it("creates the member and marks the invitation accepted", async () => {
    const memberCreate = vi.fn(async () => ({ id: "member-kai" }));
    const invitationUpdate = vi.fn(async () => ({}));

    await expect(acceptMemberInvitationInDatabase({
      token: "raw-token",
      googleEmail: "kai@example.com",
      googleSubject: "google-kai",
      googleDisplayName: "Kai Google",
      googleAvatarUrl: "https://example.com/kai.png",
    }, {
      now: () => now,
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows),
          create: memberCreate,
        },
        memberInvitation: {
          findMany: vi.fn(),
          findFirst: vi.fn(async () => ({
            id: "invite-kai",
            householdId: "household-demo",
            memberId: null,
            googleAccountEmail: null,
            tokenHash: hashInvitationToken("raw-token"),
            previewToken: "raw-token",
            status: "pending" as const,
            expiresAt: new Date("2026-06-26T10:00:00.000Z"),
          })),
          create: vi.fn(),
          update: invitationUpdate,
        },
      },
    })).resolves.toEqual({
      ok: true,
      events: ["Member invitation accepted"],
    });
    expect(memberCreate).toHaveBeenCalledWith({
      data: {
        householdId: "household-demo",
        displayName: "Kai Google",
        avatarUrl: "https://example.com/kai.png",
        googleAccountEmail: "kai@example.com",
        googleSubject: "google-kai",
        status: "active",
        roles: {
          create: [
            {
              role: "general_member",
            },
          ],
        },
      },
      select: {
        id: true,
      },
    });
    expect(invitationUpdate).toHaveBeenCalledWith({
      where: {
        id: "invite-kai",
      },
      data: {
        status: "accepted",
        acceptedAt: now,
        memberId: "member-kai",
      },
    });
  });

  it("rejects accepting with a Google account that is already an active member", async () => {
    await expect(acceptMemberInvitationInDatabase({
      token: "raw-token",
      googleEmail: "admin@example.com",
      googleSubject: "google-admin",
    }, {
      now: () => now,
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows),
          create: vi.fn(),
        },
        memberInvitation: {
          findMany: vi.fn(),
          findFirst: vi.fn(async () => ({
            id: "invite-kai",
            householdId: "household-demo",
            memberId: null,
            googleAccountEmail: null,
            tokenHash: hashInvitationToken("raw-token"),
            previewToken: "raw-token",
            status: "pending" as const,
            expiresAt: new Date("2026-06-26T10:00:00.000Z"),
          })),
          create: vi.fn(),
          update: vi.fn(),
        },
      },
    })).resolves.toEqual({
      ok: false,
      reason: "google_account_already_member",
    });
  });
});

describe("buildInvitationLink", () => {
  it("returns relative or absolute invitation links", () => {
    expect(buildInvitationLink("raw token")).toBe("/invite/accept?token=raw%20token");
    expect(buildInvitationLink("raw", "http://localhost:3000")).toBe(
      "http://localhost:3000/invite/accept?token=raw",
    );
  });
});
