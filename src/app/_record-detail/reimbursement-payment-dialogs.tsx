"use client";

import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Check,
  ListTree,
  Pencil,
  StickyNote,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";

import { RecordListItem } from "./record-list-item";
import {
  formatPaymentDate,
  type ReimbursementPaymentSearchResult,
} from "./reimbursement-payment-ui";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ItemGroup } from "@/components/ui/item";
import { NativeSelect } from "@/components/ui/native-select";
import { formatAmount } from "@/lib/format";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import {
  REIMBURSEMENT_PAYMENT_METHOD_OPTIONS,
  reimbursementPaymentMethodLabel,
} from "@/modules/reimbursement/reimbursement-payment";

export function ReimbursementPaymentDetailDialog({
  onOpenLinkedRecords,
  result,
}: {
  onOpenLinkedRecords: () => void;
  result: ReimbursementPaymentSearchResult;
}) {
  const [displayResult, setDisplayResult] = useState(result);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [draft, setDraft] = useState(() => draftFromResult(result));

  function handleCancel() {
    setDraft(draftFromResult(displayResult));
    setIsEditDialogOpen(false);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const method = draft.method;

    setDisplayResult({
      ...displayResult,
      method,
      methodLabel: reimbursementPaymentMethodLabel(method),
      note: draft.note.trim(),
      paidOn: draft.paidOn,
    });
    setIsEditDialogOpen(false);
    toast.success("退款紀錄已更新");
  }

  return (
    <DialogContent aria-describedby={undefined} className="max-w-xl">
      <DialogHeader>
        <DialogTitle>退款紀錄</DialogTitle>
      </DialogHeader>

      <DialogBody className="grid gap-4">
        <div className="rounded-card border border-border bg-secondary/30 p-4">
          <p className="text-caption text-muted-foreground">金額</p>
          <p className="mt-1 text-heading text-primary">
            {formatAmount(displayResult.amountCents)}
          </p>
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <PaymentDetailField
              icon={<UserRound />}
              label="收款成員"
              value={displayResult.paidToMemberName}
            />
            <PaymentDetailField
              icon={<CalendarDays />}
              label="付款日期"
              value={formatPaymentDate(displayResult.paidOn)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <PaymentDetailField
              icon={<WalletCards />}
              label="付款方式"
              value={displayResult.methodLabel}
            />
            <PaymentDetailField
              icon={<StickyNote />}
              label="備註"
              value={displayResult.note.trim() || "沒有備註。"}
            />
          </div>
        </div>
      </DialogBody>

      <DialogFooter className="mt-4 gap-2 sm:justify-between">
        <Button onClick={onOpenLinkedRecords} type="button" variant="outline">
          <ListTree />
          查看關聯紀錄
        </Button>
        <Button
          onClick={() => {
            setDraft(draftFromResult(displayResult));
            setIsEditDialogOpen(true);
          }}
          type="button"
        >
          <Pencil />
          編輯
        </Button>
      </DialogFooter>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <ReimbursementPaymentEditDialog
          draft={draft}
          onCancel={handleCancel}
          onDraftChange={setDraft}
          onSubmit={handleSubmit}
          result={displayResult}
        />
      </Dialog>
    </DialogContent>
  );
}

function ReimbursementPaymentEditDialog({
  draft,
  onCancel,
  onDraftChange,
  onSubmit,
  result,
}: {
  draft: ReimbursementPaymentDraft;
  onCancel: () => void;
  onDraftChange: (draft: ReimbursementPaymentDraft) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  result: ReimbursementPaymentSearchResult;
}) {
  return (
    <DialogContent aria-describedby={undefined} className="max-w-xl">
      <DialogHeader>
        <DialogTitle>編輯退款紀錄</DialogTitle>
      </DialogHeader>

      <DialogBody className="grid gap-4">
        <div className="rounded-card border border-border bg-secondary/30 p-4">
          <p className="text-caption text-muted-foreground">金額</p>
          <p className="mt-1 text-heading text-primary">
            {formatAmount(result.amountCents)}
          </p>
        </div>

        <form
          className="grid gap-4"
          id="refund-record-edit-form"
          onSubmit={onSubmit}
        >
          <PaymentDetailField
            icon={<UserRound />}
            label="收款成員"
            value={result.paidToMemberName}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="refund-record-paid-on">付款日期</FieldLabel>
              <Input
                id="refund-record-paid-on"
                name="paidOn"
                onChange={(event) =>
                  onDraftChange({ ...draft, paidOn: event.target.value })
                }
                required
                type="date"
                value={draft.paidOn}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="refund-record-method">付款方式</FieldLabel>
              <NativeSelect
                id="refund-record-method"
                name="method"
                onChange={(event) =>
                  onDraftChange({
                    ...draft,
                    method:
                      event.target.value as ReimbursementPaymentMethodValue,
                  })
                }
                value={draft.method}
              >
                {REIMBURSEMENT_PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>

          <Field>
            <FieldLabel htmlFor="refund-record-note">備註</FieldLabel>
            <Input
              id="refund-record-note"
              name="note"
              onChange={(event) =>
                onDraftChange({ ...draft, note: event.target.value })
              }
              placeholder="可填轉帳末五碼、收據資訊或付款備註"
              value={draft.note}
            />
          </Field>
        </form>
      </DialogBody>

      <DialogFooter className="mt-4 gap-2">
        <Button onClick={onCancel} type="button" variant="outline">
          <X />
          取消
        </Button>
        <Button form="refund-record-edit-form" type="submit">
          <Check />
          儲存變更
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

export function LinkedRecordsDialog({
  categoriesById,
  memberNames,
  onOpenRecord,
  records,
}: {
  categoriesById: Record<string, Category>;
  memberNames: Record<string, string>;
  onOpenRecord: (record: LedgerRecord) => void;
  records: LedgerRecord[];
}) {
  return (
    <DialogContent aria-describedby={undefined} className="max-w-xl">
      <DialogHeader>
        <DialogTitle>關聯紀錄</DialogTitle>
      </DialogHeader>

      <DialogBody className="grid gap-3">
        {records.length > 0 ? (
          <ItemGroup>
            {records.map((record) => (
              <RecordListItem
                category={categoriesById[record.categoryId]}
                isSelected={false}
                key={record.id}
                memberNames={memberNames}
                onOpen={() => onOpenRecord(record)}
                record={record}
              />
            ))}
          </ItemGroup>
        ) : (
          <div className="rounded-card border border-border p-4 text-body text-muted-foreground">
            目前找不到關聯紀錄。
          </div>
        )}
      </DialogBody>
    </DialogContent>
  );
}

type ReimbursementPaymentMethodValue = ReimbursementPaymentSearchResult["method"];
type ReimbursementPaymentDraft = ReturnType<typeof draftFromResult>;

function draftFromResult(result: ReimbursementPaymentSearchResult) {
  return {
    method: result.method,
    note: result.note,
    paidOn: result.paidOn,
  };
}

function PaymentDetailField({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-card border border-border p-3">
      <div className="flex items-center gap-2 text-caption text-muted-foreground">
        <span className="[&_svg]:size-4">{icon}</span>
        {label}
      </div>
      <p className="mt-1 text-body-strong">{value}</p>
    </div>
  );
}
