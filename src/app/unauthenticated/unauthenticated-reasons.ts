export type UnauthenticatedReason =
  | "unauthenticated"
  | "google_account_not_linked"
  | "member_not_active";

export type UnauthenticatedView = {
  canStartGoogleSignIn: boolean;
  description: string;
  reason: UnauthenticatedReason;
  title: string;
};

export function unauthenticatedViewFor(
  reason: string | undefined,
): UnauthenticatedView {
  if (reason === "google_account_not_linked") {
    return {
      reason,
      canStartGoogleSignIn: true,
      title: "找不到家庭成員帳號",
      description:
        "這個 Google 帳號尚未被管理員邀請或連結，請確認登入帳號是否正確。",
    };
  }

  if (reason === "member_not_active") {
    return {
      reason,
      canStartGoogleSignIn: false,
      title: "帳號尚未啟用",
      description:
        "你的家庭成員帳號目前不是啟用狀態，請聯絡管理員確認權限。",
    };
  }

  return {
    reason: "unauthenticated",
    canStartGoogleSignIn: true,
    title: "請先使用 Google 登入",
    description: "登入後才能查看家庭共用金、收支紀錄與退款資訊。",
  };
}
