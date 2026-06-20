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
} from "@/modules/fund-ledger/ledger-record-command";
import { parseCreateLedgerRecordForm } from "./ledger-record-form";

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

export type CreateLedgerRecordActionState = ActionState<
  { recordId: string },
  CreateLedgerRecordActionField,
  CreateLedgerRecordActionCode
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
