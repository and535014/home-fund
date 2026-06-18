"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentMemberFromHeaders } from "@/auth/server-current-member";
import { getPrismaClient } from "@/db/prisma";
import { markExpensesReimbursedInDatabase } from "@/modules/reimbursement/reimbursement-command";
import { readDashboardMonth } from "./month-selection";

export async function markExpensesReimbursedAction(formData: FormData) {
  const month = readDashboardMonth(readFormValue(formData, "month"));
  const returnTo = sanitizeReturnTo(readFormValue(formData, "returnTo"));
  const selectedExpenseIds = formData
    .getAll("selectedExpenseIds")
    .filter((value): value is string => typeof value === "string");
  const currentMember = await getCurrentMemberFromHeaders(
    new Headers(await headers()),
  );

  if (!currentMember.ok) {
    redirect(reimbursementRedirectUrl(returnTo, month, "permission_denied"));
  }

  const result = await markExpensesReimbursedInDatabase(
    currentMember.member,
    { selectedExpenseIds },
    { prisma: getPrismaClient() },
  );

  if (!result.ok) {
    redirect(reimbursementRedirectUrl(returnTo, month, result.reason));
  }

  revalidatePath("/");
  revalidatePath(returnTo);
  redirect(reimbursementRedirectUrl(returnTo, month, "success"));
}

function reimbursementRedirectUrl(
  returnTo: string,
  month: string,
  result: string,
): string {
  const params = new URLSearchParams({
    month,
    reimbursement: result,
  });

  return `${returnTo}?${params.toString()}`;
}

function readFormValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function sanitizeReturnTo(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return "/";
  }

  return value;
}
