"use client";

import { HandCoins, Save, Trash2, X } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";

import { initialActionState } from "@/app/action-state";
import {
  reimburseLedgerRecordAction,
  updateLedgerRecordAction,
  voidLedgerRecordAction,
  type ReimburseLedgerRecordActionCode,
  type ReimburseLedgerRecordActionField,
  type UpdateLedgerRecordActionCode,
  type UpdateLedgerRecordActionField,
  type VoidLedgerRecordActionCode,
  type VoidLedgerRecordActionField,
} from "@/app/ledger-record-actions";
import {
  LedgerRecordAmountNameFields,
  LedgerRecordCancelButton,
  LedgerRecordCategoryField,
  LedgerRecordDateField,
  LedgerRecordFormShell,
  LedgerRecordMemberSelectField,
  LedgerRecordNoteField,
} from "@/app/ledger-record-form-fields";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import {
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Item } from "@/components/ui/item";
import { formatAmount } from "@/lib/format";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";
import { recordActionAccess } from "./record-detail-actions";
import { RecordDetailView } from "./record-detail-ui";
import { formatRecordDate } from "./record-display-utils";
import { RecordSummaryContent } from "./record-list-item";
import { ReimbursementPaymentFields } from "./reimbursement-payment-fields";

export function RecordDetailDialog({
  actor,
  category,
  categories,
  categoryName,
  memberNames,
  onMutationSuccess,
  onConfirmRecurringPosting,
  onOpenReimbursementPayment,
  onPendingChange,
  onRefresh,
  record,
  recurringEventLabel,
  recurringPostingPending = false,
}: {
  actor: HouseholdAccessProfile;
  category?: Category;
  categories: Category[];
  categoryName: string;
  memberNames: Record<string, string>;
  onMutationSuccess: () => void;
  onConfirmRecurringPosting?: () => void;
  onOpenReimbursementPayment?: (record: LedgerRecord) => void;
  onPendingChange: (pending: boolean) => void;
  onRefresh: () => void;
  record: LedgerRecord;
  recurringEventLabel?: string;
  recurringPostingPending?: boolean;
}) {
  const [mode, setMode] = useState<"detail" | "edit" | "delete" | "refund">(
    "detail",
  );
  const [isRefundedLocally, setIsRefundedLocally] = useState(false);
  const displayedRecord =
    isRefundedLocally && record.type === "expense"
      ? ({
          ...record,
          reimbursementStatus: "reimbursed",
        } satisfies LedgerRecord)
      : record;
  const access = recordActionAccess(actor, displayedRecord);
  const canOpenReimbursementPayment =
    Boolean(onOpenReimbursementPayment) &&
    displayedRecord.type === "expense" &&
    displayedRecord.paymentSource === "member" &&
    displayedRecord.reimbursementStatus === "reimbursed";
  const canShowFooterActions =
    recurringPostingPending ||
    ((access.canEdit ||
        access.canDelete ||
        access.canRefund ||
        canOpenReimbursementPayment) &&
      (!access.blockedReason || canOpenReimbursementPayment));

  if (mode === "edit") {
    return (
      <EditRecordDialog
        categories={categories}
        memberNames={memberNames}
        onCancel={() => setMode("detail")}
        onPendingChange={onPendingChange}
        onSuccess={() => {
          toast.success("紀錄已更新", {
            description: "這筆紀錄已更新。",
            id: `edit-record-success-${record.id}`,
          });
          onMutationSuccess();
        }}
        record={record}
      />
    );
  }

  if (mode === "delete") {
    return (
      <DeleteRecordDialog
        onCancel={() => setMode("detail")}
        onPendingChange={onPendingChange}
        onSuccess={() => {
          toast.success("紀錄已刪除", {
            description: "這筆紀錄已移除。",
            id: `delete-record-success-${record.id}`,
          });
          onMutationSuccess();
        }}
        record={record}
      />
    );
  }

  if (mode === "refund") {
    return (
      <RecordReimbursementDialog
        category={category}
        memberNames={memberNames}
        onCancel={() => setMode("detail")}
        onPendingChange={onPendingChange}
        onSuccess={() => {
          setIsRefundedLocally(true);
          setMode("detail");
          toast.success("已完成退款", {
            description: "這筆紀錄已標記為已退款，並保留退款紀錄資訊。",
            id: `record-reimbursement-success-${record.id}`,
          });
          onRefresh();
        }}
        record={record}
      />
    );
  }

  return (
    <RecordDetailView
      access={access}
      canOpenReimbursementPayment={canOpenReimbursementPayment}
      canShowFooterActions={canShowFooterActions}
      categoryName={categoryName}
      displayedRecord={displayedRecord}
      memberNames={memberNames}
      onDelete={() => setMode("delete")}
      onEdit={() => setMode("edit")}
      onConfirmRecurringPosting={onConfirmRecurringPosting}
      onOpenReimbursementPayment={() =>
        onOpenReimbursementPayment?.(displayedRecord)}
      onRefund={() => setMode("refund")}
      record={record}
      recurringEventLabel={recurringEventLabel}
      recurringPostingPending={recurringPostingPending}
    />
  );
}

function RecordReimbursementDialog({
  category,
  memberNames,
  onCancel,
  onPendingChange,
  onSuccess,
  record,
}: {
  category?: Category;
  memberNames: Record<string, string>;
  onCancel: () => void;
  onPendingChange: (pending: boolean) => void;
  onSuccess: () => void;
  record: LedgerRecord;
}) {
  const [actionState, setActionState] = useState(() =>
    initialActionState<
      { recordId: string },
      ReimburseLedgerRecordActionField,
      ReimburseLedgerRecordActionCode
    >(),
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    onPendingChange(isPending);

    return () => onPendingChange(false);
  }, [isPending, onPendingChange]);

  function formAction(formData: FormData) {
    startTransition(async () => {
      const nextState = await reimburseLedgerRecordAction(actionState, formData);

      setActionState(nextState);

      if (nextState.status === "success") {
        onSuccess();
      }
    });
  }

  return (
    <DialogContent aria-describedby={undefined} className="max-w-md">
      <DialogHeader>
        <DialogTitle>確認退款</DialogTitle>
      </DialogHeader>

      <form action={formAction}>
        {actionState.status === "error" && actionState.message ? (
          <Alert className="mb-3" role="alert" variant="destructive">
            <AlertDescription>{actionState.message}</AlertDescription>
          </Alert>
        ) : null}
        <input name="recordId" type="hidden" value={record.id} />
        <DialogBody className="grid gap-3">
          <Item variant="muted">
            <RecordSummaryContent
              category={category}
              memberNames={memberNames}
              record={record}
            />
          </Item>
          <ReimbursementPaymentFields
            disabled={isPending}
            idPrefix={`record-${record.id}-reimbursement`}
          />
        </DialogBody>

        <DialogFooter className="mt-4">
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
            pendingLabel="處理中..."
            type="submit"
          >
            <HandCoins />
            {isPending ? "處理中..." : "確認退款"}
          </FormSubmitButton>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditRecordDialog({
  categories,
  memberNames,
  onCancel,
  onPendingChange,
  onSuccess,
  record,
}: {
  categories: Category[];
  memberNames: Record<string, string>;
  onCancel: () => void;
  onPendingChange: (pending: boolean) => void;
  onSuccess: () => void;
  record: LedgerRecord;
}) {
  const paymentSource = record.type === "expense" ? record.paymentSource : null;
  const [actionState, setActionState] = useState(() =>
    initialActionState<
      { recordId: string },
      UpdateLedgerRecordActionField,
      UpdateLedgerRecordActionCode
    >(),
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    onPendingChange(isPending);

    return () => onPendingChange(false);
  }, [isPending, onPendingChange]);
  const editableCategories = categories
    .filter(
      (category) =>
        category.type === record.type &&
        (category.status === "active" || category.id === record.categoryId),
    );
  const members = Object.entries(memberNames).map(([id, displayName]) => ({
    id,
    displayName,
  }));
  const payerField =
    record.type === "income" ? (
      <LedgerRecordMemberSelectField
        defaultMemberId={record.sourceMemberId}
        label="支付者"
        members={members}
        name="sourceMemberId"
      />
    ) : paymentSource === "member" ? (
      <LedgerRecordMemberSelectField
        defaultMemberId={record.payerMemberId ?? ""}
        label="支付者"
        members={members}
        name="payerMemberId"
      />
    ) : null;

  function formAction(formData: FormData) {
    startTransition(async () => {
      const nextState = await updateLedgerRecordAction(actionState, formData);

      setActionState(nextState);

      if (nextState.status === "success") {
        onSuccess();
      }
    });
  }

  return (
    <DialogContent aria-describedby={undefined} className="max-w-xl">
      <DialogHeader>
        <DialogTitle>編輯紀錄</DialogTitle>
      </DialogHeader>

      <LedgerRecordFormShell
        action={formAction}
        ariaLabel="編輯紀錄表單"
        feedbackMessage={
          actionState.status === "error" && actionState.message
            ? { message: actionState.message, tone: "error" }
            : undefined
        }
        hiddenFields={
          <>
            <input name="recordId" type="hidden" value={record.id} />
            <input name="recordType" type="hidden" value={record.type} />
            {paymentSource ? (
              <input name="paymentSource" type="hidden" value={paymentSource} />
            ) : null}
          </>
        }
        isPending={isPending}
        footer={
          <>
            <LedgerRecordCancelButton
              disabled={isPending}
              onClick={onCancel}
              variant="outline"
            >
              <X />
              取消
            </LedgerRecordCancelButton>
            <FormSubmitButton
              disabled={isPending}
              pendingLabel="儲存中..."
              type="submit"
            >
              <Save />
              {isPending ? "儲存中..." : "儲存變更"}
            </FormSubmitButton>
          </>
        }
      >
        <LedgerRecordCategoryField
          categories={editableCategories}
          defaultCategoryId={record.categoryId}
        />

        <LedgerRecordAmountNameFields
          amountDefaultValue={String(record.amountCents / 100)}
          nameDefaultValue={record.name}
        />

        <div
          className={
            payerField
              ? "grid min-w-0 grid-cols-2 gap-3 sm:gap-4"
              : "grid min-w-0 gap-3 sm:gap-4"
          }
        >
          {payerField}
          <LedgerRecordDateField defaultValue={record.occurredOn} />
        </div>

        <LedgerRecordNoteField defaultValue={record.note ?? ""} />
      </LedgerRecordFormShell>
    </DialogContent>
  );
}

function DeleteRecordDialog({
  onCancel,
  onPendingChange,
  onSuccess,
  record,
}: {
  onCancel: () => void;
  onPendingChange: (pending: boolean) => void;
  onSuccess: () => void;
  record: LedgerRecord;
}) {
  const [actionState, setActionState] = useState(() =>
    initialActionState<
      { recordId: string },
      VoidLedgerRecordActionField,
      VoidLedgerRecordActionCode
    >(),
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    onPendingChange(isPending);

    return () => onPendingChange(false);
  }, [isPending, onPendingChange]);

  function formAction(formData: FormData) {
    startTransition(async () => {
      const nextState = await voidLedgerRecordAction(actionState, formData);

      setActionState(nextState);

      if (nextState.status === "success") {
        onSuccess();
      }
    });
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>刪除紀錄</DialogTitle>
        <DialogDescription>
          刪除後，這筆紀錄不會顯示在列表中。
        </DialogDescription>
      </DialogHeader>

      <form action={formAction}>
        {actionState.status === "error" && actionState.message ? (
          <Alert className="mb-3" role="alert" variant="destructive">
            <AlertDescription>{actionState.message}</AlertDescription>
          </Alert>
        ) : null}
        <input name="recordId" type="hidden" value={record.id} />
        <DialogBody>
          <div className="rounded-card border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-body-strong">{record.name}</p>
            <p className="mt-1 text-body text-muted-foreground">
              {formatAmount(record.amountCents)} ·{" "}
              {formatRecordDate(record.occurredOn)}
            </p>
          </div>
        </DialogBody>

        <DialogFooter className="mt-4">
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
            pendingLabel="刪除中..."
            type="submit"
            variant="destructive"
          >
            <Trash2 />
            {isPending ? "刪除中..." : "確認刪除"}
          </FormSubmitButton>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
