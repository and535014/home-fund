"use client";

import { Plus } from "lucide-react";
import { useActionState, useEffect, useMemo, useState } from "react";
import { initialActionState } from "./action-state";
import {
  createLedgerRecordAction,
  type CreateLedgerRecordActionCode,
  type CreateLedgerRecordActionField,
} from "./ledger-record-actions";
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
import { cn } from "@/lib/utils";

type RecordEntryKind = "income" | "fund_expense" | "member_expense";
type RecordEntryMode = "income" | "expense";

export function RecordEntryPanel({
  canCreateRecordsForOthers,
  categories,
  members,
  mode,
  month,
  onSuccess,
  profile,
  returnTo,
}: {
  canCreateRecordsForOthers: boolean;
  categories: HomeDashboardData["categories"];
  members: HomeDashboardData["householdMembers"];
  mode: RecordEntryMode;
  month: string;
  onSuccess: () => void;
  profile: HomeDashboardView["profile"];
  returnTo: string;
}) {
  const [actionState, formAction, isPending] = useActionState(
    createLedgerRecordAction,
    initialActionState<
      { month: string; recordId: string },
      CreateLedgerRecordActionField,
      CreateLedgerRecordActionCode
    >(),
  );
  const [entryKind, setEntryKind] = useState<RecordEntryKind>(
    mode === "income" ? "income" : "member_expense",
  );
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
  const feedbackMessage = createRecordFeedbackMessage(actionState);
  const isIncome = mode === "income";
  const isMemberPaidExpense = entryKind === "member_expense";
  const hasCategories = activeCategories.length > 0;

  useEffect(() => {
    if (actionState.status === "success") {
      onSuccess();
    }
  }, [actionState.status, onSuccess]);

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

      <form action={formAction}>
        <input name="month" type="hidden" value={month} />
        <input name="createIntent" type="hidden" value={mode} />
        <input name="returnTo" type="hidden" value={returnTo} />
        <input
          name="recordType"
          type="hidden"
          value={isIncome ? "income" : "expense"}
        />

        <FieldGroup>
          <input name="entryKind" type="hidden" value={entryKind} />
          {mode === "expense" ? (
            <Field>
              <FieldLabel>支出類型</FieldLabel>
              <NativeSelect
                aria-label="支出類型"
                onChange={(event) =>
                  setEntryKind(
                    event.currentTarget.value === "fund"
                      ? "fund_expense"
                      : "member_expense",
                  )
                }
                name="paymentSource"
                value={isMemberPaidExpense ? "member" : "fund"}
              >
                <option value="member">成員代墊</option>
                <option value="fund">基金支出</option>
              </NativeSelect>
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
            <NativeSelect
              aria-label="分類"
              disabled={!hasCategories}
              key={entryKind}
              name="categoryId"
            >
              <option value="">選擇分類</option>
              {activeCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </NativeSelect>
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

          <Button
            className="mt-1 w-full"
            disabled={!hasCategories || isPending}
            type="submit"
          >
            <Plus aria-hidden="true" size={18} />
            <span>
              {isPending
                ? "新增中..."
                : mode === "income"
                  ? "新增收入"
                  : "新增支出"}
            </span>
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
  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <NativeSelect
        aria-label={label}
        defaultValue={profileId}
        name={fieldName}
        required
      >
        {members.map((member) => (
          <option key={member.id} value={member.id}>
            {member.displayName}
          </option>
        ))}
      </NativeSelect>
    </Field>
  );
}

function NativeSelect({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-input border border-input bg-background px-3 py-2 text-body text-foreground outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

function createRecordFeedbackMessage(
  result: ReturnType<typeof initialActionState> & { message?: string },
): { tone: "success" | "error"; message: string } | undefined {
  if (result.status === "idle" || !result.message) {
    return undefined;
  }

  return {
    tone: result.status === "success" ? "success" : "error",
    message: result.message,
  };
}
