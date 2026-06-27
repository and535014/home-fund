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
import { Field, FieldLabel } from "@/components/ui/field";
import { NativeSelect } from "@/components/ui/native-select";
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
type RecurrenceSchedule = "fixed_day" | "month_end" | "none";

export function RecordEntryPanel() {
  const {
    canCreateRecordsForOthers,
    categories,
    close,
    members,
    mode,
    onRecurringEventCreated,
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
      onRecurringEventCreated={onRecurringEventCreated}
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
  onRecurringEventCreated,
  profile,
  onRecordCreated,
  setCreatePending,
}: {
  canSelectOthers: boolean;
  categories: RecordCreateData["categories"];
  close: () => void;
  initialMode: RecordCreateMode | null;
  members: RecordCreateData["members"];
  onRecurringEventCreated: () => void;
  profile: Profile;
  onRecordCreated: () => void;
  setCreatePending: (pending: boolean) => void;
}) {
  const [entryKind, setEntryKind] = useState<RecordEntryKind>(
    initialMode === RECORD_ENTRY_MODE.income
      ? RECORD_ENTRY_KIND.income
      : RECORD_ENTRY_KIND.memberExpense,
  );
  const [recurrenceSchedule, setRecurrenceSchedule] =
    useState<RecurrenceSchedule>("none");
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

  return (
    <RecordEntryFormShell
      entryKind={entryKind}
      close={close}
      hasCategories={activeCategories.length > 0}
      onRecordCreated={onRecordCreated}
      onRecurringEventCreated={onRecurringEventCreated}
      onEntryKindChange={setEntryKind}
      paymentSource={paymentSource}
      recurrenceSchedule={recurrenceSchedule}
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
          members={members}
          name={memberFieldName}
        />
        <RecurrenceScheduleField
          recurrenceSchedule={recurrenceSchedule}
          onRecurrenceScheduleChange={setRecurrenceSchedule}
        />
      </div>
      {recurrenceSchedule === "none" ? (
        <LedgerRecordDateField />
      ) : (
        <RecurringEventFields recurrenceSchedule={recurrenceSchedule} />
      )}
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
  onRecurringEventCreated,
  paymentSource,
  recurrenceSchedule,
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
  onRecurringEventCreated: () => void;
  paymentSource: PaymentSource;
  recurrenceSchedule: RecurrenceSchedule;
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

  function submitAction(formData: FormData) {
    if (formData.get("recurrenceSchedule") !== "none") {
      onRecurringEventCreated();
      return;
    }

    formAction(formData);
  }

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
      action={submitAction}
      feedbackMessage={feedbackMessage}
      hiddenFields={
        <>
          <input name="recordType" type="hidden" value={recordType} />
          <input name="paymentSource" type="hidden" value={paymentSource} />
          <input
            name="recurrenceSchedule"
            type="hidden"
            value={recurrenceSchedule}
          />
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

function RecurrenceScheduleField({
  onRecurrenceScheduleChange,
  recurrenceSchedule,
}: {
  onRecurrenceScheduleChange: (schedule: RecurrenceSchedule) => void;
  recurrenceSchedule: RecurrenceSchedule;
}) {
  return (
    <Field>
      <FieldLabel htmlFor="record-recurrence">重複</FieldLabel>
      <NativeSelect
        id="record-recurrence"
        onChange={(event) =>
          onRecurrenceScheduleChange(event.currentTarget.value as RecurrenceSchedule)
        }
        value={recurrenceSchedule}
      >
        <option value="none">不重複</option>
        <option value="fixed_day">每月固定日</option>
        <option value="month_end">每月月底</option>
      </NativeSelect>
    </Field>
  );
}

function RecurringEventFields({
  recurrenceSchedule,
}: {
  recurrenceSchedule: RecurrenceSchedule;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {recurrenceSchedule === "fixed_day" ? (
        <Field>
          <FieldLabel htmlFor="recurring-schedule-day">指定日期</FieldLabel>
          <NativeSelect
            defaultValue="1"
            id="recurring-schedule-day"
            name="recurrenceDay"
            required
          >
            {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => (
              <option key={day} value={String(day)}>
                {day} 號
              </option>
            ))}
          </NativeSelect>
        </Field>
      ) : (
        <Field>
          <FieldLabel>指定日期</FieldLabel>
          <div className="flex min-h-10.5 items-center rounded-input border border-border bg-muted/25 px-3 text-body text-muted-foreground">
            每月底
          </div>
        </Field>
      )}

      <Field>
        <FieldLabel htmlFor="recurring-posting-mode">入帳模式</FieldLabel>
        <NativeSelect
          defaultValue="reminder"
          id="recurring-posting-mode"
          name="postingMode"
          required
        >
          <option value="immediate">馬上入帳</option>
          <option value="reminder">提醒入帳</option>
        </NativeSelect>
      </Field>
    </div>
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
