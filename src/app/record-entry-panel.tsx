"use client";

import {
  useActionState,
  useCallback,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  CategoryVisualMark,
  compareCategoryVisualOrder,
  getCategoryVisual,
} from "@/app/category-visuals";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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

type Category = RecordCreateData["categories"][number];
type Member = RecordCreateData["members"][number];
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
}: {
  canSelectOthers: boolean;
  categories: RecordCreateData["categories"];
  close: () => void;
  initialMode: RecordCreateMode | null;
  members: RecordCreateData["members"];
  profile: Profile;
  onRecordCreated: () => void;
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
      submitLabel="新增"
    >
      <CategoryField categories={activeCategories} />
      <AmountField />
      <NameField
        placeholder={
          recordType === RECORD_ENTRY_MODE.income ? "例如 六月房租" : "例如 晚餐食材"
        }
      />
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <MemberSelectField
          canSelectOthers={canSelectOthers}
          defaultMemberId={profile.id}
          disabledDisplayValue={
            entryKind === RECORD_ENTRY_KIND.fundExpense ? "基金" : undefined
          }
          label={memberFieldLabel}
          members={activeMembers}
          name={memberFieldName}
        />
        <DateField />
      </div>
      <NoteField />
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

  useActionStateEffect(
    actionState,
    useCallback((handledState) => {
      if (handledState.status === "success") {
        onRecordCreated();
      }
    }, [onRecordCreated]),
  );

  return (
    <section
      aria-label="新增紀錄表單"
      className="flex min-h-0 flex-1 flex-col scroll-mt-32"
    >
      {feedbackMessage ? (
        <Alert
          className="mb-3 shrink-0"
          role={feedbackMessage.tone === "error" ? "alert" : "status"}
          variant={feedbackMessage.tone === "success" ? "default" : "destructive"}
        >
          <AlertDescription>{feedbackMessage.message}</AlertDescription>
        </Alert>
      ) : null}

      <form action={formAction} className="flex min-h-0 flex-1 flex-col">
        <input name="recordType" type="hidden" value={recordType} />
        <input name="paymentSource" type="hidden" value={paymentSource} />
        <DialogBody>
          <FieldGroup>
          <RecordKindTabs
            entryKind={entryKind}
            onEntryKindChange={onEntryKindChange}
          />
          {children}
          </FieldGroup>
        </DialogBody>
        <DialogFooter className="mt-4">
          <Button
            onClick={close}
            type="button"
            variant="secondary"
          >
            取消
          </Button>
          <Button
            disabled={!hasCategories || isPending}
            type="submit"
          >
            <span>{isPending ? "新增中..." : submitLabel}</span>
          </Button>
        </DialogFooter>
      </form>
    </section>
  );
}

function RecordKindTabs({
  entryKind,
  onEntryKindChange,
}: {
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
        <TabsTrigger value={RECORD_ENTRY_KIND.memberExpense}>
          成員支出
        </TabsTrigger>
        <TabsTrigger value={RECORD_ENTRY_KIND.income}>
          收入
        </TabsTrigger>
        <TabsTrigger value={RECORD_ENTRY_KIND.fundExpense}>
          基金支出
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function DateField() {
  return (
    <Field>
      <FieldLabel>日期</FieldLabel>
      <Input
        defaultValue={formatDateInputValue()}
        name="occurredOn"
        required
        type="date"
      />
    </Field>
  );
}

function CategoryField({ categories }: { categories: Category[] }) {
  const orderedCategories = [...categories].sort(compareCategoryVisualOrder);

  return (
    <Field>
      {categories.length === 0 ? (
        <p className="text-caption text-muted-foreground">
          尚未建立可用分類。
        </p>
      ) : (
        <div
          aria-label="分類"
          className="flex gap-3 overflow-x-auto px-1 pb-3 pt-1 sm:grid sm:grid-cols-5 sm:gap-x-4 sm:gap-y-5 sm:overflow-visible sm:px-1 sm:pb-3 sm:pt-1"
          role="radiogroup"
        >
        {orderedCategories.map((category) => {
          const visual = getCategoryVisual(category);

          return (
          <label
            className="group grid w-18 shrink-0 cursor-pointer justify-items-center gap-2 text-center sm:w-auto"
            key={category.id}
          >
            <input
              className="peer sr-only"
              name="categoryId"
              required
              type="radio"
              value={category.id}
            />
            <CategoryVisualMark
              className="transition group-hover:scale-105 peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 peer-checked:ring-4 peer-checked:ring-white"
              color={visual.color}
              icon={visual.icon}
              size="lg"
            />
            <span className="max-w-full truncate text-label text-muted-foreground peer-checked:text-foreground">
              {category.name}
            </span>
          </label>
          );
        })}
        </div>
      )}
    </Field>
  );
}

function MemberSelectField({
  canSelectOthers,
  defaultMemberId,
  disabledDisplayValue,
  label,
  members,
  name,
}: {
  canSelectOthers: boolean;
  defaultMemberId: string;
  disabledDisplayValue?: string;
  label: string;
  members: Member[];
  name: "payerMemberId" | "sourceMemberId";
}) {
  if (disabledDisplayValue) {
    return (
      <Field>
        <FieldLabel>{label}</FieldLabel>
        <Input disabled value={disabledDisplayValue} />
      </Field>
    );
  }

  return (
    <Field>
      {!canSelectOthers ? (
        <input name={name} type="hidden" value={defaultMemberId} />
      ) : null}
      <FieldLabel>{label}</FieldLabel>
      <NativeSelect
        aria-label={label}
        defaultValue={defaultMemberId}
        disabled={!canSelectOthers}
        name={name}
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

function AmountField() {
  return (
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
  );
}

function NameField({ placeholder }: { placeholder: string }) {
  return (
    <Field>
      <FieldLabel>名稱</FieldLabel>
      <Input name="name" placeholder={placeholder} required type="text" />
    </Field>
  );
}

function NoteField() {
  return (
    <Field>
      <FieldLabel>備註</FieldLabel>
      <Input name="note" placeholder="可留空" type="text" />
    </Field>
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

function formatDateInputValue(date = new Date()) {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 10);
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
