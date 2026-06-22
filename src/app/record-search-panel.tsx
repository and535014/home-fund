"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { BatchActionDialog } from "@/app/batch-action-dialog";
import { BatchSearchFooter } from "@/app/batch-search-footer";
import { RecordListDetail } from "@/app/record-list-detail";
import { RecordSearchControls } from "@/app/record-search-controls";
import {
  buildRecordQueryOptions,
  initialRecordQueryState,
  isInitialRecordQuery,
  type RecordQueryState,
} from "@/app/record-query";
import {
  batchDeleteSearchRecordsAction,
  batchRefundSearchRecordsAction,
  loadRecordSearchPageAction,
  type BatchSearchRecordActionResult,
} from "@/app/record-search-actions";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";
import type { SearchRecordCursor } from "@/modules/reporting/record-search-query";

export function RecordSearchPanel({
  actor,
  categories,
  categoriesById,
  memberNames,
}: {
  actor: HouseholdAccessProfile;
  categories: Category[];
  categoriesById: Record<string, Category>;
  memberNames: Record<string, string>;
}) {
  const [query, setQuery] = useState<RecordQueryState>(initialRecordQueryState);
  const [loadedRecords, setLoadedRecords] = useState<LedgerRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<SearchRecordCursor | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalNetAmountCents, setTotalNetAmountCents] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [batchAction, setBatchAction] = useState<"delete" | "refund" | null>(
    null,
  );
  const [isPending, startTransition] = useTransition();
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const queryOptions = useMemo(
    () => buildRecordQueryOptions(categories, memberNames),
    [categories, memberNames],
  );
  const hasActiveQuery = !isInitialRecordQuery(query);
  const displayedRecords = hasActiveQuery ? loadedRecords : [];
  const hasMoreRecords = Boolean(nextCursor);
  const emptyMessage = hasActiveQuery
      ? "沒有符合條件的紀錄。"
      : "請輸入關鍵字或設定篩選條件。";
  const selectedRecords = displayedRecords.filter((record) =>
    selectedRecordIds.has(record.id),
  );

  useEffect(() => {
    let isCurrent = true;

    if (!hasActiveQuery) {
      return;
    }

    startTransition(() => {
      loadRecordSearchPageAction({ query }).then((result) => {
        if (!isCurrent) {
          return;
        }

        if (!result.ok) {
          setLoadedRecords([]);
          setNextCursor(null);
          setTotalCount(0);
          setTotalNetAmountCents(0);
          setLoadError(result.message);
          return;
        }

        setLoadedRecords(result.records);
        setNextCursor(result.nextCursor);
        setTotalCount(result.totalCount);
        setTotalNetAmountCents(result.totalNetAmountCents);
        setLoadError(null);
      });
    });

    return () => {
      isCurrent = false;
    };
  }, [hasActiveQuery, query]);

  function changeQuery(nextQuery: RecordQueryState) {
    setQuery(nextQuery);
    setSelectedRecordIds(new Set());

    if (isInitialRecordQuery(nextQuery)) {
      setLoadedRecords([]);
      setNextCursor(null);
      setTotalCount(0);
      setTotalNetAmountCents(0);
      setLoadError(null);
    }
  }

  function toggleRecordSelection(recordId: string) {
    setSelectedRecordIds((current) => {
      const next = new Set(current);

      if (next.has(recordId)) {
        next.delete(recordId);
      } else {
        next.add(recordId);
      }

      return next;
    });
  }

  function clearSelection() {
    setSelectedRecordIds(new Set());
  }

  function selectVisibleResults() {
    setSelectedRecordIds((current) => {
      const next = new Set(current);
      displayedRecords.forEach((record) => next.add(record.id));
      return next;
    });
  }

  const loadMoreRecords = useCallback(() => {
    if (!nextCursor || isLoadingMore || !hasActiveQuery) {
      return;
    }

    setIsLoadingMore(true);
    loadRecordSearchPageAction({ query, cursor: nextCursor }).then((result) => {
      setIsLoadingMore(false);

      if (!result.ok) {
        setLoadError(result.message);
        return;
      }

      setLoadedRecords((current) => [...current, ...result.records]);
      setNextCursor(result.nextCursor);
      setTotalCount(result.totalCount);
      setTotalNetAmountCents(result.totalNetAmountCents);
      setLoadError(null);
    });
  }, [hasActiveQuery, isLoadingMore, nextCursor, query]);

  function toggleSelectionMode() {
    setIsSelectionMode((current) => {
      const next = !current;

      if (!next) {
        setSelectedRecordIds(new Set());
      }

      return next;
    });
  }

  function reloadCurrentQuery() {
    if (!hasActiveQuery) {
      return;
    }

    startTransition(() => {
      loadRecordSearchPageAction({ query }).then((result) => {
        if (!result.ok) {
          setLoadError(result.message);
          return;
        }

        setLoadedRecords(result.records);
        setNextCursor(result.nextCursor);
        setTotalCount(result.totalCount);
        setTotalNetAmountCents(result.totalNetAmountCents);
        setLoadError(null);
      });
    });
  }

  function completeBatchAction(selectedRecordsForAction: LedgerRecord[]) {
    const recordIds = selectedRecordsForAction.map((record) => record.id);
    const action = batchAction === "delete"
      ? batchDeleteSearchRecordsAction
      : batchRefundSearchRecordsAction;

    startTransition(() => {
      action(recordIds).then((result) => {
        handleBatchActionResult(result);
      });
    });
  }

  function handleBatchActionResult(result: BatchSearchRecordActionResult) {
    if (!result.ok) {
      toast.error(result.message);
      return;
    }

    if (batchAction === "delete") {
      toast.success("已完成批次刪除", {
        description: `已處理 ${result.processedCount} 筆，略過 ${result.skippedCount} 筆。`,
      });
    }

    if (batchAction === "refund") {
      toast.success("已完成批次退款", {
        description: `已處理 ${result.processedCount} 筆，略過 ${result.skippedCount} 筆。`,
      });
    }

    setBatchAction(null);
    clearSelection();
    reloadCurrentQuery();
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <RecordSearchControls
        isSelectionMode={isSelectionMode}
        onChange={changeQuery}
        onToggleSelectionMode={toggleSelectionMode}
        options={queryOptions}
        query={query}
      />
      <RecordListDetail
        actor={actor}
        categories={categories}
        categoriesById={categoriesById}
        emptyMessage={emptyMessage}
        hasMoreRecords={hasMoreRecords}
        memberNames={memberNames}
        onLoadMoreRecords={loadMoreRecords}
        onToggleRecordSelection={
          isSelectionMode ? toggleRecordSelection : undefined
        }
        records={displayedRecords}
        selectedRecordIds={isSelectionMode ? selectedRecordIds : undefined}
      />
      {loadError ? (
        <p className="px-1 text-caption text-expense" role="alert">
          {loadError}
        </p>
      ) : null}
      {hasActiveQuery ? (
        <BatchSearchFooter
          actor={actor}
          isSelectionMode={isSelectionMode}
          isPending={isPending || isLoadingMore}
          onClearSelection={clearSelection}
          onDelete={() => setBatchAction("delete")}
          onRefund={() => setBatchAction("refund")}
          onSelectVisible={selectVisibleResults}
          selectedRecords={selectedRecords}
          selectedCount={selectedRecordIds.size}
          totalCount={totalCount}
          totalNetAmountCents={totalNetAmountCents}
          visibleRecords={displayedRecords}
        />
      ) : null}
      <BatchActionDialog
        action={batchAction}
        actor={actor}
        onCancel={() => setBatchAction(null)}
        onConfirm={completeBatchAction}
        records={selectedRecords}
      />
    </div>
  );
}
