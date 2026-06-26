"use client";

import type { ReactNode } from "react";
import { useActionState, useCallback, useState } from "react";
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
  ActionField,
  ActionFieldError,
  ActionFieldLabel,
  getActionFieldControlProps,
} from "@/components/forms/action-field";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ItemGroup } from "@/components/ui/item";
import { NativeSelect } from "@/components/ui/native-select";
import { formatAmount } from "@/lib/format";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import {
  REIMBURSEMENT_PAYMENT_METHOD_OPTIONS,
} from "@/modules/reimbursement/reimbursement-payment";
import type {
  EditReimbursementPaymentActionCode,
  EditReimbursementPaymentField,
  EditReimbursementPaymentActionState,
} from "./reimbursement-payment-edit-actions";
import {
  editReimbursementPaymentFormAction,
} from "./reimbursement-payment-edit-actions";
import { initialActionState } from "@/app/action-state";
import { useActionStateEffect } from "@/app/use-action-state-effect";

export function ReimbursementPaymentDetailDialog({
  canEdit,
  onOpenLinkedRecords,
  onUpdated,
  result,
}: {
  canEdit: boolean;
  onOpenLinkedRecords: () => void;
  onUpdated?: (record: ReimbursementPaymentSearchResult) => void;
  result: ReimbursementPaymentSearchResult;
}) {
  const [displayResult, setDisplayResult] = useState(result);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [actionState, formAction, isPending] = useActionState(
    editReimbursementPaymentFormAction,
    initialActionState<
      ReimbursementPaymentSearchResult,
      EditReimbursementPaymentField,
      EditReimbursementPaymentActionCode
    >(),
  );
  const [draft, setDraft] = useState(() => draftFromResult(result));

  useActionStateEffect(
    actionState,
    useCallback((handledState) => {
      if (handledState.status === "success" && handledState.data) {
        setDisplayResult(handledState.data);
        setDraft(draftFromResult(handledState.data));
        setIsEditDialogOpen(false);
        toast.success(handledState.message ?? "退款紀錄已更新");
        onUpdated?.(handledState.data);
      }

      if (handledState.status === "error" && handledState.message) {
        toast.error(handledState.message);
      }
    }, [onUpdated]),
  );

  function handleCancel() {
    setDraft(draftFromResult(displayResult));
    setIsEditDialogOpen(false);
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
        {canEdit ? (
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
        ) : null}
      </DialogFooter>

      <Dialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          if (!isPending) {
            setIsEditDialogOpen(open);
          }
        }}
      >
        <ReimbursementPaymentEditDialog
          actionState={actionState}
          draft={draft}
          formAction={formAction}
          isPending={isPending}
          onCancel={handleCancel}
          onDraftChange={setDraft}
          result={displayResult}
        />
      </Dialog>
    </DialogContent>
  );
}

function ReimbursementPaymentEditDialog({
  actionState,
  draft,
  formAction,
  isPending,
  onCancel,
  onDraftChange,
  result,
}: {
  actionState: EditReimbursementPaymentActionState;
  draft: ReimbursementPaymentDraft;
  formAction: (formData: FormData) => void;
  isPending: boolean;
  onCancel: () => void;
  onDraftChange: (draft: ReimbursementPaymentDraft) => void;
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
          action={formAction}
          className="grid gap-4"
          id="refund-record-edit-form"
        >
          <input name="paymentId" type="hidden" value={result.id} />
          <PaymentDetailField
            icon={<UserRound />}
            label="收款成員"
            value={result.paidToMemberName}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <ActionField
              errors={actionState.fieldErrors}
              field="paidOn"
              id="refund-record-paid-on"
            >
              <ActionFieldLabel id="refund-record-paid-on">付款日期</ActionFieldLabel>
              <Input
                disabled={isPending}
                id="refund-record-paid-on"
                name="paidOn"
                onChange={(event) =>
                  onDraftChange({ ...draft, paidOn: event.target.value })
                }
                required
                type="date"
                value={draft.paidOn}
                {...getActionFieldControlProps({
                  errors: actionState.fieldErrors,
                  field: "paidOn",
                  id: "refund-record-paid-on",
                })}
              />
              <ActionFieldError
                errors={actionState.fieldErrors}
                field="paidOn"
                id="refund-record-paid-on"
              />
            </ActionField>

            <ActionField
              errors={actionState.fieldErrors}
              field="method"
              id="refund-record-method"
            >
              <ActionFieldLabel id="refund-record-method">付款方式</ActionFieldLabel>
              <NativeSelect
                disabled={isPending}
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
                {...getActionFieldControlProps({
                  errors: actionState.fieldErrors,
                  field: "method",
                  id: "refund-record-method",
                })}
              >
                {REIMBURSEMENT_PAYMENT_METHOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                  {option.label}
                  </option>
                ))}
              </NativeSelect>
              <ActionFieldError
                errors={actionState.fieldErrors}
                field="method"
                id="refund-record-method"
              />
            </ActionField>
          </div>

          <ActionField
            errors={actionState.fieldErrors}
            field="note"
            id="refund-record-note"
          >
            <ActionFieldLabel id="refund-record-note">備註</ActionFieldLabel>
            <Input
              disabled={isPending}
              id="refund-record-note"
              name="note"
              onChange={(event) =>
                onDraftChange({ ...draft, note: event.target.value })
              }
              placeholder="可填轉帳末五碼、收據資訊或付款備註"
              value={draft.note}
              {...getActionFieldControlProps({
                errors: actionState.fieldErrors,
                field: "note",
                id: "refund-record-note",
              })}
            />
            <ActionFieldError
              errors={actionState.fieldErrors}
              field="note"
              id="refund-record-note"
            />
          </ActionField>
        </form>
      </DialogBody>

      <DialogFooter className="mt-4 gap-2">
        <Button
          disabled={isPending}
          onClick={onCancel}
          type="button"
          variant="outline"
        >
          <X />
          取消
        </Button>
        <FormSubmitButton
          disabled={isPending}
          form="refund-record-edit-form"
          pendingLabel="儲存中..."
          type="submit"
        >
          <Check />
          儲存變更
        </FormSubmitButton>
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
