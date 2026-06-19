"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireServerActionAccess } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import { updateMemberDisplayNameInDatabase } from "@/modules/identity-access/member-management-command";

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
  action?: "rename",
): string {
  const params = new URLSearchParams({
    memberResult: result,
  });

  if (action) {
    params.set("memberAction", action);
  }

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

function sanitizeReturnTo(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/members";
  }

  return value;
}
