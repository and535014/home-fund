"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireServerActionAccess } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import { createMemberInvitationInDatabase } from "@/modules/identity-access/member-invitation-command";
import { updateMemberDisplayNameInDatabase } from "@/modules/identity-access/member-management-command";

export async function createMemberInvitationAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(readFormValue(formData, "returnTo"));
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
    redirect(memberRedirectUrl(returnTo, result.reason, "invite"));
  }

  revalidateMemberPaths(returnTo);
  redirect(memberRedirectUrl(returnTo, "invited", "invite", {
    inviteEmail: result.email,
    inviteLink: result.invitationLink,
  }));
}

export async function updateMemberDisplayNameAction(formData: FormData) {
  const returnTo = sanitizeReturnTo(readFormValue(formData, "returnTo"));
  const memberId = readFormValue(formData, "memberId");
  const displayName = readFormValue(formData, "displayName") ?? "";

  if (!memberId) {
    redirect(memberRedirectUrl(returnTo, "member_not_found", "rename"));
  }

  const session = await requireServerActionAccess({ type: "manage_members" });
  const result = await updateMemberDisplayNameInDatabase(
    session.access.member,
    { memberId, displayName },
    { prisma: getPrismaClient() },
  );

  if (!result.ok) {
    redirect(memberRedirectUrl(returnTo, result.reason, "rename"));
  }

  revalidateMemberPaths(returnTo);
  redirect(memberRedirectUrl(returnTo, "renamed"));
}

function memberRedirectUrl(
  returnTo: string,
  result: string,
  action?: "invite" | "rename",
  extraParams?: Record<string, string>,
): string {
  const params = new URLSearchParams({
    memberResult: result,
  });

  if (action) {
    params.set("memberAction", action);
  }

  Object.entries(extraParams ?? {}).forEach(([key, value]) => {
    params.set(key, value);
  });

  return `${returnTo}?${params.toString()}`;
}

function readFormValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function revalidateMemberPaths(returnTo: string) {
  revalidatePath("/");
  revalidatePath("/members");
  revalidatePath(returnTo);
}

function readBaseUrl(): string | undefined {
  return process.env.BETTER_AUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL;
}

function sanitizeReturnTo(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/members";
  }

  return value;
}
