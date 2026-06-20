"use server";

import { revalidatePath } from "next/cache";
import {
  actionError,
  actionSuccess,
  type ActionState,
} from "@/app/action-state";
import { requireAuthenticatedMember } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import {
  createLedgerRecordInDatabase,
  updateLedgerRecordInDatabase,
  voidLedgerRecordInDatabase,
  type LedgerRecordMutationPrismaClient,
} from "@/modules/fund-ledger/ledger-record-command";
import {
  parseCreateLedgerRecordForm,
  parseUpdateLedgerRecordForm,
  parseVoidLedgerRecordForm,
} from "./ledger-record-form";

export type CreateLedgerRecordActionCode =
  | "archived_category"
  | "category_type_mismatch"
  | "fund_paid_expense_cannot_have_member_payer"
  | "invalid_amount"
  | "invalid_date"
  | "invalid_payment_source"
  | "invalid_record_type"
  | "missing_category"
  | "missing_member_payer"
  | "missing_name"
  | "missing_payer_member"
  | "missing_source_member"
  | "permission_denied";

export type CreateLedgerRecordActionField =
  | "amountTwd"
  | "categoryId"
  | "name"
  | "occurredOn"
  | "payerMemberId"
  | "paymentSource"
  | "recordType"
  | "sourceMemberId";

export type UpdateLedgerRecordActionCode =
  | CreateLedgerRecordActionCode
  | "missing_record_id"
  | "record_not_found"
  | "record_voided"
  | "reimbursed_expense_blocked"
  | "missing_income_source_member";

export type UpdateLedgerRecordActionField =
  | CreateLedgerRecordActionField
  | "recordId"
  | "note";

export type VoidLedgerRecordActionCode =
  | "missing_record_id"
  | "permission_denied"
  | "record_not_found"
  | "record_voided"
  | "reimbursed_expense_blocked";

export type VoidLedgerRecordActionField = "recordId";

export type CreateLedgerRecordActionState = ActionState<
  { recordId: string },
  CreateLedgerRecordActionField,
  CreateLedgerRecordActionCode
>;

export type UpdateLedgerRecordActionState = ActionState<
  { recordId: string },
  UpdateLedgerRecordActionField,
  UpdateLedgerRecordActionCode
>;

export type VoidLedgerRecordActionState = ActionState<
  { recordId: string },
  VoidLedgerRecordActionField,
  VoidLedgerRecordActionCode
>;

export async function createLedgerRecordAction(
  _previousState: CreateLedgerRecordActionState,
  formData: FormData,
): Promise<CreateLedgerRecordActionState> {
  const parsed = parseCreateLedgerRecordForm(formData);

  if (!parsed.ok) {
    return createLedgerRecordError(parsed.reason);
  }

  const session = await requireAuthenticatedMember();

  const result = await createLedgerRecordInDatabase(
    session.access.member,
    parsed.command,
    {
      prisma: getPrismaClient(),
    },
  );

  if (!result.ok) {
    return createLedgerRecordError(result.reason);
  }

  revalidatePath("/");
  revalidatePath("/reimbursements");
  return actionSuccess("紀錄已新增。", {
    recordId: result.record.id,
  });
}

export async function updateLedgerRecordAction(
  _previousState: UpdateLedgerRecordActionState,
  formData: FormData,
): Promise<UpdateLedgerRecordActionState> {
  const parsed = parseUpdateLedgerRecordForm(formData);

  if (!parsed.ok) {
    return updateLedgerRecordError(parsed.reason);
  }

  const session = await requireAuthenticatedMember();
  const result = await updateLedgerRecordInDatabase(
    session.access.member,
    parsed.command,
    {
      prisma: getPrismaClient() as unknown as LedgerRecordMutationPrismaClient,
    },
  );

  if (!result.ok) {
    return updateLedgerRecordError(result.reason);
  }

  revalidatePath("/");
  revalidatePath("/reimbursements");
  return actionSuccess("紀錄已更新。", {
    recordId: result.record.id,
  });
}

export async function voidLedgerRecordAction(
  _previousState: VoidLedgerRecordActionState,
  formData: FormData,
): Promise<VoidLedgerRecordActionState> {
  const parsed = parseVoidLedgerRecordForm(formData);

  if (!parsed.ok) {
    return voidLedgerRecordError(parsed.reason);
  }

  const session = await requireAuthenticatedMember();
  const result = await voidLedgerRecordInDatabase(
    session.access.member,
    parsed.command,
    {
      prisma: getPrismaClient() as unknown as LedgerRecordMutationPrismaClient,
    },
  );

  if (!result.ok) {
    return voidLedgerRecordError(result.reason as VoidLedgerRecordActionCode);
  }

  revalidatePath("/");
  revalidatePath("/reimbursements");
  return actionSuccess("紀錄已刪除。", {
    recordId: result.record.id,
  });
}

function createLedgerRecordError(
  code: CreateLedgerRecordActionCode,
): CreateLedgerRecordActionState {
  const messages: Record<CreateLedgerRecordActionCode, string> = {
    archived_category: "這個分類已封存，請改選其他分類。",
    category_type_mismatch: "分類類型與紀錄類型不一致。",
    fund_paid_expense_cannot_have_member_payer: "基金支出不能指定代墊成員。",
    invalid_amount: "金額格式不正確，請輸入大於 0 的金額。",
    invalid_date: "日期格式不正確。",
    invalid_payment_source: "支出類型不正確。",
    invalid_record_type: "紀錄類型不正確。",
    missing_category: "請選擇分類。",
    missing_member_payer: "請選擇代墊成員。",
    missing_name: "請輸入紀錄名稱。",
    missing_payer_member: "請選擇代墊成員。",
    missing_source_member: "請選擇收入來源。",
    permission_denied: "目前帳號沒有新增這筆紀錄的權限。",
  };

  return actionError(messages[code], {
    code,
    fieldErrors: { [fieldForError(code)]: [messages[code]] },
  });
}

function updateLedgerRecordError(
  code: UpdateLedgerRecordActionCode,
): UpdateLedgerRecordActionState {
  const messages: Record<UpdateLedgerRecordActionCode, string> = {
    archived_category: "這個分類已封存，請改選其他分類。",
    category_type_mismatch: "分類類型與紀錄類型不一致。",
    fund_paid_expense_cannot_have_member_payer: "基金支出不能指定代墊成員。",
    invalid_amount: "金額格式不正確，請輸入大於 0 的金額。",
    invalid_date: "日期格式不正確。",
    invalid_payment_source: "支出類型不正確。",
    invalid_record_type: "紀錄類型不正確。",
    missing_category: "請選擇分類。",
    missing_income_source_member: "請選擇收入來源。",
    missing_member_payer: "請選擇代墊成員。",
    missing_name: "請輸入紀錄名稱。",
    missing_payer_member: "請選擇代墊成員。",
    missing_record_id: "找不到要修改的紀錄。",
    missing_source_member: "請選擇收入來源。",
    permission_denied: "目前帳號沒有修改這筆紀錄的權限。",
    record_not_found: "找不到這筆紀錄，可能已被更新或刪除。",
    record_voided: "這筆紀錄已刪除，無法再次修改。",
    reimbursed_expense_blocked:
      "這筆代墊支出已退款，需先有退款沖銷流程才能編輯或刪除。",
  };

  return actionError(messages[code], {
    code,
    fieldErrors: { [fieldForUpdateError(code)]: [messages[code]] },
  });
}

function voidLedgerRecordError(
  code: VoidLedgerRecordActionCode,
): VoidLedgerRecordActionState {
  const messages: Record<VoidLedgerRecordActionCode, string> = {
    missing_record_id: "找不到要刪除的紀錄。",
    permission_denied: "目前帳號沒有刪除這筆紀錄的權限。",
    record_not_found: "找不到這筆紀錄，可能已被更新或刪除。",
    record_voided: "這筆紀錄已刪除，無法再次修改。",
    reimbursed_expense_blocked:
      "這筆代墊支出已退款，需先有退款沖銷流程才能編輯或刪除。",
  };

  return actionError(messages[code], {
    code,
    fieldErrors: { recordId: [messages[code]] },
  });
}

function fieldForError(
  code: CreateLedgerRecordActionCode,
): CreateLedgerRecordActionField {
  const fields: Record<CreateLedgerRecordActionCode, CreateLedgerRecordActionField> = {
    archived_category: "categoryId",
    category_type_mismatch: "categoryId",
    fund_paid_expense_cannot_have_member_payer: "payerMemberId",
    invalid_amount: "amountTwd",
    invalid_date: "occurredOn",
    invalid_payment_source: "paymentSource",
    invalid_record_type: "recordType",
    missing_category: "categoryId",
    missing_member_payer: "payerMemberId",
    missing_name: "name",
    missing_payer_member: "payerMemberId",
    missing_source_member: "sourceMemberId",
    permission_denied: "recordType",
  };

  return fields[code];
}

function fieldForUpdateError(
  code: UpdateLedgerRecordActionCode,
): UpdateLedgerRecordActionField {
  if (
    code === "missing_record_id" ||
    code === "record_not_found" ||
    code === "record_voided" ||
    code === "reimbursed_expense_blocked"
  ) {
    return "recordId";
  }

  if (code === "missing_income_source_member") {
    return "sourceMemberId";
  }

  return fieldForError(code);
}
