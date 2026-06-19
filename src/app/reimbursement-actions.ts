"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireServerActionAccess } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import { markExpensesReimbursedInDatabase } from "@/modules/reimbursement/reimbursement-command";
import { readDashboardMonth } from "./month-selection";

export async function markExpensesReimbursedAction(formData: FormData) {
  const month = readDashboardMonth(readFormValue(formData, "month"));
  const returnTo = sanitizeReturnTo(readFormValue(formData, "returnTo"));
  const selectedExpenseIds = formData
    .getAll("selectedExpenseIds")
    .filter((value): value is string => typeof value === "string");
  const session = await requireServerActionAccess({
    type: "perform_reimbursement",
  });

  const result = await markExpensesReimbursedInDatabase(
    session.access.member,
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
