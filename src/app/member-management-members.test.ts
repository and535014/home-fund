import { describe, expect, it, vi } from "vitest";
import { mapMemberManagementMemberRows } from "./member-management-members";
import { hashInvitationToken, type BindingTokenCrypto } from "@/modules/identity-access/member-invitation-command";

vi.mock("server-only", () => ({}));

const now = new Date("2026-06-23T10:00:00.000Z");

const tokenCrypto: BindingTokenCrypto = {
  encrypt: (token) => ({
    tokenCiphertext: `cipher:${token}`,
    tokenIv: "iv",
    tokenAuthTag: "tag",
  }),
  decrypt: (encrypted) => encrypted.tokenCiphertext.replace("cipher:", ""),
};

describe("mapMemberManagementMemberRows", () => {
  it("maps member rows to binding states and re-copy links", () => {
    expect(mapMemberManagementMemberRows([
      memberRow({
        id: "member-active",
        displayName: "安琪",
        status: "active",
      }),
      memberRow({
        id: "member-unbound",
        displayName: "柏宇",
        status: "invited",
      }),
      memberRow({
        id: "member-waiting",
        displayName: "佳蓉",
        status: "invited",
        invitations: [
          invitationRow({
            token: "active-token",
            expiresAt: new Date("2026-06-30T10:00:00.000Z"),
          }),
        ],
      }),
      memberRow({
        id: "member-expired",
        displayName: "失效測試成員",
        status: "invited",
        invitations: [
          invitationRow({
            token: "expired-token",
            expiresAt: new Date("2026-06-20T10:00:00.000Z"),
          }),
        ],
      }),
      memberRow({
        id: "member-disabled",
        displayName: "停用測試成員",
        status: "disabled",
      }),
    ], {
      baseUrl: "http://localhost:3000",
      now,
      tokenCrypto,
    })).toEqual([
      expect.objectContaining({
        id: "member-active",
        binding: {
          state: "bound",
          link: null,
          expiresAt: null,
        },
        status: "active",
      }),
      expect.objectContaining({
        id: "member-unbound",
        binding: {
          state: "none",
          link: null,
          expiresAt: null,
        },
      }),
      expect.objectContaining({
        id: "member-waiting",
        binding: {
          state: "active",
          link: "http://localhost:3000/members/bind?token=active-token",
          expiresAt: new Date("2026-06-30T10:00:00.000Z"),
        },
      }),
      expect.objectContaining({
        id: "member-expired",
        binding: {
          state: "expired",
          link: null,
          expiresAt: new Date("2026-06-20T10:00:00.000Z"),
        },
      }),
      expect.objectContaining({
        id: "member-disabled",
        binding: {
          state: "disabled",
          link: null,
          expiresAt: null,
        },
      }),
    ]);
  });
});

function memberRow(overrides: Partial<MemberRowFixture>) {
  return {
    id: overrides.id ?? "member-id",
    displayName: overrides.displayName ?? "成員",
    avatarUrl: null,
    googleAccountEmail: null,
    googleSubject: null,
    roles: [{ role: "general_member" as const }],
    status: overrides.status ?? "invited",
    invitations: overrides.invitations ?? [],
  };
}

function invitationRow({
  expiresAt,
  token,
}: {
  expiresAt: Date;
  token: string;
}) {
  return {
    id: `invite-${token}`,
    tokenHash: hashInvitationToken(token),
    tokenCiphertext: `cipher:${token}`,
    tokenIv: "iv",
    tokenAuthTag: "tag",
    status: "pending" as const,
    expiresAt,
    createdAt: new Date("2026-06-23T09:00:00.000Z"),
  };
}

type MemberRowFixture = {
  id: string;
  displayName: string;
  status: "invited" | "active" | "disabled";
  invitations: ReturnType<typeof invitationRow>[];
};
