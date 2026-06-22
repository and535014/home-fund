"use client";

import { Button } from "@/components/ui/button";
import { PageFooter } from "@/components/layout/page-layout";
import { cn } from "@/lib/utils";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";
import {
  canBatchDeleteRecord,
  canBatchRefundRecord,
  formatAmount,
  netAmountTone,
  sumRecordNetAmount,
} from "./record-search-batch-utils";

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
    canBatchRefundRecord(actor, record),
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
    <PageFooter className="-mx-5 lg:-mx-6">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-label">
          {isSelectionMode
            ? `已選取 ${selectedCount} 筆`
            : `搜尋結果 ${totalCount} 筆`}
        </span>
        <span className="text-caption text-muted-foreground">總額</span>
        <span className={cn("text-label", netAmountTone(displayedNetCents))}>
          {formatAmount(Math.abs(displayedNetCents))}
        </span>
      </div>
      {isSelectionMode ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={isPending || visibleRecords.length === 0 || hasSelectedAllVisible}
            onClick={onSelectVisible}
            size="sm"
            type="button"
            variant="ghost"
          >
            {hasSelectedAllVisible ? "已全選目前顯示" : "全選目前顯示"}
          </Button>
          {selectedCount > 0 ? (
            <Button
              onClick={onClearSelection}
              size="sm"
              type="button"
              variant="ghost"
            >
              清除選取
            </Button>
          ) : null}
          <Button
            disabled={selectedCount === 0 || deletableCount === 0}
            onClick={onDelete}
            size="sm"
            type="button"
            variant="destructive"
          >
            批次刪除
            {selectedCount > 0 ? ` (${deletableCount})` : ""}
          </Button>
          <Button
            disabled={selectedCount === 0 || refundableCount === 0}
            onClick={onRefund}
            size="sm"
            type="button"
            variant="secondary"
          >
            批次退款
            {selectedCount > 0 ? ` (${refundableCount})` : ""}
          </Button>
        </div>
      ) : null}
    </PageFooter>
  );
}
