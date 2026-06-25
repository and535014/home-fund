"use client";

import type { ReactNode } from "react";
import {
  AlertTriangle,
  CalendarDays,
  HandCoins,
  Pencil,
  ReceiptText,
  StickyNote,
  Trash2,
  UserRound,
  WalletCards,
} from "lucide-react";

import {
  CategoryVisualMark,
  getCategoryVisual,
} from "@/app/category-visuals";
import {
  formatRecordDate,
  recordActorLabel,
} from "./record-display-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { formatAmount } from "@/lib/format";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";

export type RecordDetailActionAccess = {
  blockedReason?: string;
  canDelete: boolean;
  canEdit: boolean;
  canRefund: boolean;
};

export function RecordDetailView({
  access,
  canOpenReimbursementPayment,
  canShowFooterActions,
  categoryName,
  displayedRecord,
  memberNames,
  onDelete,
  onEdit,
  onOpenReimbursementPayment,
  onRefund,
  record,
}: {
  access: RecordDetailActionAccess;
  canOpenReimbursementPayment: boolean;
  canShowFooterActions: boolean;
  categoryName: string;
  displayedRecord: LedgerRecord;
  memberNames: Record<string, string>;
  onDelete: () => void;
  onEdit: () => void;
  onOpenReimbursementPayment: () => void;
  onRefund: () => void;
  record: LedgerRecord;
}) {
  const isIncome = record.type === "income";

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

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <DetailField
              icon={<UserRound />}
              label="支付者"
              value={recordActorLabel(displayedRecord, memberNames)}
            />
            <DetailField
              icon={<CalendarDays />}
              label="日期"
              value={formatRecordDate(record.occurredOn)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
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
          </div>
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

      {canShowFooterActions ? (
        <DialogFooter className="mt-4">
          {access.canDelete ? (
            <Button onClick={onDelete} type="button" variant="destructive">
              <Trash2 />
              刪除
            </Button>
          ) : null}
          {access.canRefund ? (
            <Button onClick={onRefund} type="button">
              <HandCoins />
              退款
            </Button>
          ) : null}
          {canOpenReimbursementPayment ? (
            <Button
              onClick={onOpenReimbursementPayment}
              type="button"
              variant="outline"
            >
              <HandCoins />
              查看退款紀錄
            </Button>
          ) : null}
          {access.canEdit ? (
            <Button onClick={onEdit} type="button">
              <Pencil />
              編輯
            </Button>
          ) : null}
        </DialogFooter>
      ) : null}
    </DialogContent>
  );
}

export function EditCategoryField({
  categories,
  defaultCategoryId,
}: {
  categories: Category[];
  defaultCategoryId: string;
}) {
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
          {categories.map((category) => {
            const visual = getCategoryVisual(category);

            return (
              <label
                className="group grid w-18 shrink-0 cursor-pointer justify-items-center gap-2 text-center sm:w-auto"
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
