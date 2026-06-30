"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

import { BatchDeleteDialog } from "./batch-delete-dialog";
import { BatchRefundDialog } from "./batch-refund-dialog";
import {
  BatchSearchFooter,
  SearchSummaryFooter,
} from "./batch-search-footer";
import {
  RecordDetailFlowDialogs,
  useRecordDetailFlow,
} from "@/app/_record-detail/record-detail-flow";
import {
  RecordSearchControls,
  type SearchSurface,
} from "./record-search-controls";
import { RecordResultsList } from "./record-results-list";
import type { ReimbursementPaymentSearchResult } from "@/app/_record-detail/reimbursement-payment-ui";
import {
  buildRecordQueryOptions,
  initialRecordQueryState,
  isInitialRecordQuery,
  type RecordQueryState,
} from "@/modules/fund-ledger/search/record-search-state";
import {
  batchDeleteSearchRecordsAction,
  batchRefundSearchRecordsAction,
  loadReimbursementPaymentSearchPageAction,
  loadRecordSearchPageAction,
  type BatchSearchRecordActionState,
} from "../_actions/record-search-actions";
import { loadReimbursementPaymentsByLedgerRecordIdsAction } from "@/app/_record-detail/reimbursement-payment-readback-actions";
import {
  type ReimbursementPaymentSearchResult as UpdatedReimbursementPaymentSearchResult,
} from "@/app/_record-detail/reimbursement-payment-ui";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";
import { loadReimbursementPaymentForLedgerRecord } from "@/app/_record-detail/reimbursement-payment-loader";
import {
  initialReimbursementPaymentQueryState,
  isInitialReimbursementPaymentQuery,
  type ReimbursementPaymentQueryState,
  type ReimbursementPaymentSearchCursor,
} from "@/modules/reimbursement/reimbursement-payment-search-query";
import type { SearchRecordCursor } from "@/modules/fund-ledger/search/record-search-query";
import { readBatchRefundPaymentFormData } from "@/app/_reimbursement/batch-refund-client";
import { isPendingRecurringOccurrenceRecordId } from "@/modules/recurring/recurring-occurrence-query";

export function RecordSearchPanel({
  actor,
  canEditReimbursementPayments,
  categories,
  categoriesById,
  memberNames,
}: {
  actor: HouseholdAccessProfile;
  canEditReimbursementPayments: boolean;
  categories: Category[];
  categoriesById: Record<string, Category>;
  memberNames: Record<string, string>;
}) {
  const [query, setQuery] = useState<RecordQueryState>(initialRecordQueryState);
  const [activeSurface, setActiveSurface] = useState<SearchSurface>("records");
  const [paymentQuery, setPaymentQuery] =
    useState<ReimbursementPaymentQueryState>(
      initialReimbursementPaymentQueryState,
    );
  const [loadedRecords, setLoadedRecords] = useState<LedgerRecord[]>([]);
  const [nextCursor, setNextCursor] = useState<SearchRecordCursor | null>(null);
  const [loadedPaymentResults, setLoadedPaymentResults] = useState<
    ReimbursementPaymentSearchResult[]
  >([]);
  const [reimbursementPaymentByRecordId, setReimbursementPaymentByRecordId] = useState<
    Record<string, ReimbursementPaymentSearchResult | null>
  >({});
  const [nextPaymentCursor, setNextPaymentCursor] =
    useState<ReimbursementPaymentSearchCursor | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalNetAmountCents, setTotalNetAmountCents] = useState(0);
  const [totalPaymentCount, setTotalPaymentCount] = useState(0);
  const [totalPaymentAmountCents, setTotalPaymentAmountCents] = useState(0);
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
  const hasActivePaymentQuery = !isInitialReimbursementPaymentQuery(paymentQuery);
  const isRecordSurface = activeSurface === "records";
  const isPaymentSurface = activeSurface === "reimbursements";
  const pendingRecurringRecordIds = loadedRecords
    .filter((record) => isPendingRecurringOccurrenceRecordId(record.id))
    .map((record) => record.id);
  const displayedRecords = isRecordSurface
    ? hasActiveQuery ? loadedRecords : []
    : [];
  const displayedPaymentResults = isPaymentSurface && hasActivePaymentQuery
    ? loadedPaymentResults
    : [];
  const ledgerTotalCount = isRecordSurface ? totalCount : 0;
  const ledgerNetAmountCents = isRecordSurface ? totalNetAmountCents : 0;
  const hasMoreRecords = isRecordSurface && Boolean(nextCursor);
  const hasMorePaymentResults =
    isPaymentSurface && hasActivePaymentQuery && Boolean(nextPaymentCursor);
  const isBatchActionPending = isPending && batchAction !== null;
  const emptyMessage = isRecordSurface && hasActiveQuery
      ? "沒有符合條件的紀錄。"
      : isPaymentSurface && hasActivePaymentQuery
        ? "沒有符合條件的退款紀錄。"
        : "請輸入關鍵字或設定篩選條件。";
  const selectedRecords = displayedRecords.filter((record) =>
    selectedRecordIds.has(record.id) &&
    !isPendingRecurringOccurrenceRecordId(record.id),
  );
  const detailFlow = useRecordDetailFlow({
    loadPaymentForRecord: loadReimbursementPaymentDetailForLedgerRecord,
    onPaymentUpdated: syncReimbursementPaymentUpdate,
    onRefresh: reloadCurrentQuery,
    pendingRecurringRecordIds,
    records: displayedRecords,
  });

  useEffect(() => {
    let isCurrent = true;

    if (!hasActiveQuery || !isRecordSurface) {
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
  }, [hasActiveQuery, isRecordSurface, query]);

  useEffect(() => {
    if (!isRecordSurface || loadedRecords.length === 0) {
      return;
    }

    const candidateRecordIds = loadedRecords
      .filter(
        (record) =>
          isReimbursedMemberPaidExpense(record) &&
          !(record.id in reimbursementPaymentByRecordId),
      )
      .map((record) => record.id);

    if (candidateRecordIds.length === 0) {
      return;
    }

    loadReimbursementPaymentsByLedgerRecordIdsAction(candidateRecordIds).then((result) => {
      if (!result.ok) {
        setLoadError(result.message);
        return;
      }

      setReimbursementPaymentByRecordId((current) => ({
        ...current,
        ...result.recordsByLedgerRecordId,
      }));
      setLoadError(null);
    });
  }, [isRecordSurface, loadedRecords, reimbursementPaymentByRecordId]);

  useEffect(() => {
    let isCurrent = true;

    if (!isPaymentSurface || !hasActivePaymentQuery) {
      return;
    }

    startTransition(() => {
      loadReimbursementPaymentSearchPageAction({ query: paymentQuery }).then((result) => {
        if (!isCurrent) {
          return;
        }

        if (!result.ok) {
          setLoadedPaymentResults([]);
          setNextPaymentCursor(null);
          setTotalPaymentCount(0);
          setTotalPaymentAmountCents(0);
          setLoadError(result.message);
          return;
        }

        setLoadedPaymentResults(result.records);
        setNextPaymentCursor(result.nextCursor);
        setTotalPaymentCount(result.totalCount);
        setTotalPaymentAmountCents(result.totalAmountCents);
        setLoadError(null);
      });
    });

    return () => {
      isCurrent = false;
    };
  }, [hasActivePaymentQuery, isPaymentSurface, paymentQuery]);

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

  function changePaymentQuery(nextQuery: ReimbursementPaymentQueryState) {
    setPaymentQuery(nextQuery);
    detailFlow.closeAll();
    setNextPaymentCursor(null);

    if (isInitialReimbursementPaymentQuery(nextQuery)) {
      setLoadedPaymentResults([]);
      setTotalPaymentCount(0);
      setTotalPaymentAmountCents(0);
      setLoadError(null);
    }
  }

  function changeSurface(nextSurface: SearchSurface) {
    setActiveSurface(nextSurface);
    setSelectedRecordIds(new Set());
    detailFlow.closeAll();
    setLoadError(null);
    setIsSelectionMode(false);
  }

  function toggleRecordSelection(recordId: string) {
    if (isPendingRecurringOccurrenceRecordId(recordId)) {
      return;
    }

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
      displayedRecords
        .filter((record) => !isPendingRecurringOccurrenceRecordId(record.id))
        .forEach((record) => next.add(record.id));
      return next;
    });
  }

  function loadReimbursementPaymentDetailForLedgerRecord(
    record: LedgerRecord,
    onLoaded: (payment: ReimbursementPaymentSearchResult) => void,
  ) {
    const cachedReimbursementPayment = reimbursementPaymentByRecordId[record.id];

    if (cachedReimbursementPayment) {
      onLoaded(cachedReimbursementPayment);
      return;
    }

    loadReimbursementPaymentForLedgerRecord(record, (payment) => {
      setReimbursementPaymentByRecordId((current) => ({
        ...current,
        [record.id]: payment,
      }));
      onLoaded(payment);
    });
  }

  const loadMoreRecords = useCallback(() => {
    if (!nextCursor || isLoadingMore || !hasActiveQuery || !isRecordSurface) {
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
  }, [hasActiveQuery, isLoadingMore, isRecordSurface, nextCursor, query]);

  const loadMorePaymentResults = useCallback(() => {
    if (
      !nextPaymentCursor ||
      isLoadingMore ||
      !isPaymentSurface ||
      !hasActivePaymentQuery
    ) {
      return;
    }

    setIsLoadingMore(true);
    loadReimbursementPaymentSearchPageAction({
      query: paymentQuery,
      cursor: nextPaymentCursor,
    }).then((result) => {
      setIsLoadingMore(false);

      if (!result.ok) {
        setLoadError(result.message);
        return;
      }

      setLoadedPaymentResults((current) => [...current, ...result.records]);
      setNextPaymentCursor(result.nextCursor);
      setTotalPaymentCount(result.totalCount);
      setTotalPaymentAmountCents(result.totalAmountCents);
      setLoadError(null);
    });
  }, [
    hasActivePaymentQuery,
    isLoadingMore,
    isPaymentSurface,
    nextPaymentCursor,
    paymentQuery,
  ]);

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
    if (!hasActiveQuery || !isRecordSurface) {
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

  function reloadCurrentPaymentQuery() {
    if (!hasActivePaymentQuery || !isPaymentSurface) {
      return;
    }

    startTransition(() => {
      loadReimbursementPaymentSearchPageAction({ query: paymentQuery }).then((result) => {
        if (!result.ok) {
          setLoadError(result.message);
          return;
        }

        setLoadedPaymentResults(result.records);
        setNextPaymentCursor(result.nextCursor);
        setTotalPaymentCount(result.totalCount);
        setTotalPaymentAmountCents(result.totalAmountCents);
        setLoadError(null);
      });
    });
  }

  function syncReimbursementPaymentUpdate(
    record: UpdatedReimbursementPaymentSearchResult,
  ) {
    setLoadedPaymentResults((current) =>
      current.map((payment) =>
        payment.id === record.id ? record : payment,
      ),
    );
    setReimbursementPaymentByRecordId((current) => {
      const next = { ...current };

      record.linkedRecords.forEach((linkedRecord) => {
        next[linkedRecord.id] = record;
      });

      return next;
    });
    reloadCurrentPaymentQuery();
  }

  function completeBatchDelete(selectedRecordsForAction: LedgerRecord[]) {
    const recordIds = selectedRecordsForAction.map((record) => record.id);

    startTransition(() => {
      batchDeleteSearchRecordsAction(recordIds).then((result) => {
        handleBatchActionResult(result);
      });
    });
  }

  function completeBatchRefund(
    selectedRecordsForAction: LedgerRecord[],
    formData: FormData,
  ) {
    const recordIds = selectedRecordsForAction.map((record) => record.id);

    startTransition(() => {
      batchRefundSearchRecordsAction({
        recordIds,
        payment: readBatchRefundPaymentFormData(formData),
      }).then((result) => {
        handleBatchActionResult(result);
      });
    });
  }

  function handleBatchActionResult(actionState: BatchSearchRecordActionState) {
    if (actionState.status !== "success" || actionState.ok !== true) {
      toast.error(actionState.message ?? "批次操作失敗，請稍後再試。");
      return;
    }

    if (!actionState.data) {
      toast.error("批次操作已完成，但回傳資料不完整，請重新整理確認狀態。");
      reloadCurrentQuery();
      return;
    }

    if (batchAction === "delete") {
      toast.success("已完成批次刪除", {
        description: `已處理 ${actionState.data.processedCount} 筆，略過 ${actionState.data.skippedCount} 筆。`,
      });
    }

    if (batchAction === "refund") {
      toast.success("已完成批次退款", {
        description: `已處理 ${actionState.data.processedCount} 筆，略過 ${actionState.data.skippedCount} 筆。`,
      });
    }

    setBatchAction(null);
    clearSelection();
    reloadCurrentQuery();
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <RecordSearchControls
        activeSurface={activeSurface}
        isSelectionMode={isSelectionMode}
        onChange={changeQuery}
        onPaymentQueryChange={changePaymentQuery}
        onSurfaceChange={changeSurface}
        onToggleSelectionMode={toggleSelectionMode}
        options={queryOptions}
        paymentQuery={paymentQuery}
        query={query}
      />
      <div className="min-h-0 flex-1 overflow-hidden">
        <RecordResultsList
          categoriesById={categoriesById}
          emptyMessage={emptyMessage}
          hasMoreRecords={hasMoreRecords || hasMorePaymentResults}
          memberNames={memberNames}
          onLoadMoreRecords={
            isPaymentSurface ? loadMorePaymentResults : loadMoreRecords
          }
          onOpenRecord={detailFlow.openRecord}
          onOpenPaymentResult={(resultId) => {
            const result =
              loadedPaymentResults.find((candidate) => candidate.id === resultId) ??
              null;

            if (result) {
              detailFlow.openPaymentResult(result);
            }
          }}
          onToggleRecordSelection={
            isSelectionMode ? toggleRecordSelection : undefined
          }
          paymentResults={displayedPaymentResults}
          pendingRecurringRecordIds={pendingRecurringRecordIds}
          records={displayedRecords}
          selectedRecordIds={isSelectionMode ? selectedRecordIds : undefined}
        />
      </div>
      {loadError ? (
        <p className="px-1 text-caption text-expense" role="alert">
          {loadError}
        </p>
      ) : null}
      {isRecordSurface && hasActiveQuery ? (
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
          totalCount={ledgerTotalCount}
          totalNetAmountCents={ledgerNetAmountCents}
          visibleRecords={displayedRecords}
        />
      ) : null}
      {isPaymentSurface && hasActivePaymentQuery ? (
        <SearchSummaryFooter
          totalAmountCents={totalPaymentAmountCents}
          totalCount={totalPaymentCount}
        />
      ) : null}
      <BatchDeleteDialog
        actor={actor}
        isPending={isBatchActionPending}
        onCancel={() => setBatchAction(null)}
        onConfirm={completeBatchDelete}
        open={batchAction === "delete"}
        records={selectedRecords}
      />
      <BatchRefundDialog
        actor={actor}
        isPending={isBatchActionPending}
        onCancel={() => setBatchAction(null)}
        onConfirm={completeBatchRefund}
        open={batchAction === "refund"}
        records={selectedRecords}
      />
      <RecordDetailFlowDialogs
        actor={actor}
        canEditReimbursementPayments={canEditReimbursementPayments}
        categories={categories}
        categoriesById={categoriesById}
        flow={detailFlow}
        memberNames={memberNames}
      />
    </div>
  );
}

function isReimbursedMemberPaidExpense(record: LedgerRecord) {
  return (
    record.type === "expense" &&
    record.paymentSource === "member" &&
    record.reimbursementStatus === "reimbursed"
  );
}
