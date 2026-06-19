"use server";

import { revalidatePath } from "next/cache";
import {
  actionError,
  actionSuccess,
  type ActionState,
} from "@/app/action-state";
import { requireServerActionAccess } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import { createMemberInvitationInDatabase } from "@/modules/identity-access/member-invitation-command";
import { updateMemberDisplayNameInDatabase } from "@/modules/identity-access/member-management-command";

export type InviteMemberActionField = "googleEmail";
export type InviteMemberActionCode =
  | "invalid_email"
  | "member_already_active"
  | "permission_denied"
  | "unknown_error";
export type InviteMemberActionResult = {
  email: string;
  invitationLink: string;
  memberId: string;
};
export type InviteMemberActionState = ActionState<
  InviteMemberActionResult,
  InviteMemberActionField,
  InviteMemberActionCode
>;

export type UpdateMemberDisplayNameActionField = "displayName";
export type UpdateMemberDisplayNameActionCode =
  | "invalid_display_name"
  | "member_not_found"
  | "permission_denied"
  | "unknown_error";
export type UpdateMemberDisplayNameActionState = ActionState<
  { memberId: string; displayName: string },
  UpdateMemberDisplayNameActionField,
  UpdateMemberDisplayNameActionCode
>;

export async function createMemberInvitationAction(
  _previousState: InviteMemberActionState,
  formData: FormData,
): Promise<InviteMemberActionState> {
  const googleEmail = readFormValue(formData, "googleEmail") ?? "";
  const session = await requireServerActionAccess({ type: "manage_members" });
  const result = await createMemberInvitationInDatabase(
    session.access.member,
    { googleEmail },
    {
      baseUrl: readBaseUrl(),
      prisma: getPrismaClient(),
    },
  );

  if (!result.ok) {
    return inviteMemberError(result.reason);
  }

  revalidateMemberPaths();
  return actionSuccess("邀請連結已建立", {
    email: result.email,
    invitationLink: result.invitationLink,
    memberId: result.memberId,
  });
}

export async function updateMemberDisplayNameAction(
  _previousState: UpdateMemberDisplayNameActionState,
  formData: FormData,
): Promise<UpdateMemberDisplayNameActionState> {
  const memberId = readFormValue(formData, "memberId");
  const displayName = readFormValue(formData, "displayName") ?? "";

  if (!memberId) {
    return updateDisplayNameError("member_not_found");
  }

  const session = await requireServerActionAccess({ type: "manage_members" });
  const result = await updateMemberDisplayNameInDatabase(
    session.access.member,
    { memberId, displayName },
    { prisma: getPrismaClient() },
  );

  if (!result.ok) {
    return updateDisplayNameError(result.reason);
  }

  revalidateMemberPaths();
  return actionSuccess("顯示名稱已更新", {
    memberId: result.member.id,
    displayName: result.member.displayName,
  });
}

function readFormValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function revalidateMemberPaths() {
  revalidatePath("/");
  revalidatePath("/members");
}

function readBaseUrl(): string | undefined {
  return process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
}

function inviteMemberError(
  code: InviteMemberActionCode,
): InviteMemberActionState {
  const messages: Record<InviteMemberActionCode, string> = {
    invalid_email: "請輸入有效的 Google email。",
    member_already_active: "這個 Google email 已經是啟用成員。",
    permission_denied: "你沒有權限管理成員。",
    unknown_error: "成員邀請無法建立。",
  };

  return actionError(messages[code], {
    code,
    ...(code === "invalid_email"
      ? { fieldErrors: { googleEmail: [messages[code]] } }
      : {}),
  });
}

function updateDisplayNameError(
  code: UpdateMemberDisplayNameActionCode | "cannot_remove_last_admin" | "member_must_have_role" | "duplicate_google_account_email",
): UpdateMemberDisplayNameActionState {
  const normalizedCode = isUpdateDisplayNameActionCode(code)
    ? code
    : "unknown_error";
  const messages: Record<UpdateMemberDisplayNameActionCode, string> = {
    invalid_display_name: "顯示名稱不能空白。",
    member_not_found: "找不到這位成員。",
    permission_denied: "你沒有權限管理成員。",
    unknown_error: "成員資料無法更新。",
  };

  return actionError(messages[normalizedCode], {
    code: normalizedCode,
    ...(normalizedCode === "invalid_display_name"
      ? { fieldErrors: { displayName: [messages[normalizedCode]] } }
      : {}),
  });
}

function isUpdateDisplayNameActionCode(
  code: string,
): code is UpdateMemberDisplayNameActionCode {
  return [
    "invalid_display_name",
    "member_not_found",
    "permission_denied",
    "unknown_error",
  ].includes(code);
}
