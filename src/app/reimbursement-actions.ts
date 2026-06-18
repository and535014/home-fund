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
  const selectedExpenseIds = formData
    .getAll("selectedExpenseIds")
    .filter((value): value is string => typeof value === "string");
  const currentMember = await getCurrentMemberFromHeaders(
    new Headers(await headers()),
  );

  if (!currentMember.ok) {
    redirect(reimbursementRedirectUrl(month, "permission_denied"));
  }

  const result = await markExpensesReimbursedInDatabase(
    currentMember.member,
    { selectedExpenseIds },
    { prisma: getPrismaClient() },
  );

  if (!result.ok) {
    redirect(reimbursementRedirectUrl(month, result.reason));
  }

  revalidatePath("/");
  redirect(reimbursementRedirectUrl(month, "success"));
}

function reimbursementRedirectUrl(month: string, result: string): string {
  const params = new URLSearchParams({
    month,
    reimbursement: result,
  });

  return `/?${params.toString()}`;
}

function readFormValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}
