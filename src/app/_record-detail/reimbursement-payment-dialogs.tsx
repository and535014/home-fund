"use client";

import type { ReactNode } from "react";
import {
  CalendarDays,
  ListTree,
  StickyNote,
  UserRound,
  WalletCards,
} from "lucide-react";

import { RecordListItem } from "./record-list-item";
import {
  formatPaymentDate,
  type ReimbursementPaymentSearchResult,
} from "./reimbursement-payment-ui";
import { Button } from "@/components/ui/button";
import {
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ItemGroup } from "@/components/ui/item";
import { formatAmount } from "@/lib/format";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";

export function ReimbursementPaymentDetailDialog({
  onOpenLinkedRecords,
  result,
}: {
  onOpenLinkedRecords: () => void;
  result: ReimbursementPaymentSearchResult;
}) {
  return (
    <DialogContent aria-describedby={undefined} className="max-w-xl">
      <DialogHeader>
        <DialogTitle>退款紀錄</DialogTitle>
      </DialogHeader>

      <DialogBody className="grid gap-4">
        <div className="rounded-card border border-border bg-secondary/30 p-4">
          <p className="text-caption text-muted-foreground">金額</p>
          <p className="mt-1 text-heading text-primary">
            {formatAmount(result.amountCents)}
          </p>
        </div>

        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <PaymentDetailField
              icon={<UserRound />}
              label="收款成員"
              value={result.paidToMemberName}
            />
            <PaymentDetailField
              icon={<CalendarDays />}
              label="付款日期"
              value={formatPaymentDate(result.paidOn)}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <PaymentDetailField
              icon={<WalletCards />}
              label="付款方式"
              value={result.methodLabel}
            />
            <PaymentDetailField
              icon={<StickyNote />}
              label="備註"
              value={result.note.trim() || "沒有備註。"}
            />
          </div>
        </div>
      </DialogBody>

      <DialogFooter className="mt-4">
        <Button onClick={onOpenLinkedRecords} type="button" variant="outline">
          <ListTree />
          查看關聯紀錄
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
