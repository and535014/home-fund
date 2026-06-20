"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  ChevronRight,
  ReceiptText,
  StickyNote,
  UserRound,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";

export function RecordListDetail({
  categoryNames,
  memberNames,
  records,
}: {
  categoryNames: Record<string, string>;
  memberNames: Record<string, string>;
  records: LedgerRecord[];
}) {
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? null;

  return (
    <>
      <Card className="min-h-0 overflow-hidden">
        {records.length === 0 ? (
          <div className="px-4 py-8 text-center text-muted-foreground">
            這個月份尚無紀錄。
          </div>
        ) : (
          <ItemGroup className="divide-y divide-border">
            {records.map((record) => (
              <RecordListItem
                categoryName={categoryNames[record.categoryId] ?? record.categoryId}
                key={record.id}
                memberNames={memberNames}
                onOpen={() => setSelectedRecordId(record.id)}
                record={record}
              />
            ))}
          </ItemGroup>
        )}
      </Card>

      <Dialog
        open={Boolean(selectedRecord)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedRecordId(null);
          }
        }}
      >
        {selectedRecord ? (
          <RecordDetailDialog
            categoryName={
              categoryNames[selectedRecord.categoryId] ?? selectedRecord.categoryId
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
  categoryName,
  memberNames,
  onOpen,
  record,
}: {
  categoryName: string;
  memberNames: Record<string, string>;
  onOpen: () => void;
  record: LedgerRecord;
}) {
  const isIncome = record.type === "income";
  const signedAmount = `${isIncome ? "+" : "-"}${formatAmount(record.amountCents)}`;

  return (
    <Item
      asChild
      className="rounded-none border-0 hover:bg-secondary/45 focus-within:bg-secondary/45"
      size="sm"
    >
      <button
        aria-label={`查看${record.name}詳情`}
        className="w-full text-left"
        onClick={onOpen}
        type="button"
      >
        <ItemMedia
          className={isIncome ? "text-income" : "text-expense"}
          variant="icon"
        >
          {isIncome ? <ArrowUpRight /> : <ArrowDownRight />}
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle className="max-w-full">
            <span className="truncate">{record.name}</span>
          </ItemTitle>
          <ItemDescription className="truncate">
            {record.occurredOn} · {categoryName} ·{" "}
            {recordActorLabel(record, memberNames)}
          </ItemDescription>
        </ItemContent>
        <ItemActions className="ml-auto shrink-0">
          <div className="text-right">
            <p
              className={`text-body-strong ${
                isIncome ? "text-income" : "text-expense"
              }`}
            >
              {signedAmount}
            </p>
            <Badge className="mt-1">{ledgerRecordStatusLabel(record)}</Badge>
          </div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </ItemActions>
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
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>{record.name}</DialogTitle>
        <DialogDescription>
          {isIncome ? "收入紀錄" : "支出紀錄"} · {record.occurredOn}
        </DialogDescription>
      </DialogHeader>

      <div className="rounded-card border border-border bg-secondary/30 p-4">
        <p className="text-caption text-muted-foreground">金額</p>
        <p
          className={`mt-1 text-heading ${
            isIncome ? "text-income" : "text-expense"
          }`}
        >
          {isIncome ? "+" : "-"}
          {formatAmount(record.amountCents)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DetailField
          icon={<CalendarDays />}
          label="日期"
          value={record.occurredOn}
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
          label={isIncome ? "來源成員" : "付款方式"}
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

      <div className="flex justify-end">
        <DialogClose asChild>
          <Button variant="outline">關閉</Button>
        </DialogClose>
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
    return memberNames[record.sourceMemberId] ?? "家庭成員收入";
  }

  if (record.paymentSource === "member") {
    return record.payerMemberId
      ? `${memberNames[record.payerMemberId] ?? "成員"}代墊`
      : "成員代墊";
  }

  return "基金支出";
}

function ledgerRecordStatusLabel(record: LedgerRecord): string {
  if (record.type === "income") {
    return "已入帳";
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
