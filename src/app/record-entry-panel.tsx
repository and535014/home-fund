"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { createLedgerRecordAction } from "./ledger-record-actions";
import type { HomeDashboardData } from "./home-dashboard-data-source";
import type { HomeDashboardView } from "./home-access";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type RecordEntryKind = "income" | "fund_expense" | "member_expense";
type RecordEntryMode = "income" | "expense";

export function RecordEntryPanel({
  canCreateRecordsForOthers,
  categories,
  feedback,
  members,
  mode,
  month,
  profile,
}: {
  canCreateRecordsForOthers: boolean;
  categories: HomeDashboardData["categories"];
  feedback: string | undefined;
  members: HomeDashboardData["householdMembers"];
  mode: RecordEntryMode;
  month: string;
  profile: HomeDashboardView["profile"];
}) {
  const [entryKind, setEntryKind] = useState<RecordEntryKind>(
    mode === "income" ? "income" : "member_expense",
  );
  const [categoryId, setCategoryId] = useState("");
  const activeMembers = members.filter((member) => member.status === "active");
  const activeCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.status === "active" &&
          category.type === (entryKind === "income" ? "income" : "expense"),
      ),
    [categories, entryKind],
  );
  const defaultOccurredOn = `${month}-01`;
  const feedbackMessage = createRecordFeedbackMessage(feedback);
  const isIncome = mode === "income";
  const isMemberPaidExpense = entryKind === "member_expense";
  const hasCategories = activeCategories.length > 0;

  function handleEntryKindChange(value: string) {
    setEntryKind(value as RecordEntryKind);
    setCategoryId("");
  }

  return (
    <section aria-label="新增紀錄表單" className="scroll-mt-32">
      {feedbackMessage ? (
        <Alert
          className="mb-3"
          role={feedbackMessage.tone === "error" ? "alert" : "status"}
          variant={feedbackMessage.tone === "success" ? "default" : "destructive"}
        >
          <AlertDescription>{feedbackMessage.message}</AlertDescription>
        </Alert>
      ) : null}

      <form action={createLedgerRecordAction}>
            <input name="month" type="hidden" value={month} />
            <input name="createIntent" type="hidden" value={mode} />
            <input
              name="recordType"
              type="hidden"
              value={isIncome ? "income" : "expense"}
            />
            {!isIncome ? (
              <input
                name="paymentSource"
                type="hidden"
                value={isMemberPaidExpense ? "member" : "fund"}
              />
            ) : null}

            <FieldGroup>
              <input name="entryKind" type="hidden" value={entryKind} />
              {mode === "expense" ? (
                <Field>
                  <FieldLabel>支出類型</FieldLabel>
                  <Select onValueChange={handleEntryKindChange} value={entryKind}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="member_expense">成員代墊</SelectItem>
                      <SelectItem value="fund_expense">基金支出</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}

              <Field>
                <FieldLabel>名稱</FieldLabel>
                <Input
                  name="name"
                  placeholder={mode === "income" ? "例如 六月房租" : "例如 晚餐食材"}
                  required
                  type="text"
                />
              </Field>

              <Field>
                <FieldLabel>金額</FieldLabel>
                <Input
                  inputMode="decimal"
                  min="1"
                  name="amountTwd"
                  placeholder="例如 1200"
                  required
                  step="0.01"
                  type="number"
                />
              </Field>

              <Field>
                <FieldLabel>日期</FieldLabel>
                <Input
                  defaultValue={defaultOccurredOn}
                  name="occurredOn"
                  required
                  type="date"
                />
              </Field>

              <Field>
                <FieldLabel>分類</FieldLabel>
                <input name="categoryId" type="hidden" value={categoryId} />
                <Select
                  disabled={!hasCategories}
                  onValueChange={setCategoryId}
                  value={categoryId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="選擇分類" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              {isIncome ? (
                <MemberSelectField
                  canSelectOthers={canCreateRecordsForOthers}
                  fieldName="sourceMemberId"
                  label="收入來源"
                  members={activeMembers}
                  profile={profile}
                />
              ) : null}

              {isMemberPaidExpense ? (
                <MemberSelectField
                  canSelectOthers={canCreateRecordsForOthers}
                  fieldName="payerMemberId"
                  label="代墊成員"
                  members={activeMembers}
                  profile={profile}
                />
              ) : null}

              <Field>
                <FieldLabel>備註</FieldLabel>
                <Input name="note" placeholder="可留空" type="text" />
              </Field>

              <Button className="mt-1 w-full" disabled={!hasCategories} type="submit">
                <Plus aria-hidden="true" size={18} />
                <span>{mode === "income" ? "新增收入" : "新增支出"}</span>
              </Button>
            </FieldGroup>
      </form>
    </section>
  );
}

function MemberSelectField({
  canSelectOthers,
  fieldName,
  label,
  members,
  profile,
}: {
  canSelectOthers: boolean;
  fieldName: "sourceMemberId" | "payerMemberId";
  label: string;
  members: HomeDashboardData["householdMembers"];
  profile: HomeDashboardView["profile"];
}) {
  if (!canSelectOthers) {
    return (
      <>
        <input name={fieldName} type="hidden" value={profile.id} />
        <Field>
          <FieldLabel>{label}</FieldLabel>
          <FieldContent>
            <p className="flex h-10 items-center rounded-input border border-input bg-secondary px-3 text-body text-foreground">
              {profile.displayName}
            </p>
          </FieldContent>
        </Field>
      </>
    );
  }

  return (
    <MemberSelectInput
      fieldName={fieldName}
      label={label}
      members={members}
      profileId={profile.id}
    />
  );
}

function MemberSelectInput({
  fieldName,
  label,
  members,
  profileId,
}: {
  fieldName: "sourceMemberId" | "payerMemberId";
  label: string;
  members: HomeDashboardData["householdMembers"];
  profileId: string;
}) {
  const [selectedMemberId, setSelectedMemberId] = useState(profileId);

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <input name={fieldName} type="hidden" value={selectedMemberId} />
      <Select onValueChange={setSelectedMemberId} value={selectedMemberId}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {members.map((member) => (
            <SelectItem key={member.id} value={member.id}>
              {member.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

function createRecordFeedbackMessage(
  result: string | undefined,
): { tone: "success" | "error"; message: string } | undefined {
  if (!result) {
    return undefined;
  }

  if (result === "success") {
    return {
      tone: "success",
      message: "紀錄已新增。",
    };
  }

  const messages: Record<string, string> = {
    archived_category: "這個分類已封存，請改選其他分類。",
    category_type_mismatch: "分類類型與紀錄類型不一致。",
    fund_paid_expense_cannot_have_member_payer: "基金支出不能指定代墊成員。",
    invalid_amount: "金額格式不正確，請輸入大於 0 的金額。",
    invalid_date: "日期格式不正確。",
    missing_category: "請選擇分類。",
    missing_name: "請輸入紀錄名稱。",
    missing_member_payer: "請選擇代墊成員。",
    missing_payer_member: "請選擇代墊成員。",
    missing_source_member: "請選擇收入來源。",
    permission_denied: "目前帳號沒有新增這筆紀錄的權限。",
  };

  return {
    tone: "error",
    message: messages[result] ?? "紀錄新增失敗，請確認欄位後再試一次。",
  };
}
