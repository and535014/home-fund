import { describe, expect, it } from "vitest";
import { buildHomeBlockedViewFromAccess } from "./home-blocked-view";

describe("buildHomeBlockedViewFromAccess", () => {
  it("shows the Google sign-in state before any household data is exposed", () => {
    expect(buildHomeBlockedViewFromAccess({
      ok: false,
      reason: "unauthenticated",
    })).toMatchObject({
      kind: "unauthenticated",
      title: "請先使用 Google 登入",
      primaryActionLabel: "使用 Google 登入",
    });
  });

  it("blocks a Google account that is not linked to an active household member", () => {
    expect(buildHomeBlockedViewFromAccess({
      ok: false,
      reason: "google_account_not_linked",
    })).toMatchObject({
      kind: "google_account_not_linked",
      title: "找不到家庭成員帳號",
    });

    expect(buildHomeBlockedViewFromAccess({
      ok: false,
      reason: "member_not_active",
    })).toMatchObject({
      kind: "member_not_active",
      title: "帳號尚未啟用",
    });
  });

  it("shows an auth callback error on blocked views", () => {
    expect(buildHomeBlockedViewFromAccess({
      ok: false,
      reason: "unauthenticated",
    }, "state_mismatch")).toMatchObject({
      kind: "unauthenticated",
      errorCode: "state_mismatch",
      errorMessage:
        "登入驗證狀態已失效，請重新點選 Google 登入。若仍發生，請清除 localhost 的 cookie 後再試一次。",
    });

    expect(buildHomeBlockedViewFromAccess({
      ok: false,
      reason: "unauthenticated",
    }, "oauth_cancelled")).toMatchObject({
      kind: "unauthenticated",
      errorCode: "oauth_cancelled",
      errorMessage: "Google 登入沒有完成，請重新嘗試。",
    });
  });
});
