"use client";

import {
  AlertTriangle,
  CalendarDays,
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
import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { initialActionState } from "@/app/action-state";
import {
  updateLedgerRecordAction,
  voidLedgerRecordAction,
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
import { RecordCategoryLabel } from "@/app/record-category-label";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";

export function RecordListDetail({
  actor,
  categories,
  categoriesById,
  memberNames,
  records,
}: {
  actor: HouseholdAccessProfile;
  categories: Category[];
  categoriesById: Record<string, Category>;
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
      {records.length === 0 ? (
        <div className="flex h-full items-center justify-center px-4 py-8 text-center text-muted-foreground">
          這個月份尚無紀錄。
        </div>
      ) : (
        <ItemGroup className="h-full overflow-y-auto divide-y divide-border">
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
            categories={categories}
            categoryName={
              categoriesById[selectedRecord.categoryId]?.name ?? selectedRecord.categoryId
            }
            memberNames={memberNames}
            onMutationSuccess={() => {
              closeSelectedRecord();
              router.refresh();
            }}
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
  const isIncome = record.type === "income";

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
        <ItemMedia className="self-center group-has-data-[slot=item-description]/item:translate-y-0 group-has-data-[slot=item-description]/item:self-center">
          {category ? <RecordCategoryLabel category={category} /> : null}
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
      </button>
    </Item>
  );
}

function RecordDetailDialog({
  actor,
  categories,
  categoryName,
  memberNames,
  onMutationSuccess,
  record,
}: {
  actor: HouseholdAccessProfile;
  categories: Category[];
  categoryName: string;
  memberNames: Record<string, string>;
  onMutationSuccess: () => void;
  record: LedgerRecord;
}) {
  const isIncome = record.type === "income";
  const [mode, setMode] = useState<"detail" | "edit" | "delete">("detail");
  const access = recordActionAccess(actor, record);

  if (mode === "edit") {
    return (
      <EditRecordDialog
        categories={categories}
        memberNames={memberNames}
        onCancel={() => setMode("detail")}
        onSuccess={() => {
          toast.success("紀錄已更新", {
            description: "已更新目前月份紀錄與摘要。",
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
            description: "這筆紀錄已從目前月份紀錄與摘要移除。",
            id: `delete-record-success-${record.id}`,
          });
          onMutationSuccess();
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
        <div className="flex gap-3 rounded-card border border-border bg-secondary/30 p-3 text-body text-muted-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-300" />
          <p>{access.blockedReason}</p>
        </div>
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
          value={ledgerRecordStatusLabel(record)}
        />
        <DetailField
          icon={<UserRound />}
          label="支付者"
          value={recordActorLabel(record, memberNames)}
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

      {(access.canEdit || access.canDelete) && !access.blockedReason ? (
        <DialogFooter>
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
  const [actionState, formAction, isPending] = useActionState(
    updateLedgerRecordAction,
    initialActionState<
      { recordId: string },
      UpdateLedgerRecordActionField,
      UpdateLedgerRecordActionCode
    >(),
  );
  const activeCategories = categories.filter(
    (category) => category.type === record.type && category.status === "active",
  );
  const members = Object.entries(memberNames).map(([id, displayName]) => ({
    id,
    displayName,
  }));

  useEffect(() => {
    if (actionState.status === "success") {
      onSuccess();
    }
  }, [actionState.status, onSuccess]);

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>編輯紀錄</DialogTitle>
        <DialogDescription>
          調整後會重新計算目前月份的月報、分類統計與退款資訊。
        </DialogDescription>
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
              <Input defaultValue={record.occurredOn} name="occurredOn" type="date" />
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
                      setPaymentSource(event.currentTarget.value as "fund" | "member")
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
                <NativeSelect defaultValue={record.sourceMemberId} name="sourceMemberId">
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

        <DialogFooter>
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
  const [actionState, formAction, isPending] = useActionState(
    voidLedgerRecordAction,
    initialActionState<
      { recordId: string },
      VoidLedgerRecordActionField,
      VoidLedgerRecordActionCode
    >(),
  );

  useEffect(() => {
    if (actionState.status === "success") {
      onSuccess();
    }
  }, [actionState.status, onSuccess]);

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>刪除紀錄</DialogTitle>
        <DialogDescription>
          這筆紀錄會從月報、分類統計、紀錄列表與待退款計算中移除。
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
              {formatAmount(record.amountCents)} · {formatDate(record.occurredOn)}
            </p>
          </div>
        </DialogBody>

        <DialogFooter>
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
} {
  const isOwner = actor.id === record.createdByMemberId;
  const isAdmin = actor.roles.includes("admin");
  const isFinanceManager = actor.roles.includes("finance_manager");
  const isReimbursedExpense =
    record.type === "expense" && record.reimbursementStatus === "reimbursed";

  if (isReimbursedExpense) {
    return {
      blockedReason: "這筆代墊支出已退款，需先有退款沖銷流程才能編輯或刪除。",
      canDelete: false,
      canEdit: false,
    };
  }

  return {
    canDelete: isAdmin || isOwner,
    canEdit: isAdmin || isFinanceManager || isOwner,
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
