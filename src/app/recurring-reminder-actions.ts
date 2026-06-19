"use server";

import { revalidatePath } from "next/cache";
import {
  actionError,
  actionSuccess,
  type ActionState,
} from "@/app/action-state";
import { requireAuthenticatedMember } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import { confirmRecurringOccurrenceInDatabase } from "@/modules/recurring-schedule/recurring-confirmation-command";
import { readDashboardMonth } from "./month-selection";
import type { RecurringReminderFeedback } from "./recurring-reminder-feedback";

export type RecurringReminderActionCode = Exclude<
  RecurringReminderFeedback,
  "confirmed"
>;
export type RecurringReminderActionField = "occurrenceId";
export type RecurringReminderActionState = ActionState<
  { month: string; occurrenceId: string },
  RecurringReminderActionField,
  RecurringReminderActionCode
>;

export async function confirmRecurringReminderAction(
  _previousState: RecurringReminderActionState,
  formData: FormData,
): Promise<RecurringReminderActionState> {
  const month = readDashboardMonth(readFormValue(formData, "month"));
  const occurrenceId = readFormValue(formData, "occurrenceId");

  if (!occurrenceId) {
    return recurringReminderError("missing_occurrence");
  }

  const session = await requireAuthenticatedMember();

  const result = await confirmRecurringOccurrenceInDatabase(
    session.access.member,
    { occurrenceId },
    { prisma: getPrismaClient() },
  );

  if (!result.ok) {
    return recurringReminderError(toRecurringReminderActionCode(result.reason));
  }

  revalidatePath("/");
  revalidatePath("/recurring");
  return actionSuccess("已確認週期提醒。", {
    month,
    occurrenceId,
  });
}

function readFormValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function recurringReminderError(
  code: RecurringReminderActionCode,
): RecurringReminderActionState {
  const messages: Record<RecurringReminderActionCode, string> = {
    archived_category: "這筆週期提醒的分類已封存，請檢查規則設定。",
    category_type_mismatch: "這筆週期提醒的分類類型不符，請檢查規則設定。",
    invalid_amount: "這筆週期提醒的金額無法建立紀錄。",
    invalid_day_of_month: "這筆週期提醒的日期無法建立紀錄。",
    ledger_record_creation_failed: "這筆週期提醒目前無法建立紀錄。",
    missing_category: "這筆週期提醒缺少分類，請檢查規則設定。",
    missing_income_source_member: "這筆收入提醒缺少收入來源成員。",
    missing_member_payer: "這筆支出提醒缺少代墊成員。",
    missing_occurrence: "找不到這筆週期提醒，請重新整理後再試。",
    missing_payment_source: "這筆支出提醒缺少付款來源。",
    occurrence_already_posted: "這筆週期提醒已確認入帳，請重新整理。",
    occurrence_rule_mismatch: "這筆週期提醒資料不一致，請重新整理後再試。",
    permission_denied: "你沒有確認這筆週期提醒的權限。",
    stale_confirmation: "這筆週期提醒已確認入帳，請重新整理。",
  };

  return actionError(messages[code], {
    code,
    fieldErrors: { occurrenceId: [messages[code]] },
  });
}

function toRecurringReminderActionCode(
  code: string,
): RecurringReminderActionCode {
  if (isRecurringReminderActionCode(code)) {
    return code;
  }

  return "occurrence_rule_mismatch";
}

function isRecurringReminderActionCode(
  code: string,
): code is RecurringReminderActionCode {
  return [
    "archived_category",
    "category_type_mismatch",
    "invalid_amount",
    "invalid_day_of_month",
    "ledger_record_creation_failed",
    "missing_category",
    "missing_income_source_member",
    "missing_member_payer",
    "missing_occurrence",
    "missing_payment_source",
    "occurrence_already_posted",
    "occurrence_rule_mismatch",
    "permission_denied",
    "stale_confirmation",
  ].includes(code);
}
