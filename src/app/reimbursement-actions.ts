"use server";

import { revalidatePath } from "next/cache";
import {
  actionError,
  actionSuccess,
  type ActionState,
} from "@/app/action-state";
import { requireServerActionAccess } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import { markExpensesReimbursedInDatabase } from "@/modules/reimbursement/reimbursement-command";
import { readDashboardMonth } from "./month-selection";

export type ReimbursementActionCode =
  | "permission_denied"
  | "empty_selection"
  | "expense_not_found"
  | "not_refundable"
  | "already_reimbursed";
export type ReimbursementActionField = "selectedExpenseIds";
export type ReimbursementActionState = ActionState<
  { month: string; selectedExpenseIds: string[] },
  ReimbursementActionField,
  ReimbursementActionCode
>;

export async function markExpensesReimbursedAction(
  _previousState: ReimbursementActionState,
  formData: FormData,
): Promise<ReimbursementActionState> {
  const month = readDashboardMonth(readFormValue(formData, "month"));
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
    return reimbursementError(result.reason);
  }

  revalidatePath("/");
  revalidatePath("/reimbursements");
  return actionSuccess("已完成退款。", {
    month,
    selectedExpenseIds,
  });
}

function readFormValue(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);

  return typeof value === "string" ? value : undefined;
}

function reimbursementError(
  code: ReimbursementActionCode,
): ReimbursementActionState {
  const messages: Record<ReimbursementActionCode, string> = {
    already_reimbursed: "其中一筆支出已經退款，請重新整理後再試。",
    empty_selection: "請先選擇要退款的支出。",
    expense_not_found: "找不到其中一筆退款支出，請重新整理後再試。",
    not_refundable: "其中一筆支出目前不可退款，請重新整理後再試。",
    permission_denied: "你沒有執行退款的權限。",
  };

  return actionError(messages[code], {
    code,
    fieldErrors: { selectedExpenseIds: [messages[code]] },
  });
}
