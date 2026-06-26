"use server";

import {
  actionError,
  type ActionState,
} from "@/app/action-state";
import {
  actionSuccessWithRevalidation,
  requireMutationAccess,
  type ServerActionAccess,
} from "@/app/server-action-adapter";
import { getPrismaClient } from "@/db/prisma";
import {
  generateMemberBindingLinkInDatabase,
  isBindingTokenConfigurationError,
} from "@/modules/identity-access/member-invitation-command";
import {
  createMemberInDatabase,
  updateMemberDisplayNameInDatabase,
} from "@/modules/identity-access/member-management-command";
import type { MemberRole } from "@/modules/identity-access/authorization";

export type CreateMemberActionField = "displayName" | "role";
export type CreateMemberActionCode =
  | "invalid_display_name"
  | "invalid_role"
  | "permission_denied"
  | "unknown_error";
export type CreateMemberActionResult = {
  memberId: string;
  displayName: string;
};
export type CreateMemberActionState = ActionState<
  CreateMemberActionResult,
  CreateMemberActionField,
  CreateMemberActionCode
>;

export type CreateMemberBindingLinkActionField = "memberId";
export type CreateMemberBindingLinkActionCode =
  | "configuration_error"
  | "member_not_found"
  | "member_already_bound"
  | "member_disabled"
  | "permission_denied"
  | "unknown_error";
export type CreateMemberBindingLinkActionResult = {
  bindingLink: string;
  expiresAt: string;
};
export type CreateMemberBindingLinkActionState = ActionState<
  CreateMemberBindingLinkActionResult,
  CreateMemberBindingLinkActionField,
  CreateMemberBindingLinkActionCode
>;

export type UpdateMemberDisplayNameActionField = "displayName";
export type UpdateMemberDisplayNameActionCode =
  | "invalid_display_name"
  | "member_not_found"
  | "permission_denied"
  | "unknown_error";
export type UpdateMemberDisplayNameActionResult = {
  memberId: string;
  displayName: string;
};
export type UpdateMemberDisplayNameActionState = ActionState<
  UpdateMemberDisplayNameActionResult,
  UpdateMemberDisplayNameActionField,
  UpdateMemberDisplayNameActionCode
>;

export async function createMemberAction(
  _previousState: CreateMemberActionState,
  formData: FormData,
): Promise<CreateMemberActionState> {
  const displayName = readFormValue(formData, "displayName") ?? "";
  const role = readMemberRole(formData);

  if (!role) {
    return createMemberError("invalid_role");
  }

  const session = await requireMutationAccess({ type: "manage_members" });
  const result = await createMemberInDatabase(
    session.access.member,
    { displayName, role },
    {
      prisma: getPrismaClient(),
      householdId: session.access.member.householdId,
    },
  );

  if (!result.ok) {
    return createMemberError(result.reason);
  }

  return memberSuccess("成員已建立。", {
    memberId: result.member.id,
    displayName: result.member.displayName,
  });
}

export async function createMemberBindingLinkAction(
  _previousState: CreateMemberBindingLinkActionState,
  formData: FormData,
): Promise<CreateMemberBindingLinkActionState> {
  const memberId = readFormValue(formData, "memberId");

  if (!memberId) {
    return bindingLinkError("member_not_found");
  }

  const session = await requireMutationAccess({ type: "manage_members" });
  const result = await tryGenerateMemberBindingLink(session.access.member, memberId);

  if (!result.ok) {
    return bindingLinkError(result.reason);
  }

  return memberSuccess("綁定連結已建立", {
    bindingLink: result.bindingLink,
    expiresAt: result.expiresAt.toISOString(),
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

  const session = await requireMutationAccess({ type: "manage_members" });
  const result = await updateMemberDisplayNameInDatabase(
    session.access.member,
    { memberId, displayName },
    {
      prisma: getPrismaClient(),
      householdId: session.access.member.householdId,
    },
  );

  if (!result.ok) {
    return updateDisplayNameError(result.reason);
  }

  return memberSuccess("顯示名稱已更新", {
    memberId: result.member.id,
    displayName: result.member.displayName,
  });
}

function readFormValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function readMemberRole(formData: FormData): MemberRole | undefined {
  const role = readFormValue(formData, "role");

  return isMemberRole(role) ? role : undefined;
}

function isMemberRole(role: string | undefined): role is MemberRole {
  return role === "admin" ||
    role === "finance_manager" ||
    role === "general_member";
}

function memberSuccess<TResult, TField extends string, TCode extends string>(
  message: string,
  data: TResult,
): ActionState<TResult, TField, TCode> {
  return actionSuccessWithRevalidation<TResult, TField, TCode>(
    message,
    data,
    ["/", "/settings/members"],
  );
}

function readBaseUrl(): string | undefined {
  return process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
}

async function tryGenerateMemberBindingLink(
  member: ServerActionAccess["access"]["member"],
  memberId: string,
) {
  try {
    return await generateMemberBindingLinkInDatabase(
      member,
      {
        memberId,
        baseUrl: readBaseUrl(),
        prisma: getPrismaClient(),
      },
    );
  } catch (error) {
    if (isBindingTokenConfigurationError(error)) {
      return { ok: false as const, reason: "configuration_error" as const };
    }

    throw error;
  }
}

function bindingLinkError(
  code: CreateMemberBindingLinkActionCode,
): CreateMemberBindingLinkActionState {
  const messages: Record<CreateMemberBindingLinkActionCode, string> = {
    configuration_error: "綁定連結設定尚未完成，請確認環境變數。",
    member_already_bound: "這位成員已綁定 Google 帳號。",
    member_disabled: "停用成員不能產生綁定連結。",
    member_not_found: "找不到這位成員。",
    permission_denied: "你沒有權限管理成員。",
    unknown_error: "綁定連結無法建立。",
  };

  return actionError(messages[code], {
    code,
  });
}

function createMemberError(
  code:
    | CreateMemberActionCode
    | "duplicate_google_account_email"
    | "member_not_found"
    | "cannot_remove_last_admin"
    | "member_must_have_role",
): CreateMemberActionState {
  const normalizedCode = isCreateMemberActionCode(code)
    ? code
    : "unknown_error";
  const messages: Record<CreateMemberActionCode, string> = {
    invalid_display_name: "顯示名稱不能空白。",
    invalid_role: "請選擇有效的角色。",
    permission_denied: "你沒有權限管理成員。",
    unknown_error: "成員無法建立。",
  };

  return actionError(messages[normalizedCode], {
    code: normalizedCode,
    ...(normalizedCode === "invalid_display_name"
      ? { fieldErrors: { displayName: [messages[normalizedCode]] } }
      : {}),
    ...(normalizedCode === "invalid_role"
      ? { fieldErrors: { role: [messages[normalizedCode]] } }
      : {}),
  });
}

function isCreateMemberActionCode(
  code: string,
): code is CreateMemberActionCode {
  return [
    "invalid_display_name",
    "invalid_role",
    "permission_denied",
    "unknown_error",
  ].includes(code);
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
