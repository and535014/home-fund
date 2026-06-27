"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  CategoryVisualMark,
  compareCategoryVisualOrder,
  getCategoryVisual,
} from "@/app/category-visuals";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { DialogBody, DialogFooter } from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import type { Category } from "@/modules/categorization/category-catalog";

export type LedgerRecordFormFeedback = {
  message: string;
  tone: "error" | "success";
};

export type LedgerRecordFormMember = {
  displayName: string;
  id: string;
};

type LedgerRecordFormShellProps = {
  action: ComponentProps<"form">["action"];
  ariaLabel: string;
  children: ReactNode;
  feedbackMessage?: LedgerRecordFormFeedback;
  footer: ReactNode;
  isPending: boolean;
  hiddenFields?: ReactNode;
};

export function LedgerRecordFormShell({
  action,
  ariaLabel,
  children,
  feedbackMessage,
  footer,
  hiddenFields,
  isPending,
}: LedgerRecordFormShellProps) {
  return (
    <section
      aria-label={ariaLabel}
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

      <form action={action} className="flex min-h-0 flex-1 flex-col">
        {hiddenFields}
        <DialogBody>
          <FieldSet
            className="contents disabled:pointer-events-none disabled:opacity-70"
            disabled={isPending}
          >
            <FieldGroup>{children}</FieldGroup>
          </FieldSet>
        </DialogBody>
        <DialogFooter className="mt-4">{footer}</DialogFooter>
      </form>
    </section>
  );
}

export function LedgerRecordCategoryField({
  categories,
  defaultCategoryId,
}: {
  categories: Category[];
  defaultCategoryId?: string;
}) {
  const orderedCategories = [...categories].sort(compareCategoryVisualOrder);
  const categoryPages = chunkCategories(orderedCategories, 12);

  return (
    <Field>
      {orderedCategories.length === 0 ? (
        <p className="text-caption text-muted-foreground">
          尚未建立可用分類。
        </p>
      ) : (
        <div
          aria-label="分類"
          className="flex items-start gap-3 overflow-x-auto px-1 pb-3 pt-1 sm:gap-x-4 sm:gap-y-5 sm:overflow-x-auto sm:px-1 sm:pb-3 sm:pt-1"
          role="radiogroup"
        >
          {categoryPages.map((page, pageIndex) => (
            <div
              className="contents sm:grid sm:min-w-full sm:shrink-0 sm:grid-cols-6 sm:auto-rows-max sm:items-start sm:gap-x-4 sm:gap-y-5"
              key={page[0]?.id ?? pageIndex}
            >
              {page.map((category) => {
                const visual = getCategoryVisual(category);

                return (
                  <label
                    className="group grid w-18 shrink-0 cursor-pointer justify-items-center gap-2 text-center sm:w-full"
                    key={category.id}
                  >
                    <input
                      className="peer sr-only"
                      defaultChecked={category.id === defaultCategoryId}
                      name="categoryId"
                      required
                      type="radio"
                      value={category.id}
                    />
                    <CategoryVisualMark
                      className="transition group-hover:scale-105 peer-focus-visible:ring-[3px] peer-focus-visible:ring-ring/50 peer-checked:ring-4 peer-checked:ring-white"
                      color={visual.color}
                      icon={visual.icon}
                    />
                    <span className="max-w-full truncate text-label text-muted-foreground peer-checked:text-foreground">
                      {category.name}
                    </span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </Field>
  );
}

function chunkCategories<T>(categories: T[], size: number): T[][] {
  const chunks: T[][] = [];

  for (let index = 0; index < categories.length; index += size) {
    chunks.push(categories.slice(index, index + size));
  }

  return chunks;
}

export function LedgerRecordMemberSelectField({
  canSelectOthers = true,
  defaultMemberId,
  disabledDisplayValue,
  label,
  members,
  name,
}: {
  canSelectOthers?: boolean;
  defaultMemberId: string;
  disabledDisplayValue?: string;
  label: string;
  members: LedgerRecordFormMember[];
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

export function LedgerRecordAmountNameFields({
  amountDefaultValue,
  nameDefaultValue,
  namePlaceholder,
}: {
  amountDefaultValue?: string;
  nameDefaultValue?: string;
  namePlaceholder?: string;
}) {
  return (
    <div className="grid min-w-0 gap-3 sm:grid-cols-2 sm:gap-4">
      <LedgerRecordAmountField defaultValue={amountDefaultValue} />
      <LedgerRecordNameField
        defaultValue={nameDefaultValue}
        placeholder={namePlaceholder}
      />
    </div>
  );
}

export function LedgerRecordAmountField({
  defaultValue,
  placeholder = "例如 1200",
}: {
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <Field>
      <FieldLabel>金額</FieldLabel>
      <Input
        defaultValue={defaultValue}
        inputMode="decimal"
        min="1"
        name="amountTwd"
        placeholder={placeholder}
        required
        step="0.01"
        type="number"
      />
    </Field>
  );
}

export function LedgerRecordNameField({
  defaultValue,
  placeholder,
}: {
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <Field>
      <FieldLabel>名稱</FieldLabel>
      <Input
        defaultValue={defaultValue}
        name="name"
        placeholder={placeholder}
        required
        type="text"
      />
    </Field>
  );
}

export function LedgerRecordDateField({
  defaultValue = formatDateInputValue(),
}: {
  defaultValue?: string;
}) {
  return (
    <Field>
      <FieldLabel>日期</FieldLabel>
      <Input
        defaultValue={defaultValue}
        name="occurredOn"
        required
        type="date"
      />
    </Field>
  );
}

export function LedgerRecordNoteField({
  defaultValue,
  placeholder = "可留空",
}: {
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <Field>
      <FieldLabel>備註</FieldLabel>
      <Input
        defaultValue={defaultValue}
        name="note"
        placeholder={placeholder}
        type="text"
      />
    </Field>
  );
}

export function LedgerRecordCancelButton({
  children = "取消",
  disabled,
  onClick,
  variant = "secondary",
}: {
  children?: ReactNode;
  disabled: boolean;
  onClick: () => void;
  variant?: ComponentProps<typeof Button>["variant"];
}) {
  return (
    <Button disabled={disabled} onClick={onClick} type="button" variant={variant}>
      {children}
    </Button>
  );
}

function formatDateInputValue(date = new Date()) {
  const localDate = new Date(
    date.getTime() - date.getTimezoneOffset() * 60_000,
  );

  return localDate.toISOString().slice(0, 10);
}
