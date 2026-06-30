"use server";

import { actionError, type ActionState } from "@/app/action-state";
import {
  actionSuccessWithRevalidation,
  requireMutationAccess,
} from "@/app/server-action-adapter";
import { getPrismaClient } from "@/db/prisma";
import {
  confirmRecurringOccurrenceInDatabase,
  createRecurringEventInDatabase,
  deleteRecurringEventInDatabase,
  type RecurringEventCommandPrismaClient,
  type RecurringEventMutationPrismaClient,
} from "@/modules/recurring/recurring-event-command";
import {
  parseConfirmRecurringOccurrenceForm,
  parseCreateRecurringEventForm,
  parseDeleteRecurringEventForm,
} from "./recurring-event-form";

type FunctionReturn<T> = T extends (...args: infer _Args) => infer TResult
  ? TResult
  : never;

type FailureReason<TResult> = Extract<TResult, { ok: false }> extends {
  reason: infer TReason extends string;
}
  ? TReason
  : never;

type ParseFailure<T> = FailureReason<FunctionReturn<T>>;

type AsyncDomainFailure<T> = FailureReason<Awaited<FunctionReturn<T>>>;

export type CreateRecurringEventActionCode =
  | ParseFailure<typeof parseCreateRecurringEventForm>
  | AsyncDomainFailure<typeof createRecurringEventInDatabase>;

export type CreateRecurringEventActionField =
  | "amountTwd"
  | "categoryId"
  | "name"
  | "payerMemberId"
  | "paymentSource"
  | "postingMode"
  | "recordType"
  | "recurrenceDay"
  | "recurrenceSchedule"
  | "sourceMemberId";

export type DeleteRecurringEventActionCode =
  | ParseFailure<typeof parseDeleteRecurringEventForm>
  | AsyncDomainFailure<typeof deleteRecurringEventInDatabase>;

export type DeleteRecurringEventActionField = "recurringEventId";

export type ConfirmRecurringOccurrenceActionCode =
  | ParseFailure<typeof parseConfirmRecurringOccurrenceForm>
  | AsyncDomainFailure<typeof confirmRecurringOccurrenceInDatabase>;

export type ConfirmRecurringOccurrenceActionField = "occurrenceId";

export type CreateRecurringEventActionState = ActionState<
  { recurringEventId: string },
  CreateRecurringEventActionField,
  CreateRecurringEventActionCode
>;

export type DeleteRecurringEventActionState = ActionState<
  { recurringEventId: string },
  DeleteRecurringEventActionField,
  DeleteRecurringEventActionCode
>;

export type ConfirmRecurringOccurrenceActionState = ActionState<
  { occurrenceId: string; recordId: string },
  ConfirmRecurringOccurrenceActionField,
  ConfirmRecurringOccurrenceActionCode
>;

export async function createRecurringEventAction(
  _previousState: CreateRecurringEventActionState,
  formData: FormData,
): Promise<CreateRecurringEventActionState> {
  const parsed = parseCreateRecurringEventForm(formData);

  if (!parsed.ok) {
    return createRecurringEventError(parsed.reason);
  }

  const session = await requireMutationAccess({
    type: "manage_recurring_events",
  });
  const result = await createRecurringEventInDatabase(
    session.access.member,
    parsed.command,
    {
      householdId: session.access.member.householdId,
      prisma: getPrismaClient() as unknown as RecurringEventCommandPrismaClient,
    },
  );

  if (!result.ok) {
    return createRecurringEventError(result.reason);
  }

  return actionSuccessWithRevalidation(
    "週期事件已新增。",
    { recurringEventId: result.event.id },
    ["/", "/search", "/settings/recurring"],
  );
}

export async function deleteRecurringEventAction(
  _previousState: DeleteRecurringEventActionState,
  formData: FormData,
): Promise<DeleteRecurringEventActionState> {
  const parsed = parseDeleteRecurringEventForm(formData);

  if (!parsed.ok) {
    return deleteRecurringEventError(parsed.reason);
  }

  const session = await requireMutationAccess({
    type: "manage_recurring_events",
  });
  const result = await deleteRecurringEventInDatabase(
    session.access.member,
    parsed.command,
    {
      householdId: session.access.member.householdId,
      prisma: getPrismaClient() as unknown as RecurringEventMutationPrismaClient,
    },
  );

  if (!result.ok) {
    return deleteRecurringEventError(result.reason);
  }

  return actionSuccessWithRevalidation(
    "週期事件已刪除。",
    { recurringEventId: result.recurringEventId },
    ["/", "/search", "/settings/recurring"],
  );
}

export async function confirmRecurringOccurrenceAction(
  _previousState: ConfirmRecurringOccurrenceActionState,
  formData: FormData,
): Promise<ConfirmRecurringOccurrenceActionState> {
  const parsed = parseConfirmRecurringOccurrenceForm(formData);

  if (!parsed.ok) {
    return confirmRecurringOccurrenceError(parsed.reason);
  }

  const session = await requireMutationAccess();
  const result = await confirmRecurringOccurrenceInDatabase(
    session.access.member,
    parsed.command,
    {
      householdId: session.access.member.householdId,
      prisma: getPrismaClient() as unknown as RecurringEventMutationPrismaClient,
    },
  );

  if (!result.ok) {
    return confirmRecurringOccurrenceError(result.reason);
  }

  return actionSuccessWithRevalidation(
    "週期事件已入帳。",
    {
      occurrenceId: result.occurrenceId,
      recordId: result.recordId,
    },
    ["/", "/search", "/refunds"],
  );
}

function createRecurringEventError(
  code: CreateRecurringEventActionCode,
): CreateRecurringEventActionState {
  const messages: Record<CreateRecurringEventActionCode, string> = {
    archived_category: "這個分類已封存，請改選其他分類。",
    category_type_mismatch: "分類類型與紀錄類型不一致。",
    fund_paid_expense_cannot_have_member_payer: "基金支出不能指定代墊成員。",
    invalid_amount: "金額格式不正確，請輸入大於 0 的金額。",
    invalid_payment_source: "支出類型不正確。",
    invalid_posting_mode: "入帳模式不支援。",
    invalid_record_type: "紀錄類型不正確。",
    invalid_recurrence_schedule: "請選擇週期。",
    invalid_schedule_day: "指定日期只支援 1 到 28 號。",
    missing_category: "請選擇分類。",
    missing_name: "請輸入週期事件名稱。",
    missing_payer_member: "請選擇代墊成員。",
    missing_source_member: "請選擇收入來源。",
    permission_denied: "目前帳號沒有管理週期事件的權限。",
  };

  return actionError(messages[code], {
    code,
    fieldErrors: { [fieldForCreateError(code)]: [messages[code]] },
  });
}

function deleteRecurringEventError(
  code: DeleteRecurringEventActionCode,
): DeleteRecurringEventActionState {
  const messages: Record<DeleteRecurringEventActionCode, string> = {
    event_not_found: "找不到這個週期事件，可能已被刪除。",
    missing_recurring_event_id: "找不到要刪除的週期事件。",
    permission_denied: "目前帳號沒有管理週期事件的權限。",
  };

  return actionError(messages[code], {
    code,
    fieldErrors: { recurringEventId: [messages[code]] },
  });
}

function confirmRecurringOccurrenceError(
  code: ConfirmRecurringOccurrenceActionCode,
): ConfirmRecurringOccurrenceActionState {
  const messages: Record<ConfirmRecurringOccurrenceActionCode, string> = {
    already_posted: "這筆週期事件已入帳。",
    archived_category: "這個分類已封存，請改選其他分類。",
    category_type_mismatch: "分類類型與紀錄類型不一致。",
    invalid_amount: "金額格式不正確。",
    invalid_month: "週期月份格式不正確。",
    invalid_schedule_day: "指定日期不支援。",
    missing_category: "請選擇分類。",
    occurrence_not_due: "這筆週期事件尚未到入帳日期。",
    missing_occurrence_id: "找不到要入帳的週期事件。",
    occurrence_not_found: "找不到這筆週期事件，可能已被更新或刪除。",
    permission_denied: "目前帳號沒有入帳這筆週期事件的權限。",
  };

  return actionError(messages[code], {
    code,
    fieldErrors: { occurrenceId: [messages[code]] },
  });
}

function fieldForCreateError(
  code: CreateRecurringEventActionCode,
): CreateRecurringEventActionField {
  if (code === "invalid_amount") {
    return "amountTwd";
  }

  if (
    code === "missing_category" ||
    code === "archived_category" ||
    code === "category_type_mismatch"
  ) {
    return "categoryId";
  }

  if (code === "missing_source_member") {
    return "sourceMemberId";
  }

  if (
    code === "missing_payer_member" ||
    code === "fund_paid_expense_cannot_have_member_payer"
  ) {
    return "payerMemberId";
  }

  if (code === "invalid_payment_source") {
    return "paymentSource";
  }

  if (code === "invalid_posting_mode") {
    return "postingMode";
  }

  if (code === "invalid_record_type") {
    return "recordType";
  }

  if (code === "invalid_schedule_day") {
    return "recurrenceDay";
  }

  if (code === "invalid_recurrence_schedule") {
    return "recurrenceSchedule";
  }

  return "name";
}
