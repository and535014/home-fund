"use client";

import {
  CalendarDays,
  ReceiptText,
  StickyNote,
  UserRound,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";
import { useRef, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { RecordCategoryLabel } from "@/app/record-category-label";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";

export function RecordListDetail({
  categoriesById,
  memberNames,
  records,
}: {
  categoriesById: Record<string, Category>;
  memberNames: Record<string, string>;
  records: LedgerRecord[];
}) {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const selectedRecordTriggerRef = useRef<HTMLButtonElement | null>(null);
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? null;

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
            setSelectedRecordId(null);
            window.requestAnimationFrame(() => {
              selectedRecordTriggerRef.current?.focus();
            });
          }
        }}
      >
        {selectedRecord ? (
          <RecordDetailDialog
            categoryName={
              categoriesById[selectedRecord.categoryId]?.name ?? selectedRecord.categoryId
            }
            memberNames={memberNames}
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
  categoryName,
  memberNames,
  record,
}: {
  categoryName: string;
  memberNames: Record<string, string>;
  record: LedgerRecord;
}) {
  const isIncome = record.type === "income";

  return (
    <DialogContent aria-describedby={undefined} className="max-w-xl">
      <DialogHeader>
        <DialogTitle>{record.name}</DialogTitle>
      </DialogHeader>

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
