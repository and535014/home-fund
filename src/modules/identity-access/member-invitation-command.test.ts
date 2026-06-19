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
  it("creates an invited member and pending invitation", async () => {
    const memberCreate = vi.fn(async () => ({ id: "member-kai" }));
    const invitationCreate = vi.fn(async (args) => ({
      id: "invite-kai",
      memberId: args.data.memberId,
      googleAccountEmail: args.data.googleAccountEmail,
      tokenHash: args.data.tokenHash,
      previewToken: args.data.previewToken,
      status: "pending" as const,
      expiresAt: args.data.expiresAt,
    }));

    await expect(createMemberInvitationInDatabase(admin, {
      googleEmail: "KAI@example.com",
    }, {
      baseUrl: "http://localhost:3000",
      generateToken: () => "raw-token",
      now: () => now,
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows),
          create: memberCreate,
          update: vi.fn(),
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
      email: "kai@example.com",
      invitationLink: "http://localhost:3000/invite/accept?token=raw-token",
      memberId: "member-kai",
    });
    expect(memberCreate).toHaveBeenCalledWith({
      data: {
        householdId: "household-demo",
        displayName: "kai",
        googleAccountEmail: "kai@example.com",
        status: "invited",
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
    expect(invitationCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        memberId: "member-kai",
        tokenHash: hashInvitationToken("raw-token"),
        previewToken: "raw-token",
      }),
    }));
  });

  it("returns an existing pending invitation link", async () => {
    await expect(createMemberInvitationInDatabase(admin, {
      googleEmail: "kai@example.com",
    }, {
      now: () => now,
      prisma: {
        member: {
          findMany: vi.fn(async () => [
            ...memberRows,
            {
              id: "member-kai",
              householdId: "household-demo",
              displayName: "kai",
              avatarUrl: null,
              googleAccountEmail: "kai@example.com",
              googleSubject: null,
              status: "invited" as const,
              roles: [{ role: "general_member" as const }],
              capabilities: [],
            },
          ]),
          create: vi.fn(),
          update: vi.fn(),
        },
        memberInvitation: {
          findMany: vi.fn(async () => [
            {
              id: "invite-kai",
              memberId: "member-kai",
              googleAccountEmail: "kai@example.com",
              tokenHash: "hash",
              previewToken: "raw-existing",
              status: "pending" as const,
              expiresAt: new Date("2026-06-26T10:00:00.000Z"),
            },
          ]),
          findFirst: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
        },
      },
    })).resolves.toEqual({
      ok: true,
      email: "kai@example.com",
      invitationLink: "/invite/accept?token=raw-existing",
      memberId: "member-kai",
    });
  });
});

describe("acceptMemberInvitationInDatabase", () => {
  it("activates the invited member and marks the invitation accepted", async () => {
    const memberUpdate = vi.fn(async () => ({}));
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
          findMany: vi.fn(),
          create: vi.fn(),
          update: memberUpdate,
        },
        memberInvitation: {
          findMany: vi.fn(),
          findFirst: vi.fn(async () => ({
            id: "invite-kai",
            memberId: "member-kai",
            googleAccountEmail: "kai@example.com",
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
    expect(memberUpdate).toHaveBeenCalledWith({
      where: {
        id: "member-kai",
      },
      data: {
        displayName: "Kai Google",
        avatarUrl: "https://example.com/kai.png",
        googleAccountEmail: "kai@example.com",
        googleSubject: "google-kai",
        status: "active",
      },
    });
    expect(invitationUpdate).toHaveBeenCalledWith({
      where: {
        id: "invite-kai",
      },
      data: {
        status: "accepted",
        acceptedAt: now,
      },
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
