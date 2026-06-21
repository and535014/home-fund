"use client";

import {
  AlertTriangle,
  CalendarDays,
  HandCoins,
  Pencil,
  ReceiptText,
  Save,
  StickyNote,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useRef, useState, useTransition } from "react";
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
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Textarea } from "@/components/ui/textarea";
import { CategoryVisualMark, getCategoryVisual } from "@/app/category-visuals";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";

export function RecordListDetail({
  actor,
  categories,
  categoriesById,
  emptyMessage = "這個月份尚無紀錄。",
  memberNames,
  records,
}: {
  actor: HouseholdAccessProfile;
  categories: Category[];
  categoriesById: Record<string, Category>;
  emptyMessage?: string;
  memberNames: Record<string, string>;
  records: LedgerRecord[];
}) {
  const router = useRouter();
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const selectedRecordTriggerRef = useRef<HTMLButtonElement | null>(null);
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? null;
  function closeSelectedRecord() {
    setSelectedRecordId(null);
    window.requestAnimationFrame(() => {
      selectedRecordTriggerRef.current?.focus();
    });
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-3">
        {records.length === 0 ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-8 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <ItemGroup className="min-h-0 flex-1 overflow-y-auto divide-y divide-border">
            {records.map((record) => (
              <RecordListItem
                category={categoriesById[record.categoryId]}
                key={record.id}
                memberNames={memberNames}
                onOpen={(trigger) => {
                  selectedRecordTriggerRef.current = trigger;
                  setSelectedRecordId(record.id);
                }}
                record={record}
              />
            ))}
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
            onRefresh={() => router.refresh()}
            record={selectedRecord}
          />
        ) : null}
      </Dialog>
    </>
  );
}

function RecordListItem({
  category,
  memberNames,
  onOpen,
  record,
}: {
  category?: Category;
  memberNames: Record<string, string>;
  onOpen: (trigger: HTMLButtonElement) => void;
  record: LedgerRecord;
}) {
  return (
    <Item
      asChild
      className="rounded-none border-0 hover:bg-secondary/45 focus-within:bg-secondary/45"
      size="sm"
    >
      <button
        aria-label={`查看${record.name}詳情`}
        className="w-full text-left"
        onClick={(event) => onOpen(event.currentTarget)}
        type="button"
      >
        <RecordSummaryContent
          category={category}
          memberNames={memberNames}
          record={record}
        />
      </button>
    </Item>
  );
}

function RecordSummaryContent({
  category,
  memberNames,
  record,
}: {
  category?: Category;
  memberNames: Record<string, string>;
  record: LedgerRecord;
}) {
  const isIncome = record.type === "income";
  const visual = category ? getCategoryVisual(category) : null;

  return (
    <>
      <ItemMedia className="self-center! translate-y-0!">
        {visual ? (
          <CategoryVisualMark color={visual.color} icon={visual.icon} />
        ) : null}
      </ItemMedia>

      <ItemContent className="min-w-0">
        <ItemTitle className="max-w-full">
          <span className="truncate">{record.name}</span>
        </ItemTitle>

        <ItemDescription className="truncate">
          {recordActorLabel(record, memberNames)}
        </ItemDescription>
      </ItemContent>

      <ItemContent className="min-w-0 flex-none items-end text-right">
        <ItemTitle
          className={`max-w-full justify-end ${
            isIncome ? "text-income" : "text-expense"
          }`}
        >
          <span className="truncate">{formatAmount(record.amountCents)}</span>
        </ItemTitle>

        <ItemDescription className="truncate">
          {formatDate(record.occurredOn)}
        </ItemDescription>
      </ItemContent>
    </>
  );
}

function RecordDetailDialog({
  actor,
  category,
  categories,
  categoryName,
  memberNames,
  onMutationSuccess,
  onRefresh,
  record,
}: {
  actor: HouseholdAccessProfile;
  category?: Category;
  categories: Category[];
  categoryName: string;
  memberNames: Record<string, string>;
  onMutationSuccess: () => void;
  onRefresh: () => void;
  record: LedgerRecord;
}) {
  const isIncome = record.type === "income";
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
      <RefundRecordDialog
        category={category}
        memberNames={memberNames}
        onCancel={() => setMode("detail")}
        onSuccess={() => {
          setIsRefundedLocally(true);
          setMode("detail");
          toast.success("已完成退款", {
            description: "這筆紀錄已標記為已退款。",
            id: `refund-record-success-${record.id}`,
          });
          onRefresh();
        }}
        record={record}
      />
    );
  }

  return (
    <DialogContent aria-describedby={undefined} className="max-w-xl">
      <DialogHeader>
        <DialogTitle>{record.name}</DialogTitle>
      </DialogHeader>

      <DialogBody className="grid gap-4">
        <div className="rounded-card border border-border bg-secondary/30 p-4">
          <p className="text-caption text-muted-foreground">金額</p>
          <p
            className={`mt-1 text-heading ${
              isIncome ? "text-income" : "text-expense"
            }`}
          >
            {formatAmount(record.amountCents)}
          </p>
        </div>

        {access.blockedReason ? (
          <Alert variant="warning">
            <AlertTriangle />
            <AlertDescription>{access.blockedReason}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailField
            icon={<CalendarDays />}
            label="日期"
            value={formatDate(record.occurredOn)}
          />
          <DetailField
            icon={<ReceiptText />}
            label="分類"
            value={categoryName}
          />
          <DetailField
            icon={<WalletCards />}
            label="狀態"
            value={ledgerRecordStatusLabel(displayedRecord)}
          />
          <DetailField
            icon={<UserRound />}
            label="支付者"
            value={recordActorLabel(displayedRecord, memberNames)}
          />
        </div>

        <div className="rounded-card border border-border p-4">
          <div className="flex items-center gap-2 text-label">
            <StickyNote className="size-4 text-muted-foreground" />
            備註
          </div>
          <p className="mt-2 whitespace-pre-wrap text-body text-muted-foreground">
            {record.note?.trim() || "沒有備註。"}
          </p>
        </div>
      </DialogBody>

      {(access.canEdit || access.canDelete || access.canRefund) &&
      !access.blockedReason ? (
        <DialogFooter className="mt-4">
          {access.canDelete ? (
            <Button
              onClick={() => setMode("delete")}
              type="button"
              variant="destructive"
            >
              <Trash2 />
              刪除
            </Button>
          ) : null}
          {access.canRefund ? (
            <Button onClick={() => setMode("refund")} type="button">
              <HandCoins />
              退款
            </Button>
          ) : null}
          {access.canEdit ? (
            <Button onClick={() => setMode("edit")} type="button">
              <Pencil />
              編輯
            </Button>
          ) : null}
        </DialogFooter>
      ) : null}
    </DialogContent>
  );
}

function RefundRecordDialog({
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
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>確認退款</DialogTitle>
        <DialogDescription>將此紀錄標記為已退款。</DialogDescription>
      </DialogHeader>

      <form action={formAction}>
        {actionState.status === "error" && actionState.message ? (
          <Alert className="mb-3" role="alert" variant="destructive">
            <AlertDescription>{actionState.message}</AlertDescription>
          </Alert>
        ) : null}
        <input name="recordId" type="hidden" value={record.id} />
        <DialogBody className="grid gap-3">
          <Item className="border border-border bg-secondary/30">
            <RecordSummaryContent
              category={category}
              memberNames={memberNames}
              record={record}
            />
          </Item>
          <Alert variant="warning">
            <AlertTriangle />
            <AlertDescription>
              確認後，狀態會顯示為已退款，且無法編輯或刪除。
            </AlertDescription>
          </Alert>
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
  const activeCategories = categories.filter(
    (category) => category.type === record.type && category.status === "active",
  );
  const members = Object.entries(memberNames).map(([id, displayName]) => ({
    id,
    displayName,
  }));

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
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>編輯紀錄</DialogTitle>
        <DialogDescription>更新這筆紀錄的內容。</DialogDescription>
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
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-label">
              名稱
              <Input defaultValue={record.name} name="name" />
            </label>
            <label className="grid gap-2 text-label">
              金額
              <Input
                defaultValue={String(record.amountCents / 100)}
                inputMode="decimal"
                name="amountTwd"
              />
            </label>
            <label className="grid gap-2 text-label">
              日期
              <Input
                defaultValue={record.occurredOn}
                name="occurredOn"
                type="date"
              />
            </label>
            <label className="grid gap-2 text-label">
              分類
              <NativeSelect defaultValue={record.categoryId} name="categoryId">
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </NativeSelect>
            </label>
            {record.type === "expense" ? (
              <>
                <label className="grid gap-2 text-label">
                  支出類型
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
                </label>
                {paymentSource === "member" ? (
                  <label className="grid gap-2 text-label">
                    支付者
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
                  </label>
                ) : null}
              </>
            ) : (
              <label className="grid gap-2 text-label">
                支付者
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
              </label>
            )}
          </div>

          <label className="grid gap-2 text-label">
            備註
            <Textarea defaultValue={record.note ?? ""} name="note" />
          </label>
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
              {formatDate(record.occurredOn)}
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

function DetailField({
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

function recordActorLabel(
  record: LedgerRecord,
  memberNames: Record<string, string>,
): string {
  if (record.type === "income") {
    return memberNames[record.sourceMemberId] ?? "成員";
  }

  if (record.paymentSource === "member") {
    return memberNames[record.payerMemberId ?? ""] ?? "成員";
  }

  return "基金";
}

function ledgerRecordStatusLabel(record: LedgerRecord): string {
  if (record.type === "income") {
    return "---";
  }

  const reimbursementStatusLabels: Record<
    LedgerRecord["reimbursementStatus"],
    string
  > = {
    not_applicable: "不適用",
    not_refundable: "不需退款",
    refundable: "待退款",
    reimbursed: "已退款",
  };

  return reimbursementStatusLabels[record.reimbursementStatus];
}

function recordActionAccess(
  actor: HouseholdAccessProfile,
  record: LedgerRecord,
): {
  blockedReason?: string;
  canDelete: boolean;
  canEdit: boolean;
  canRefund: boolean;
} {
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

function formatAmount(amountCents: number): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function formatDate(date: string): string {
  return date.replaceAll("-", "/");
}
