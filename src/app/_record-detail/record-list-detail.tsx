"use client";

import { HandCoins, Save, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { formatRecordDate } from "./record-display-utils";
import {
  EditCategoryField,
  RecordDetailView,
  type RecordDetailActionAccess,
} from "./record-detail-ui";
import {
  RecordListItem,
  RecordSummaryContent,
} from "./record-list-item";
import { loadReimbursementPaymentForLedgerRecord } from "./reimbursement-payment-loader";
import {
  LinkedRecordsDialog,
  ReimbursementPaymentDetailDialog,
} from "./reimbursement-payment-dialogs";
import type { ReimbursementPaymentSearchResult } from "./reimbursement-payment-ui";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Item, ItemGroup } from "@/components/ui/item";
import { Textarea } from "@/components/ui/textarea";
import { compareCategoryVisualOrder } from "@/app/category-visuals";
import { ReimbursementPaymentFields } from "./reimbursement-payment-fields";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";

export function RecordListDetail({
  actor,
  categories,
  categoriesById,
  emptyMessage = "這個月份尚無紀錄。",
  hasMoreRecords = false,
  memberNames,
  onLoadMoreRecords,
  onToggleRecordSelection,
  records,
  selectedRecordIds,
}: {
  actor: HouseholdAccessProfile;
  categories: Category[];
  categoriesById: Record<string, Category>;
  emptyMessage?: string;
  hasMoreRecords?: boolean;
  memberNames: Record<string, string>;
  onLoadMoreRecords?: () => void;
  onToggleRecordSelection?: (recordId: string) => void;
  records: LedgerRecord[];
  selectedRecordIds?: Set<string>;
}) {
  const router = useRouter();
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [selectedRelatedRecord, setSelectedRelatedRecord] =
    useState<LedgerRecord | null>(null);
  const [selectedReimbursementPayment, setSelectedReimbursementPayment] =
    useState<ReimbursementPaymentSearchResult | null>(null);
  const [selectedPaymentLinkedResult, setSelectedPaymentLinkedResult] =
    useState<ReimbursementPaymentSearchResult | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const selectedRecordTriggerRef = useRef<HTMLButtonElement | null>(null);
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ??
    selectedRelatedRecord;
  function closeSelectedRecord() {
    setSelectedRecordId(null);
    setSelectedRelatedRecord(null);
    window.requestAnimationFrame(() => {
      selectedRecordTriggerRef.current?.focus();
    });
  }

  function openReimbursementPayment(record: LedgerRecord) {
    loadReimbursementPaymentForLedgerRecord(record, (payment) => {
      setSelectedRecordId(null);
      setSelectedRelatedRecord(null);
      setSelectedReimbursementPayment(payment);
    });
  }

  useEffect(() => {
    if (!hasMoreRecords || !onLoadMoreRecords) {
      return;
    }

    const target = loadMoreRef.current;

    if (!target) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMoreRecords();
        }
      },
      { rootMargin: "160px 0px" },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasMoreRecords, onLoadMoreRecords, records.length]);

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-3">
        {records.length === 0 ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-8 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <ItemGroup className="min-h-0 flex-1 overflow-y-auto">
            {records.map((record) => (
              <RecordListItem
                category={categoriesById[record.categoryId]}
                isSelected={selectedRecordIds?.has(record.id) ?? false}
                key={record.id}
                memberNames={memberNames}
                onOpen={(trigger) => {
                  selectedRecordTriggerRef.current = trigger;
                  setSelectedRelatedRecord(null);
                  setSelectedRecordId(record.id);
                }}
                onToggleSelection={onToggleRecordSelection}
                record={record}
              />
            ))}
            {hasMoreRecords ? (
              <div
                ref={loadMoreRef}
                className="px-4 py-4 text-center text-caption text-muted-foreground"
              >
                載入更多紀錄...
              </div>
            ) : null}
          </ItemGroup>
        )}
      </div>

      <Dialog
        open={Boolean(selectedRecord)}
        onOpenChange={(open) => {
          if (!open) {
            closeSelectedRecord();
          }
        }}
      >
        {selectedRecord ? (
          <RecordDetailDialog
            actor={actor}
            category={categoriesById[selectedRecord.categoryId]}
            categories={categories}
            categoryName={
              categoriesById[selectedRecord.categoryId]?.name ??
              selectedRecord.categoryId
            }
            memberNames={memberNames}
            onMutationSuccess={() => {
              closeSelectedRecord();
              router.refresh();
            }}
            onOpenReimbursementPayment={openReimbursementPayment}
            onRefresh={() => router.refresh()}
            record={selectedRecord}
          />
        ) : null}
      </Dialog>
      <Dialog
        open={Boolean(selectedReimbursementPayment)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReimbursementPayment(null);
          }
        }}
      >
        {selectedReimbursementPayment ? (
          <ReimbursementPaymentDetailDialog
            onOpenLinkedRecords={() => {
              setSelectedPaymentLinkedResult(selectedReimbursementPayment);
              setSelectedReimbursementPayment(null);
            }}
            result={selectedReimbursementPayment}
          />
        ) : null}
      </Dialog>
      <Dialog
        open={Boolean(selectedPaymentLinkedResult)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPaymentLinkedResult(null);
          }
        }}
      >
        {selectedPaymentLinkedResult ? (
          <LinkedRecordsDialog
            categoriesById={categoriesById}
            memberNames={memberNames}
            onOpenRecord={(record) => {
              setSelectedPaymentLinkedResult(null);
              setSelectedRelatedRecord(record);
              setSelectedRecordId(record.id);
            }}
            records={selectedPaymentLinkedResult.linkedRecords}
          />
        ) : null}
      </Dialog>
    </>
  );
}

export function RecordDetailDialog({
  actor,
  category,
  categories,
  categoryName,
  memberNames,
  onMutationSuccess,
  onOpenReimbursementPayment,
  onRefresh,
  record,
}: {
  actor: HouseholdAccessProfile;
  category?: Category;
  categories: Category[];
  categoryName: string;
  memberNames: Record<string, string>;
  onMutationSuccess: () => void;
  onOpenReimbursementPayment?: (record: LedgerRecord) => void;
  onRefresh: () => void;
  record: LedgerRecord;
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
    (access.canEdit ||
      access.canDelete ||
      access.canRefund ||
      canOpenReimbursementPayment) &&
    (!access.blockedReason || canOpenReimbursementPayment);

  if (mode === "edit") {
    return (
      <EditRecordDialog
        categories={categories}
        memberNames={memberNames}
        onCancel={() => setMode("detail")}
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
      onOpenReimbursementPayment={() =>
        onOpenReimbursementPayment?.(displayedRecord)}
      onRefund={() => setMode("refund")}
      record={record}
    />
  );
}

function RecordReimbursementDialog({
  category,
  memberNames,
  onCancel,
  onSuccess,
  record,
}: {
  category?: Category;
  memberNames: Record<string, string>;
  onCancel: () => void;
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
            idPrefix={`record-${record.id}-reimbursement`}
          />
        </DialogBody>

        <DialogFooter className="mt-4">
          <Button onClick={onCancel} type="button" variant="outline">
            <X />
            取消
          </Button>
          <Button disabled={isPending} type="submit">
            <HandCoins />
            {isPending ? "處理中..." : "確認退款"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditRecordDialog({
  categories,
  memberNames,
  onCancel,
  onSuccess,
  record,
}: {
  categories: Category[];
  memberNames: Record<string, string>;
  onCancel: () => void;
  onSuccess: () => void;
  record: LedgerRecord;
}) {
  const [paymentSource, setPaymentSource] = useState(
    record.type === "expense" ? record.paymentSource : "member",
  );
  const [actionState, setActionState] = useState(() =>
    initialActionState<
      { recordId: string },
      UpdateLedgerRecordActionField,
      UpdateLedgerRecordActionCode
    >(),
  );
  const [isPending, startTransition] = useTransition();
  const editableCategories = categories
    .filter(
      (category) =>
        category.type === record.type &&
        (category.status === "active" || category.id === record.categoryId),
    )
    .sort(compareCategoryVisualOrder);
  const members = Object.entries(memberNames).map(([id, displayName]) => ({
    id,
    displayName,
  }));
  const payerField =
    record.type === "income" ? (
      <Field className="min-w-0">
        <FieldLabel>支付者</FieldLabel>
        <NativeSelect
          defaultValue={record.sourceMemberId}
          name="sourceMemberId"
        >
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </NativeSelect>
      </Field>
    ) : paymentSource === "member" ? (
      <Field className="min-w-0">
        <FieldLabel>支付者</FieldLabel>
        <NativeSelect
          defaultValue={record.payerMemberId ?? ""}
          name="payerMemberId"
        >
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.displayName}
            </option>
          ))}
        </NativeSelect>
      </Field>
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

      <form action={formAction}>
        {actionState.status === "error" && actionState.message ? (
          <Alert className="mb-3" role="alert" variant="destructive">
            <AlertDescription>{actionState.message}</AlertDescription>
          </Alert>
        ) : null}
        <input name="recordId" type="hidden" value={record.id} />
        <input name="recordType" type="hidden" value={record.type} />
        <DialogBody className="grid gap-4">
          <EditCategoryField
            categories={editableCategories}
            defaultCategoryId={record.categoryId}
          />

          {record.type === "expense" ? (
            <Field className="min-w-0">
              <FieldLabel>支出類型</FieldLabel>
              <NativeSelect
                name="paymentSource"
                onChange={(event) =>
                  setPaymentSource(
                    event.currentTarget.value as "fund" | "member",
                  )
                }
                value={paymentSource}
              >
                <option value="member">成員代墊</option>
                <option value="fund">基金支出</option>
              </NativeSelect>
            </Field>
          ) : null}

          <Field className="min-w-0">
            <FieldLabel>金額</FieldLabel>
            <Input
              defaultValue={String(record.amountCents / 100)}
              inputMode="decimal"
              name="amountTwd"
            />
          </Field>

          <Field className="min-w-0">
            <FieldLabel>名稱</FieldLabel>
            <Input defaultValue={record.name} name="name" />
          </Field>

          <div className={cn("grid min-w-0 gap-3", payerField && "grid-cols-2")}>
            {payerField}
            <Field className="min-w-0">
              <FieldLabel>日期</FieldLabel>
              <Input
                defaultValue={record.occurredOn}
                name="occurredOn"
                type="date"
              />
            </Field>
          </div>

          <Field className="min-w-0">
            <FieldLabel>備註</FieldLabel>
            <Textarea defaultValue={record.note ?? ""} name="note" />
          </Field>
        </DialogBody>

        <DialogFooter className="mt-4">
          <Button onClick={onCancel} type="button" variant="outline">
            <X />
            取消
          </Button>
          <Button disabled={isPending} type="submit">
            <Save />
            {isPending ? "儲存中..." : "儲存變更"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function DeleteRecordDialog({
  onCancel,
  onSuccess,
  record,
}: {
  onCancel: () => void;
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
          <Button onClick={onCancel} type="button" variant="outline">
            <X />
            取消
          </Button>
          <Button disabled={isPending} type="submit" variant="destructive">
            <Trash2 />
            {isPending ? "刪除中..." : "確認刪除"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function recordActionAccess(
  actor: HouseholdAccessProfile,
  record: LedgerRecord,
): RecordDetailActionAccess {
  const isOwner = actor.id === record.createdByMemberId;
  const isAdmin = actor.roles.includes("admin");
  const isFinanceManager = actor.roles.includes("finance_manager");
  const isReimbursedExpense =
    record.type === "expense" && record.reimbursementStatus === "reimbursed";
  const canPerformReimbursement = isAdmin || isFinanceManager;
  const canRefund =
    canPerformReimbursement &&
    record.type === "expense" &&
    record.status === "active" &&
    record.paymentSource === "member" &&
    record.reimbursementStatus === "refundable";

  if (isReimbursedExpense) {
    return {
      blockedReason: "這筆代墊支出已退款，無法編輯或刪除。",
      canDelete: false,
      canEdit: false,
      canRefund: false,
    };
  }

  return {
    canDelete: isAdmin || isOwner,
    canEdit: isAdmin || isFinanceManager || isOwner,
    canRefund,
  };
}
