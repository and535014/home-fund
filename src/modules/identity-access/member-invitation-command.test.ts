import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedMember } from "./authorization";
import {
  acceptMemberInvitationInDatabase,
  buildMemberBindingLink,
  generateMemberBindingLinkInDatabase,
  hashInvitationToken,
  validateMemberBindingTokenInDatabase,
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
  {
    id: "member-kai",
    householdId: "household-demo",
    displayName: "Kai",
    avatarUrl: null,
    googleAccountEmail: null,
    googleSubject: null,
    status: "invited" as const,
    roles: [{ role: "general_member" as const }],
    capabilities: [],
  },
];

const tokenCrypto = {
  encrypt: vi.fn((token: string) => ({
    tokenCiphertext: `cipher:${token}`,
    tokenIv: "iv",
    tokenAuthTag: "tag",
  })),
  decrypt: vi.fn((encrypted: {
    tokenCiphertext: string;
    tokenIv: string;
    tokenAuthTag: string;
  }) => encrypted.tokenCiphertext.replace("cipher:", "")),
};

describe("generateMemberBindingLinkInDatabase", () => {
  it("creates an encrypted member-specific pending binding link without creating a member", async () => {
    const memberCreate = vi.fn(async () => ({ id: "member-kai" }));
    const invitationCreate = vi.fn(async (args) => ({
      id: "invite-kai",
      householdId: args.data.householdId,
      memberId: args.data.memberId ?? null,
      googleAccountEmail: args.data.googleAccountEmail ?? null,
      tokenHash: args.data.tokenHash,
      tokenCiphertext: args.data.tokenCiphertext,
      tokenIv: args.data.tokenIv,
      tokenAuthTag: args.data.tokenAuthTag,
      status: "pending" as const,
      expiresAt: args.data.expiresAt,
    }));

    await expect(generateMemberBindingLinkInDatabase(admin, {
      memberId: "member-kai",
      baseUrl: "http://localhost:3000",
      generateToken: () => "raw-token",
      now: () => now,
      tokenCrypto,
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows),
          create: memberCreate,
          update: vi.fn(),
        },
        memberInvitation: {
          findMany: vi.fn(async () => []),
          findFirst: vi.fn(async () => null),
          create: invitationCreate,
          update: vi.fn(),
          updateMany: vi.fn(),
        },
      },
    })).resolves.toEqual({
      ok: true,
      bindingLink: "http://localhost:3000/members/bind?token=raw-token",
      expiresAt: new Date("2026-06-26T10:00:00.000Z"),
    });
    expect(memberCreate).not.toHaveBeenCalled();
    expect(invitationCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        householdId: "household-demo",
        memberId: "member-kai",
        tokenHash: hashInvitationToken("raw-token"),
        tokenCiphertext: "cipher:raw-token",
        tokenIv: "iv",
        tokenAuthTag: "tag",
      }),
    }));
  });

  it("reuses an unexpired pending link instead of creating a new invitation", async () => {
    const create = vi.fn();
    const updateMany = vi.fn();

    await expect(generateMemberBindingLinkInDatabase(admin, {
      memberId: "member-kai",
      baseUrl: "http://localhost:3000",
      generateToken: () => "new-token",
      now: () => now,
      tokenCrypto,
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows),
          create: vi.fn(),
          update: vi.fn(),
        },
        memberInvitation: {
          findMany: vi.fn(async () => []),
          findFirst: vi.fn(async () => ({
            id: "invite-kai",
            householdId: "household-demo",
            memberId: "member-kai",
            googleAccountEmail: null,
            tokenHash: hashInvitationToken("old-token"),
            tokenCiphertext: "cipher:old-token",
            tokenIv: "iv",
            tokenAuthTag: "tag",
            status: "pending" as const,
            expiresAt: new Date("2026-06-26T10:00:00.000Z"),
          })),
          create,
          update: vi.fn(),
          updateMany,
        },
      },
    })).resolves.toEqual({
      ok: true,
      bindingLink: "http://localhost:3000/members/bind?token=old-token",
      expiresAt: new Date("2026-06-26T10:00:00.000Z"),
    });
    expect(create).not.toHaveBeenCalled();
    expect(updateMany).not.toHaveBeenCalled();
  });

  it("revokes expired pending links before creating a replacement", async () => {
    const updateMany = vi.fn(async () => ({ count: 1 }));
    const invitationCreate = vi.fn(async (args) => ({
      id: "invite-kai-new",
      householdId: args.data.householdId,
      memberId: args.data.memberId,
      googleAccountEmail: null,
      tokenHash: args.data.tokenHash,
      tokenCiphertext: args.data.tokenCiphertext,
      tokenIv: args.data.tokenIv,
      tokenAuthTag: args.data.tokenAuthTag,
      status: "pending" as const,
      expiresAt: args.data.expiresAt,
    }));

    await expect(generateMemberBindingLinkInDatabase(admin, {
      memberId: "member-kai",
      baseUrl: "http://localhost:3000",
      generateToken: () => "replacement-token",
      now: () => now,
      tokenCrypto,
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows),
          create: vi.fn(),
          update: vi.fn(),
        },
        memberInvitation: {
          findMany: vi.fn(async () => []),
          findFirst: vi.fn(async () => ({
            id: "invite-kai-old",
            householdId: "household-demo",
            memberId: "member-kai",
            googleAccountEmail: null,
            tokenHash: hashInvitationToken("old-token"),
            tokenCiphertext: "cipher:old-token",
            tokenIv: "iv",
            tokenAuthTag: "tag",
            status: "pending" as const,
            expiresAt: new Date("2026-06-18T10:00:00.000Z"),
          })),
          create: invitationCreate,
          update: vi.fn(),
          updateMany,
        },
      },
    })).resolves.toEqual({
      ok: true,
      bindingLink: "http://localhost:3000/members/bind?token=replacement-token",
      expiresAt: new Date("2026-06-26T10:00:00.000Z"),
    });
    expect(updateMany).toHaveBeenCalledWith({
      where: {
        memberId: "member-kai",
        status: "pending",
      },
      data: {
        status: "revoked",
      },
    });
  });

  it("returns a concurrently-created pending link when the database rejects a duplicate pending link", async () => {
    const findFirst = vi.fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: "invite-kai-concurrent",
        householdId: "household-demo",
        memberId: "member-kai",
        googleAccountEmail: null,
        tokenHash: hashInvitationToken("concurrent-token"),
        tokenCiphertext: "cipher:concurrent-token",
        tokenIv: "iv",
        tokenAuthTag: "tag",
        status: "pending" as const,
        expiresAt: new Date("2026-06-26T10:00:00.000Z"),
      });
    const duplicatePendingError = Object.assign(new Error("unique"), {
      code: "P2002",
    });

    await expect(generateMemberBindingLinkInDatabase(admin, {
      memberId: "member-kai",
      baseUrl: "http://localhost:3000",
      generateToken: () => "new-token",
      now: () => now,
      tokenCrypto,
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows),
          create: vi.fn(),
          update: vi.fn(),
        },
        memberInvitation: {
          findMany: vi.fn(async () => []),
          findFirst,
          create: vi.fn(async () => {
            throw duplicatePendingError;
          }),
          update: vi.fn(),
          updateMany: vi.fn(),
        },
      },
    })).resolves.toEqual({
      ok: true,
      bindingLink: "http://localhost:3000/members/bind?token=concurrent-token",
      expiresAt: new Date("2026-06-26T10:00:00.000Z"),
    });
  });
});

describe("acceptMemberInvitationInDatabase", () => {
  it("binds the existing invited member and marks the invitation accepted", async () => {
    const memberCreate = vi.fn(async () => ({ id: "member-new" }));
    const memberUpdate = vi.fn(async () => ({}));
    const invitationUpdate = vi.fn(async () => ({}));
    const tx = {
      member: {
        findMany: vi.fn(async () => memberRows),
        create: memberCreate,
        update: memberUpdate,
      },
      memberInvitation: {
        findMany: vi.fn(),
        findFirst: vi.fn(async () => ({
          id: "invite-kai",
          householdId: "household-demo",
          memberId: "member-kai",
          googleAccountEmail: null,
          tokenHash: hashInvitationToken("raw-token"),
          tokenCiphertext: "cipher:raw-token",
          tokenIv: "iv",
          tokenAuthTag: "tag",
          status: "pending" as const,
          expiresAt: new Date("2026-06-26T10:00:00.000Z"),
        })),
        create: vi.fn(),
        update: invitationUpdate,
        updateMany: vi.fn(),
      },
    };
    const transaction = vi.fn(async (callback) => callback(tx));

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
          create: memberCreate,
          update: vi.fn(),
        },
        memberInvitation: {
          findMany: vi.fn(),
          findFirst: vi.fn(),
          create: vi.fn(),
          update: vi.fn(),
          updateMany: vi.fn(),
        },
        $transaction: transaction,
      },
    })).resolves.toEqual({
      ok: true,
      events: ["Member invitation accepted"],
    });
    expect(transaction).toHaveBeenCalledTimes(1);
    expect(memberCreate).not.toHaveBeenCalled();
    expect(memberUpdate).toHaveBeenCalledWith({
      where: {
        id: "member-kai",
      },
      data: {
        status: "active",
        avatarUrl: "https://example.com/kai.png",
        googleAccountEmail: "kai@example.com",
        googleSubject: "google-kai",
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
          update: vi.fn(),
        },
        memberInvitation: {
          findMany: vi.fn(),
          findFirst: vi.fn(async () => ({
            id: "invite-kai",
            householdId: "household-demo",
            memberId: "member-kai",
            googleAccountEmail: null,
            tokenHash: hashInvitationToken("raw-token"),
            tokenCiphertext: "cipher:raw-token",
            tokenIv: "iv",
            tokenAuthTag: "tag",
            status: "pending" as const,
            expiresAt: new Date("2026-06-26T10:00:00.000Z"),
          })),
          create: vi.fn(),
          update: vi.fn(),
          updateMany: vi.fn(),
        },
      },
    })).resolves.toEqual({
      ok: false,
      reason: "google_account_already_member",
    });
  });
});

describe("validateMemberBindingTokenInDatabase", () => {
  it("rejects a stale pending token when the target member is already active", async () => {
    await expect(validateMemberBindingTokenInDatabase("raw-token", {
      now: () => now,
      prisma: {
        member: {
          findMany: vi.fn(async () => memberRows.map((member) =>
            member.id === "member-kai"
              ? {
                  ...member,
                  googleAccountEmail: "kai@example.com",
                  googleSubject: "google-kai",
                  status: "active" as const,
                }
              : member
          )),
          create: vi.fn(),
          update: vi.fn(),
        },
        memberInvitation: {
          findMany: vi.fn(),
          findFirst: vi.fn(async () => ({
            id: "invite-kai",
            householdId: "household-demo",
            memberId: "member-kai",
            googleAccountEmail: null,
            tokenHash: hashInvitationToken("raw-token"),
            tokenCiphertext: "cipher:raw-token",
            tokenIv: "iv",
            tokenAuthTag: "tag",
            status: "pending" as const,
            expiresAt: new Date("2026-06-26T10:00:00.000Z"),
          })),
          create: vi.fn(),
          update: vi.fn(),
          updateMany: vi.fn(),
        },
      },
    })).resolves.toEqual({
      ok: false,
      reason: "invalid_invite",
    });
  });
});

describe("buildMemberBindingLink", () => {
  it("returns relative or absolute binding links", () => {
    expect(buildMemberBindingLink("raw token")).toBe("/members/bind?token=raw%20token");
    expect(buildMemberBindingLink("raw", "http://localhost:3000")).toBe(
      "http://localhost:3000/members/bind?token=raw",
    );
  });
});
