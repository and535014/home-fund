"use client";

import { useEffect, useRef } from "react";
import { HandCoins } from "lucide-react";

import { RecordListItem } from "@/app/_record-detail/record-list-item";
import {
  formatPaymentDate,
  type ReimbursementPaymentSearchResult,
} from "@/app/_record-detail/reimbursement-payment-ui";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { formatAmount } from "@/lib/format";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";

export function RecordResultsList({
  categoriesById,
  emptyMessage,
  hasMoreRecords,
  memberNames,
  onLoadMoreRecords,
  onOpenRecord,
  onOpenPaymentResult,
  onToggleRecordSelection,
  paymentResults,
  records,
  selectedRecordIds,
}: {
  categoriesById: Record<string, Category>;
  emptyMessage: string;
  hasMoreRecords: boolean;
  memberNames: Record<string, string>;
  onLoadMoreRecords: () => void;
  onOpenRecord: (recordId: string) => void;
  onOpenPaymentResult: (resultId: string) => void;
  onToggleRecordSelection?: (recordId: string) => void;
  paymentResults: ReimbursementPaymentSearchResult[];
  records: LedgerRecord[];
  selectedRecordIds?: Set<string>;
}) {
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMoreRecords) {
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

  if (records.length === 0 && paymentResults.length === 0) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center px-4 py-8 text-center text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <ItemGroup className="h-full min-h-0 overflow-y-auto">
      {records.map((record) => (
        <RecordListItem
          category={categoriesById[record.categoryId]}
          isSelected={selectedRecordIds?.has(record.id) ?? false}
          key={record.id}
          memberNames={memberNames}
          onOpen={() => onOpenRecord(record.id)}
          onToggleSelection={onToggleRecordSelection}
          record={record}
        />
      ))}
      {paymentResults.map((result) => (
        <ReimbursementPaymentListItem
          key={result.id}
          result={result}
          onOpen={() => onOpenPaymentResult(result.id)}
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
  );
}

function ReimbursementPaymentListItem({
  onOpen,
  result,
}: {
  onOpen: () => void;
  result: ReimbursementPaymentSearchResult;
}) {
  return (
    <Item
      asChild
      size="sm"
    >
      <button
        aria-label={`查看付給 ${result.paidToMemberName} 退款紀錄詳情`}
        className="w-full text-left"
        onClick={onOpen}
        type="button"
      >
        <ItemMedia className="self-center! translate-y-0!">
          <ReimbursementPaymentListItemVisual />
        </ItemMedia>

        <ItemContent className="min-w-0">
          <ItemTitle className="max-w-full">
            <span className="truncate">付給 {result.paidToMemberName}</span>
          </ItemTitle>

          <ItemDescription className="truncate">
            {result.methodLabel}
          </ItemDescription>
        </ItemContent>

        <ItemContent className="min-w-0 flex-none items-end text-right">
          <ItemTitle className="max-w-full justify-end text-primary">
            <span className="truncate">{formatAmount(result.amountCents)}</span>
          </ItemTitle>

          <ItemDescription className="truncate">
            {formatPaymentDate(result.paidOn)}
          </ItemDescription>
        </ItemContent>
      </button>
    </Item>
  );
}

function ReimbursementPaymentListItemVisual() {
  return (
    <span
      aria-hidden="true"
      className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
    >
      <HandCoins className="size-4.5" strokeWidth={2.2} />
    </span>
  );
}
