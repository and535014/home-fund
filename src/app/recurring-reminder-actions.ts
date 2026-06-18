"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getCurrentMemberFromHeaders } from "@/auth/server-current-member";
import { getPrismaClient } from "@/db/prisma";
import { confirmRecurringOccurrenceInDatabase } from "@/modules/recurring-schedule/recurring-confirmation-command";
import { readDashboardMonth } from "./month-selection";

export async function confirmRecurringReminderAction(formData: FormData) {
  const month = readDashboardMonth(readFormValue(formData, "month"));
  const occurrenceId = readFormValue(formData, "occurrenceId");
  const returnTo = sanitizeReturnTo(readFormValue(formData, "returnTo"));

  if (!occurrenceId) {
    redirect(recurringReminderRedirectUrl(returnTo, month, "missing_occurrence"));
  }

  const currentMember = await getCurrentMemberFromHeaders(
    new Headers(await headers()),
  );

  if (!currentMember.ok) {
    redirect(recurringReminderRedirectUrl(returnTo, month, "permission_denied"));
  }

  const result = await confirmRecurringOccurrenceInDatabase(
    currentMember.member,
    { occurrenceId },
    { prisma: getPrismaClient() },
  );

  if (!result.ok) {
    redirect(recurringReminderRedirectUrl(returnTo, month, result.reason));
  }

  revalidatePath("/");
  revalidatePath(returnTo);
  redirect(recurringReminderRedirectUrl(returnTo, month, "confirmed"));
}

function recurringReminderRedirectUrl(
  returnTo: string,
  month: string,
  result: string,
): string {
  const params = new URLSearchParams({
    month,
    recurring: result,
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
