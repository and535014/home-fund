"use client";

import { CheckSquare, Eraser, HandCoins, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageFooter } from "@/components/layout/page-layout";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";
import {
  canBatchDeleteRecord,
  canBatchReimburseRecord,
  netAmountTone,
  sumRecordNetAmount,
} from "../_lib/record-search-batch-utils";

export function BatchSearchFooter({
  actor,
  isSelectionMode,
  isPending,
  onClearSelection,
  onDelete,
  onRefund,
  onSelectVisible,
  selectedCount,
  selectedRecords,
  totalCount,
  totalNetAmountCents,
  visibleRecords,
}: {
  actor: HouseholdAccessProfile;
  isSelectionMode: boolean;
  isPending: boolean;
  onClearSelection: () => void;
  onDelete: () => void;
  onRefund: () => void;
  onSelectVisible: () => void;
  selectedCount: number;
  selectedRecords: LedgerRecord[];
  totalCount: number;
  totalNetAmountCents: number;
  visibleRecords: LedgerRecord[];
}) {
  const refundableCount = selectedRecords.filter((record) =>
    canBatchReimburseRecord(actor, record),
  ).length;
  const deletableCount = selectedRecords.filter((record) =>
    canBatchDeleteRecord(actor, record),
  ).length;
  const selectedNetCents = sumRecordNetAmount(selectedRecords);
  const displayedNetCents = isSelectionMode ? selectedNetCents : totalNetAmountCents;
  const hasSelectedAllVisible =
    visibleRecords.length > 0 &&
    visibleRecords.every((record) =>
      selectedRecords.some((selectedRecord) => selectedRecord.id === record.id),
    );

  return (
    <PageFooter className="-mx-4 gap-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:-mx-5 sm:pb-3 lg:-mx-6">
      <SearchSummaryContent
        amountToneClassName={netAmountTone(displayedNetCents)}
        label={isSelectionMode ? `已選取 ${selectedCount} 筆` : undefined}
        totalAmountCents={displayedNetCents}
        totalCount={totalCount}
      />
      {isSelectionMode ? (
        <div className="flex min-w-0 items-start justify-between gap-3 sm:flex-wrap sm:items-center">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <Button
              aria-label={hasSelectedAllVisible ? "已全選目前顯示" : "全選目前顯示"}
              className="sm:h-9 sm:w-auto sm:px-3 sm:has-[>svg]:px-2.5"
              disabled={isPending || visibleRecords.length === 0 || hasSelectedAllVisible}
              onClick={onSelectVisible}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <CheckSquare aria-hidden="true" className="sm:hidden" />
              <span className="sr-only sm:not-sr-only">
                {hasSelectedAllVisible ? "已全選目前顯示" : "全選目前顯示"}
              </span>
            </Button>
            {selectedCount > 0 ? (
              <Button
                aria-label="清除選取"
                className="sm:h-9 sm:w-auto sm:px-3 sm:has-[>svg]:px-2.5"
                onClick={onClearSelection}
                size="icon-sm"
                type="button"
                variant="ghost"
              >
                <Eraser aria-hidden="true" className="sm:hidden" />
                <span className="sr-only sm:not-sr-only">清除選取</span>
              </Button>
            ) : null}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              aria-label={
                selectedCount > 0 ? `批次刪除 ${deletableCount} 筆` : "批次刪除"
              }
              className="sm:h-9 sm:w-auto sm:px-3 sm:has-[>svg]:px-2.5"
              disabled={selectedCount === 0 || deletableCount === 0}
              onClick={onDelete}
              size="icon-sm"
              type="button"
              variant="destructive"
            >
              <Trash2 aria-hidden="true" className="sm:hidden" />
              <span className="sr-only sm:not-sr-only">
                批次刪除
                {selectedCount > 0 ? ` ${deletableCount} 筆` : ""}
              </span>
            </Button>
            <Button
              aria-label={
                selectedCount > 0 ? `批次退款 ${refundableCount} 筆` : "批次退款"
              }
              className="sm:h-9 sm:w-auto sm:px-3 sm:has-[>svg]:px-2.5"
              disabled={selectedCount === 0 || refundableCount === 0}
              onClick={onRefund}
              size="icon-sm"
              type="button"
              variant="secondary"
            >
              <HandCoins aria-hidden="true" className="sm:hidden" />
              <span className="sr-only sm:not-sr-only">
                批次退款
                {selectedCount > 0 ? ` ${refundableCount} 筆` : ""}
              </span>
            </Button>
          </div>
        </div>
      ) : null}
    </PageFooter>
  );
}

export function SearchSummaryFooter({
  amountToneClassName = "text-primary",
  totalAmountCents,
  totalCount,
}: {
  amountToneClassName?: string;
  totalAmountCents: number;
  totalCount: number;
}) {
  return (
    <PageFooter className="-mx-4 gap-3 pb-[calc(env(safe-area-inset-bottom)+1rem)] sm:-mx-5 sm:pb-3 lg:-mx-6">
      <SearchSummaryContent
        amountToneClassName={amountToneClassName}
        totalAmountCents={totalAmountCents}
        totalCount={totalCount}
      />
    </PageFooter>
  );
}

function SearchSummaryContent({
  amountToneClassName,
  label,
  totalAmountCents,
  totalCount,
}: {
  amountToneClassName: string;
  label?: string;
  totalAmountCents: number;
  totalCount: number;
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3">
      <span className="text-label">{label ?? `搜尋結果 ${totalCount} 筆`}</span>
      <div className="flex min-w-0 items-center gap-2 text-right">
        <span className="text-caption text-muted-foreground">總額</span>
        <span className={cn("text-label", amountToneClassName)}>
          {formatAmount(Math.abs(totalAmountCents))}
        </span>
      </div>
    </div>
  );
}
