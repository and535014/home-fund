import type { ValidateInvitationTokenResult } from "@/modules/identity-access/member-invitations";

export type MemberBindTokenValidation = ValidateInvitationTokenResult;

export type MemberBindPageState =
  | {
      kind: "valid";
      token: string;
    }
  | {
      kind: "missing" | "expired" | "invalid" | "used";
    };

export type MemberBindErrorState = Exclude<
  MemberBindPageState["kind"],
  "valid"
>;

export function mapMemberBindTokenState(
  token: string | undefined,
  validation: MemberBindTokenValidation,
): MemberBindPageState {
  if (!validation.ok) {
    return {
      kind: mapValidationFailure(validation.reason),
    };
  }

  if (!token || !validation.invitation.memberId) {
    return { kind: "invalid" };
  }

  return {
    kind: "valid",
    token,
  };
}

export function memberBindErrorMessage(state: MemberBindErrorState): string {
  const messages: Record<MemberBindErrorState, string> = {
    expired: "這個綁定連結已過期，請向管理者索取新的連結。",
    invalid: "這個綁定連結無法使用，請向管理者確認。",
    missing: "這個綁定連結缺少必要資訊，請向管理者索取新的連結。",
    used: "這個綁定連結已使用過，請直接登入或向管理者確認。",
  };

  return messages[state];
}

export function memberBindAuthErrorMessage(error: string): string {
  const messages: Record<string, string> = {
    accepted_invite: "這個綁定連結已使用過，請直接登入或向管理者確認。",
    expired_invite: "這個綁定連結已過期，請向管理者索取新的連結。",
    google_account_already_member: "這個 Google 帳號已經綁定其他成員，請使用其他 Google 帳號或向管理者確認。",
    google_sign_in: "Google 登入沒有完成，請重新嘗試。",
    invalid_invite: "這個綁定連結無法使用，請向管理者確認。",
    missing_google_account: "Google 登入沒有提供 email，請換一個 Google 帳號或重新嘗試。",
    revoked_invite: "這個綁定連結無法使用，請向管理者確認。",
  };

  return messages[error] ?? "Google 綁定沒有完成，請確認帳號或重新嘗試。";
}

function mapValidationFailure(
  reason: Exclude<MemberBindTokenValidation, { ok: true }>["reason"],
): MemberBindErrorState {
  if (reason === "missing_token") {
    return "missing";
  }

  if (reason === "expired_invite") {
    return "expired";
  }

  if (reason === "accepted_invite") {
    return "used";
  }

  return "invalid";
}
