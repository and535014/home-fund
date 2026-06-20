"use client";

import { Plus } from "lucide-react";
import {
  useActionState,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

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
  const memberFieldLabel = recordType === RECORD_ENTRY_MODE.income
    ? "收入來源"
    : "代墊成員";
  const activeCategories = useActiveCategories(
    categories,
    recordType,
  );
  const activeMembers = useActiveMembers(members);
  const showMemberField = entryKind !== RECORD_ENTRY_KIND.fundExpense;

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
      <div className="grid gap-px bg-border sm:grid-cols-2">
        {showMemberField ? (
          <MemberSelectField
            canSelectOthers={canSelectOthers}
            defaultMemberId={profile.id}
            label={memberFieldLabel}
            members={activeMembers}
            name={memberFieldName}
          />
        ) : (
          <div className="bg-card p-4" aria-hidden="true" />
        )}
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

  useEffect(() => {
    if (actionState.status === "success") {
      onRecordCreated();
    }
  }, [actionState.status, onRecordCreated]);

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
        <input name="recordType" type="hidden" value={recordType} />
        <input name="paymentSource" type="hidden" value={paymentSource} />
        <FieldGroup className="gap-0">
          <RecordKindTabs
            entryKind={entryKind}
            onEntryKindChange={onEntryKindChange}
          />
          {children}
          <div className="grid grid-cols-2 gap-px border-t border-border bg-border">
            <Button
              className="h-14 rounded-none bg-card text-foreground hover:bg-secondary"
              onClick={close}
              type="button"
              variant="ghost"
            >
              取消
            </Button>
            <Button
              className="h-14 rounded-none"
              disabled={!hasCategories || isPending}
              type="submit"
            >
              <Plus aria-hidden="true" size={18} />
              <span>{isPending ? "新增中..." : submitLabel}</span>
            </Button>
          </div>
        </FieldGroup>
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
        className="grid h-auto w-full grid-cols-3 rounded-none border-0 border-b border-border bg-card p-0"
      >
        <TabsTrigger className="h-14 rounded-none border-r border-border" value={RECORD_ENTRY_KIND.memberExpense}>
          成員支出
        </TabsTrigger>
        <TabsTrigger className="h-14 rounded-none border-r border-border" value={RECORD_ENTRY_KIND.income}>
          收入
        </TabsTrigger>
        <TabsTrigger className="h-14 rounded-none" value={RECORD_ENTRY_KIND.fundExpense}>
          基金支出
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

function DateField() {
  return (
    <Field className="bg-card p-4">
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
  return (
    <Field className="border-b border-border bg-card p-0">
      <FieldLabel className="sr-only">分類</FieldLabel>
      <div className="grid grid-cols-3 gap-px bg-border sm:grid-cols-4">
        {categories.map((category) => (
          <label
            className="flex min-h-16 cursor-pointer items-center justify-center bg-card px-3 text-center text-subheading text-foreground has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
            key={category.id}
          >
            <input
              className="sr-only"
              name="categoryId"
              required
              type="radio"
              value={category.id}
            />
            <span className="truncate">{category.name}</span>
          </label>
        ))}
      </div>
    </Field>
  );
}

function MemberSelectField({
  canSelectOthers,
  defaultMemberId,
  label,
  members,
  name,
}: {
  canSelectOthers: boolean;
  defaultMemberId: string;
  label: string;
  members: Member[];
  name: "payerMemberId" | "sourceMemberId";
}) {
  return (
    <Field className="bg-card p-4">
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
    <Field className="border-b border-border bg-card p-4">
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
    <Field className="border-b border-border bg-card p-4">
      <FieldLabel>名稱</FieldLabel>
      <Input name="name" placeholder={placeholder} required type="text" />
    </Field>
  );
}

function NoteField() {
  return (
    <Field className="min-h-32 bg-card p-4">
      <FieldLabel>備註</FieldLabel>
      <Textarea className="min-h-24 resize-none" name="note" placeholder="可留空" />
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
