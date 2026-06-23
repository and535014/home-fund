import { describe, expect, it } from "vitest";
import {
  mapMemberBindTokenState,
  memberBindErrorMessage,
  memberBindAuthErrorMessage,
  type MemberBindTokenValidation,
} from "./member-bind-state";

const validInvitation = {
  id: "invite-kai",
  householdId: "household-demo",
  memberId: "member-kai",
  tokenHash: "hash",
  status: "pending" as const,
  expiresAt: new Date("2026-06-30T10:00:00.000Z"),
};

describe("mapMemberBindTokenState", () => {
  it("allows valid pending member-specific binding tokens", () => {
    expect(mapMemberBindTokenState("raw-token", {
      ok: true,
      invitation: validInvitation,
    })).toEqual({
      kind: "valid",
      token: "raw-token",
    });
  });

  it("rejects pending tokens without a target member", () => {
    expect(mapMemberBindTokenState("raw-token", {
      ok: true,
      invitation: {
        ...validInvitation,
        memberId: undefined,
      },
    } satisfies MemberBindTokenValidation)).toEqual({
      kind: "invalid",
    });
  });

  it("maps validation failures to user-facing bind states", () => {
    expect(mapMemberBindTokenState(undefined, {
      ok: false,
      reason: "missing_token",
    })).toEqual({ kind: "missing" });
    expect(mapMemberBindTokenState("raw", {
      ok: false,
      reason: "expired_invite",
    })).toEqual({ kind: "expired" });
    expect(mapMemberBindTokenState("raw", {
      ok: false,
      reason: "accepted_invite",
    })).toEqual({ kind: "used" });
    expect(mapMemberBindTokenState("raw", {
      ok: false,
      reason: "revoked_invite",
    })).toEqual({ kind: "invalid" });
    expect(mapMemberBindTokenState("raw", {
      ok: false,
      reason: "invalid_invite",
    })).toEqual({ kind: "invalid" });
  });
});

describe("memberBindErrorMessage", () => {
  it("uses member-facing copy", () => {
    expect(memberBindErrorMessage("expired")).toBe(
      "這個綁定連結已過期，請向管理者索取新的連結。",
    );
    expect(memberBindErrorMessage("used")).toBe(
      "這個綁定連結已使用過，請直接登入或向管理者確認。",
    );
  });
});

describe("memberBindAuthErrorMessage", () => {
  it("maps callback failures to member-facing copy", () => {
    expect(memberBindAuthErrorMessage("google_account_already_member")).toBe(
      "這個 Google 帳號已經綁定其他成員，請使用其他 Google 帳號或向管理者確認。",
    );
    expect(memberBindAuthErrorMessage("missing_google_account")).toBe(
      "Google 登入沒有提供 email，請換一個 Google 帳號或重新嘗試。",
    );
    expect(memberBindAuthErrorMessage("unexpected")).toBe(
      "Google 綁定沒有完成，請確認帳號或重新嘗試。",
    );
  });
});
