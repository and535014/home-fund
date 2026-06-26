"use client";

import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initialActionState } from "./action-state";
import {
  createLedgerRecordAction,
  type CreateLedgerRecordActionCode,
  type CreateLedgerRecordActionField,
  type CreateLedgerRecordActionState,
} from "./ledger-record-actions";
import {
  useRecordCreate,
  type RecordCreateData,
  type RecordCreateMode,
} from "./record-create-context";
import { Button } from "@/components/ui/button";
import {
  LedgerRecordAmountNameFields,
  LedgerRecordCancelButton,
  LedgerRecordCategoryField,
  LedgerRecordDateField,
  LedgerRecordFormShell,
  LedgerRecordMemberSelectField,
  LedgerRecordNoteField,
} from "./ledger-record-form-fields";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useActionStateEffect } from "./use-action-state-effect";

const RECORD_ENTRY_MODE = {
  expense: "expense",
  income: "income",
} as const;

type RecordEntryMode =
  (typeof RECORD_ENTRY_MODE)[keyof typeof RECORD_ENTRY_MODE] &
    RecordCreateMode;

const PAYMENT_SOURCE = {
  fund: "fund",
  member: "member",
} as const;

type PaymentSource = (typeof PAYMENT_SOURCE)[keyof typeof PAYMENT_SOURCE];

const RECORD_ENTRY_KIND = {
  fundExpense: "fund-expense",
  income: "income",
  memberExpense: "member-expense",
} as const;

type RecordEntryKind =
  (typeof RECORD_ENTRY_KIND)[keyof typeof RECORD_ENTRY_KIND];

type Profile = RecordCreateData["profile"];

export function RecordEntryPanel() {
  const {
    canCreateRecordsForOthers,
    categories,
    close,
    members,
    mode,
    profile,
    onRecordCreated,
    setCreatePending,
  } = useRecordCreate();

  return (
    <RecordEntryForm
      canSelectOthers={canCreateRecordsForOthers}
      categories={categories}
      close={close}
      initialMode={mode}
      members={members}
      profile={profile}
      onRecordCreated={onRecordCreated}
      setCreatePending={setCreatePending}
    />
  );
}

function RecordEntryForm({
  canSelectOthers,
  categories,
  close,
  initialMode,
  members,
  profile,
  onRecordCreated,
  setCreatePending,
}: {
  canSelectOthers: boolean;
  categories: RecordCreateData["categories"];
  close: () => void;
  initialMode: RecordCreateMode | null;
  members: RecordCreateData["members"];
  profile: Profile;
  onRecordCreated: () => void;
  setCreatePending: (pending: boolean) => void;
}) {
  const [entryKind, setEntryKind] = useState<RecordEntryKind>(
    initialMode === RECORD_ENTRY_MODE.income
      ? RECORD_ENTRY_KIND.income
      : RECORD_ENTRY_KIND.memberExpense,
  );
  const recordType = entryKind === RECORD_ENTRY_KIND.income
    ? RECORD_ENTRY_MODE.income
    : RECORD_ENTRY_MODE.expense;
  const paymentSource = entryKind === RECORD_ENTRY_KIND.fundExpense
    ? PAYMENT_SOURCE.fund
    : PAYMENT_SOURCE.member;
  const memberFieldName = recordType === RECORD_ENTRY_MODE.income
    ? "sourceMemberId"
    : "payerMemberId";
  const memberFieldLabel = "支付者";
  const activeCategories = useActiveCategories(
    categories,
    recordType,
  );
  const activeMembers = useActiveMembers(members);

  return (
    <RecordEntryFormShell
      entryKind={entryKind}
      close={close}
      hasCategories={activeCategories.length > 0}
      onRecordCreated={onRecordCreated}
      onEntryKindChange={setEntryKind}
      paymentSource={paymentSource}
      recordType={recordType}
      setCreatePending={setCreatePending}
      submitLabel="新增"
    >
      <LedgerRecordCategoryField categories={activeCategories} />
      <LedgerRecordAmountNameFields
        namePlaceholder={
          recordType === RECORD_ENTRY_MODE.income ? "例如 六月房租" : "例如 晚餐食材"
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <LedgerRecordMemberSelectField
          canSelectOthers={canSelectOthers}
          defaultMemberId={profile.id}
          disabledDisplayValue={
            entryKind === RECORD_ENTRY_KIND.fundExpense ? "基金" : undefined
          }
          label={memberFieldLabel}
          members={activeMembers}
          name={memberFieldName}
        />
        <LedgerRecordDateField />
      </div>
      <LedgerRecordNoteField />
    </RecordEntryFormShell>
  );
}

function RecordEntryFormShell({
  children,
  close,
  entryKind,
  hasCategories,
  onEntryKindChange,
  onRecordCreated,
  paymentSource,
  recordType,
  setCreatePending,
  submitLabel,
}: {
  children: ReactNode;
  close: () => void;
  entryKind: RecordEntryKind;
  hasCategories: boolean;
  onEntryKindChange: (entryKind: RecordEntryKind) => void;
  onRecordCreated: () => void;
  paymentSource: PaymentSource;
  recordType: RecordEntryMode;
  setCreatePending: (pending: boolean) => void;
  submitLabel: string;
}) {
  const [actionState, formAction, isPending] = useActionState(
    createLedgerRecordAction,
    initialActionState<
      { recordId: string },
      CreateLedgerRecordActionField,
      CreateLedgerRecordActionCode
    >(),
  );
  const feedbackMessage = createRecordFeedbackMessage(actionState);

  useEffect(() => {
    setCreatePending(isPending);

    return () => setCreatePending(false);
  }, [isPending, setCreatePending]);

  useActionStateEffect(
    actionState,
    useCallback((handledState) => {
      if (handledState.status === "success") {
        onRecordCreated();
      }
    }, [onRecordCreated]),
  );

  return (
    <LedgerRecordFormShell
      ariaLabel="新增紀錄表單"
      action={formAction}
      feedbackMessage={feedbackMessage}
      hiddenFields={
        <>
          <input name="recordType" type="hidden" value={recordType} />
          <input name="paymentSource" type="hidden" value={paymentSource} />
        </>
      }
      isPending={isPending}
      footer={
        <>
          <LedgerRecordCancelButton disabled={isPending} onClick={close} />
          <Button disabled={!hasCategories || isPending} type="submit">
            <span>{isPending ? "新增中..." : submitLabel}</span>
          </Button>
        </>
      }
    >
      <RecordKindTabs
        disabled={isPending}
        entryKind={entryKind}
        onEntryKindChange={onEntryKindChange}
      />
      {children}
    </LedgerRecordFormShell>
  );
}

function RecordKindTabs({
  disabled = false,
  entryKind,
  onEntryKindChange,
}: {
  disabled?: boolean;
  entryKind: RecordEntryKind;
  onEntryKindChange: (entryKind: RecordEntryKind) => void;
}) {
  return (
    <Tabs
      className="gap-0"
      onValueChange={(nextValue) => onEntryKindChange(nextValue as RecordEntryKind)}
      value={entryKind}
    >
      <TabsList
        aria-label="紀錄類型"
        className="w-full"
        variant="line"
      >
        <TabsTrigger disabled={disabled} value={RECORD_ENTRY_KIND.memberExpense}>
          成員支出
        </TabsTrigger>
        <TabsTrigger disabled={disabled} value={RECORD_ENTRY_KIND.income}>
          收入
        </TabsTrigger>
        <TabsTrigger disabled={disabled} value={RECORD_ENTRY_KIND.fundExpense}>
          基金支出
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function useActiveCategories(
  categories: RecordCreateData["categories"],
  type: RecordEntryMode,
) {
  return useMemo(
    () =>
      categories.filter(
        (category) => category.status === "active" && category.type === type,
      ),
    [categories, type],
  );
}

function useActiveMembers(members: RecordCreateData["members"]) {
  return useMemo(
    () => members.filter((member) => member.status === "active"),
    [members],
  );
}

function createRecordFeedbackMessage(
  result: CreateLedgerRecordActionState,
): { tone: "success" | "error"; message: string } | undefined {
  if (result.status === "idle" || !result.message) {
    return undefined;
  }

  return {
    tone: result.status === "success" ? "success" : "error",
    message: result.message,
  };
}
