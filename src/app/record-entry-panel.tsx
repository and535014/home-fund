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

type Category = RecordCreateData["categories"][number];
type Member = RecordCreateData["members"][number];
type Profile = RecordCreateData["profile"];

export function RecordEntryPanel() {
  const {
    canCreateRecordsForOthers,
    categories,
    members,
    mode,
    profile,
    onRecordCreated,
  } = useRecordCreate();

  if (mode === RECORD_ENTRY_MODE.income) {
    return (
      <IncomeRecordEntryForm
        canSelectOthers={canCreateRecordsForOthers}
        categories={categories}
        members={members}
        profile={profile}
        onRecordCreated={onRecordCreated}
      />
    );
  }

  if (mode === RECORD_ENTRY_MODE.expense) {
    return (
      <ExpenseRecordEntryForm
        canSelectOthers={canCreateRecordsForOthers}
        categories={categories}
        members={members}
        profile={profile}
        onRecordCreated={onRecordCreated}
      />
    );
  }

  return null;
}

function IncomeRecordEntryForm({
  canSelectOthers,
  categories,
  members,
  profile,
  onRecordCreated,
}: {
  canSelectOthers: boolean;
  categories: RecordCreateData["categories"];
  members: RecordCreateData["members"];
  profile: Profile;
  onRecordCreated: () => void;
}) {
  const activeCategories = useActiveCategories(
    categories,
    RECORD_ENTRY_MODE.income,
  );
  const activeMembers = useActiveMembers(members);
  const defaultMemberId = profile.id;

  return (
    <RecordEntryFormShell
      hasCategories={activeCategories.length > 0}
      onRecordCreated={onRecordCreated}
      recordType={RECORD_ENTRY_MODE.income}
      submitLabel="新增收入"
    >
      <DateField />
      <CategoryField categories={activeCategories} />
      <MemberSelectField
        canSelectOthers={canSelectOthers}
        defaultMemberId={defaultMemberId}
        label="收入來源"
        members={activeMembers}
        name="sourceMemberId"
      />
      <AmountField />
      <NameField placeholder="例如 六月房租" />
      <NoteField />
    </RecordEntryFormShell>
  );
}

function ExpenseRecordEntryForm({
  canSelectOthers,
  categories,
  members,
  profile,
  onRecordCreated,
}: {
  canSelectOthers: boolean;
  categories: RecordCreateData["categories"];
  members: RecordCreateData["members"];
  profile: Profile;
  onRecordCreated: () => void;
}) {
  const [paymentSource, setPaymentSource] = useState<PaymentSource>(
    PAYMENT_SOURCE.member,
  );
  const activeCategories = useActiveCategories(
    categories,
    RECORD_ENTRY_MODE.expense,
  );
  const activeMembers = useActiveMembers(members);
  const isMemberPaidExpense = paymentSource === PAYMENT_SOURCE.member;

  return (
    <RecordEntryFormShell
      hasCategories={activeCategories.length > 0}
      onRecordCreated={onRecordCreated}
      recordType={RECORD_ENTRY_MODE.expense}
      submitLabel="新增支出"
    >
      <ExpenseTypeField
        onPaymentSourceChange={setPaymentSource}
        paymentSource={paymentSource}
      />
      <DateField />
      <CategoryField categories={activeCategories} />
      {isMemberPaidExpense ? (
        <MemberSelectField
          canSelectOthers={canSelectOthers}
          defaultMemberId={profile.id}
          label="代墊成員"
          members={activeMembers}
          name="payerMemberId"
        />
      ) : null}
      <AmountField />
      <NameField placeholder="例如 晚餐食材" />
      <NoteField />
    </RecordEntryFormShell>
  );
}

function RecordEntryFormShell({
  children,
  hasCategories,
  onRecordCreated,
  recordType,
  submitLabel,
}: {
  children: ReactNode;
  hasCategories: boolean;
  onRecordCreated: () => void;
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
        <FieldGroup>
          {children}
          <Button
            className="mt-1 w-full"
            disabled={!hasCategories || isPending}
            type="submit"
          >
            <Plus aria-hidden="true" size={18} />
            <span>{isPending ? "新增中..." : submitLabel}</span>
          </Button>
        </FieldGroup>
      </form>
    </section>
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
  return (
    <Field>
      <FieldLabel>分類</FieldLabel>
      <NativeSelect aria-label="分類" defaultValue="" name="categoryId">
        <option value="">選擇分類</option>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </NativeSelect>
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

function ExpenseTypeField({
  onPaymentSourceChange,
  paymentSource,
}: {
  onPaymentSourceChange: (paymentSource: PaymentSource) => void;
  paymentSource: PaymentSource;
}) {
  return (
    <Field>
      <input name="paymentSource" type="hidden" value={paymentSource} />
      <FieldLabel>支出類型</FieldLabel>
      <Tabs
        className="gap-0"
        onValueChange={(nextValue) =>
          onPaymentSourceChange(
            nextValue === PAYMENT_SOURCE.fund
              ? PAYMENT_SOURCE.fund
              : PAYMENT_SOURCE.member,
          )
        }
        value={paymentSource}
      >
        <TabsList aria-label="支出類型" className="w-full">
          <TabsTrigger value={PAYMENT_SOURCE.member}>成員代墊</TabsTrigger>
          <TabsTrigger value={PAYMENT_SOURCE.fund}>基金支出</TabsTrigger>
        </TabsList>
      </Tabs>
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
