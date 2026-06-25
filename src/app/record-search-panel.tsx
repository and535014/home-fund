"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import type { ReactNode } from "react";
import {
  CalendarDays,
  HandCoins,
  ReceiptText,
  StickyNote,
  UserRound,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";

import { BatchDeleteDialog } from "@/app/batch-delete-dialog";
import { BatchRefundDialog } from "@/app/batch-refund-dialog";
import { BatchSearchFooter } from "@/app/batch-search-footer";
import {
  RecordDetailDialog,
  RecordListItem,
} from "@/app/record-list-detail";
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
import { formatAmount } from "@/lib/format";
import {
  Dialog,
  DialogBody,
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

type ReimbursementPaymentSearchResult = {
  id: string;
  amountCents: number;
  linkedRecordName: string;
  methodLabel: string;
  note: string;
  paidOn: string;
  paidToMemberName: string;
};

const reimbursementPaymentPrototypeResults: ReimbursementPaymentSearchResult[] = [
  {
    id: "prototype-reimbursement-payment-1",
    amountCents: 128000,
    linkedRecordName: "網路費代墊",
    methodLabel: "銀行轉帳",
    note: "末五碼 5521",
    paidOn: "2026-06-18",
    paidToMemberName: "小美",
  },
];

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
  const [selectedDetailRecordId, setSelectedDetailRecordId] = useState<string | null>(
    null,
  );
  const [selectedPaymentResultId, setSelectedPaymentResultId] = useState<
    string | null
  >(null);
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
  const isPaymentOnlyQuery = query.type === "reimbursement_payment";
  const displayedRecords = hasActiveQuery && !isPaymentOnlyQuery ? loadedRecords : [];
  const displayedPaymentResults = hasActiveQuery
    ? reimbursementPaymentPrototypeResults.filter((result) =>
        reimbursementPaymentResultMatchesQuery(result, query),
      )
    : [];
  const ledgerTotalCount = isPaymentOnlyQuery ? 0 : totalCount;
  const ledgerNetAmountCents = isPaymentOnlyQuery ? 0 : totalNetAmountCents;
  const combinedTotalCount = ledgerTotalCount + displayedPaymentResults.length;
  const hasMoreRecords = !isPaymentOnlyQuery && Boolean(nextCursor);
  const emptyMessage = hasActiveQuery
      ? "沒有符合條件的紀錄。"
      : "請輸入關鍵字或設定篩選條件。";
  const selectedRecords = displayedRecords.filter((record) =>
    selectedRecordIds.has(record.id),
  );
  const selectedDetailRecord =
    displayedRecords.find((record) => record.id === selectedDetailRecordId) ??
    null;
  const selectedPaymentResult =
    displayedPaymentResults.find((result) => result.id === selectedPaymentResultId) ??
    null;

  useEffect(() => {
    let isCurrent = true;

    if (!hasActiveQuery) {
      return;
    }

    if (isPaymentOnlyQuery) {
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
  }, [hasActiveQuery, isPaymentOnlyQuery, query]);

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
    if (!nextCursor || isLoadingMore || !hasActiveQuery || isPaymentOnlyQuery) {
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
  }, [hasActiveQuery, isLoadingMore, isPaymentOnlyQuery, nextCursor, query]);

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
    if (!hasActiveQuery || isPaymentOnlyQuery) {
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
        payment: {
          method: String(formData?.get("reimbursementMethod") ?? ""),
          paidOn: String(formData?.get("reimbursementPaidOn") ?? ""),
          note: String(formData?.get("reimbursementReference") ?? ""),
        },
      }).then((result) => {
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
      <div className="min-h-0 flex-1 overflow-hidden">
        <CombinedSearchResults
          categoriesById={categoriesById}
          emptyMessage={emptyMessage}
          hasMoreRecords={hasMoreRecords}
          memberNames={memberNames}
          onLoadMoreRecords={loadMoreRecords}
          onOpenRecord={(recordId) => setSelectedDetailRecordId(recordId)}
          onOpenPaymentResult={(resultId) => setSelectedPaymentResultId(resultId)}
          onToggleRecordSelection={
            isSelectionMode ? toggleRecordSelection : undefined
          }
          paymentResults={displayedPaymentResults}
          records={displayedRecords}
          selectedRecordIds={isSelectionMode ? selectedRecordIds : undefined}
        />
      </div>
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
          totalCount={combinedTotalCount}
          totalNetAmountCents={ledgerNetAmountCents}
          visibleRecords={displayedRecords}
        />
      ) : null}
      <BatchDeleteDialog
        actor={actor}
        onCancel={() => setBatchAction(null)}
        onConfirm={completeBatchDelete}
        open={batchAction === "delete"}
        records={selectedRecords}
      />
      <BatchRefundDialog
        actor={actor}
        onCancel={() => setBatchAction(null)}
        onConfirm={completeBatchRefund}
        open={batchAction === "refund"}
        records={selectedRecords}
      />
      <Dialog
        open={Boolean(selectedDetailRecord)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedDetailRecordId(null);
          }
        }}
      >
        {selectedDetailRecord ? (
          <RecordDetailDialog
            actor={actor}
            category={categoriesById[selectedDetailRecord.categoryId]}
            categories={categories}
            categoryName={
              categoriesById[selectedDetailRecord.categoryId]?.name ??
              selectedDetailRecord.categoryId
            }
            memberNames={memberNames}
            onMutationSuccess={() => {
              setSelectedDetailRecordId(null);
              reloadCurrentQuery();
            }}
            onRefresh={reloadCurrentQuery}
            record={selectedDetailRecord}
          />
        ) : null}
      </Dialog>
      <Dialog
        open={Boolean(selectedPaymentResult)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedPaymentResultId(null);
          }
        }}
      >
        {selectedPaymentResult ? (
          <ReimbursementPaymentDetailDialog result={selectedPaymentResult} />
        ) : null}
      </Dialog>
    </div>
  );
}

function CombinedSearchResults({
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
    <ItemGroup className="h-full min-h-0 overflow-y-auto divide-y divide-border">
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
        <ReimbursementPaymentSearchResultItem
          key={result.id}
          onOpen={() => onOpenPaymentResult(result.id)}
          result={result}
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

function ReimbursementPaymentSearchResultItem({
  onOpen,
  result,
}: {
  onOpen: () => void;
  result: ReimbursementPaymentSearchResult;
}) {
  return (
    <Item asChild size="sm">
      <button
        aria-label={`查看${result.linkedRecordName}退款金流詳情`}
        className="w-full text-left"
        onClick={onOpen}
        type="button"
      >
        <ReimbursementPaymentSummaryContent result={result} />
      </button>
    </Item>
  );
}

function ReimbursementPaymentSummaryContent({
  result,
}: {
  result: ReimbursementPaymentSearchResult;
}) {
  return (
    <>
      <ItemMedia className="self-center! translate-y-0!">
        <span
          aria-hidden="true"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
        >
          <HandCoins className="size-[18px]" strokeWidth={2.2} />
        </span>
      </ItemMedia>

      <ItemContent className="min-w-0">
        <ItemTitle className="max-w-full">
          <span className="truncate">{result.linkedRecordName}</span>
        </ItemTitle>

        <ItemDescription className="truncate">
          付給 {result.paidToMemberName}
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
    </>
  );
}

function ReimbursementPaymentDetailDialog({
  result,
}: {
  result: ReimbursementPaymentSearchResult;
}) {
  return (
    <DialogContent aria-describedby={undefined} className="max-w-xl">
      <DialogHeader>
        <DialogTitle>{result.linkedRecordName}</DialogTitle>
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
              icon={<ReceiptText />}
              label="關聯紀錄"
              value={result.linkedRecordName}
            />
            <PaymentDetailField
              icon={<WalletCards />}
              label="付款方式"
              value={result.methodLabel}
            />
          </div>
        </div>

        <div className="rounded-card border border-border p-4">
          <div className="flex items-center gap-2 text-label">
            <StickyNote className="size-4 text-muted-foreground" />
            備註
          </div>
          <p className="mt-2 whitespace-pre-wrap text-body text-muted-foreground">
            {result.note.trim() || "沒有備註。"}
          </p>
        </div>
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

function formatPaymentDate(value: string) {
  return value.replaceAll("-", "/");
}

function reimbursementPaymentResultMatchesQuery(
  result: ReimbursementPaymentSearchResult,
  query: RecordQueryState,
) {
  if (query.type !== "all" && query.type !== "reimbursement_payment") {
    return false;
  }

  if (query.dateFrom && result.paidOn < query.dateFrom) {
    return false;
  }

  if (query.dateTo && result.paidOn > query.dateTo) {
    return false;
  }

  const search = query.search.trim().toLocaleLowerCase("zh-TW");

  if (!search) {
    return query.type === "reimbursement_payment";
  }

  return [
    "退款",
    "退款金流",
    "退款金流紀錄",
    result.linkedRecordName,
    result.methodLabel,
    result.note,
    result.paidOn,
    formatPaymentDate(result.paidOn),
    result.paidToMemberName,
    formatAmount(result.amountCents),
  ]
    .join(" ")
    .toLocaleLowerCase("zh-TW")
    .includes(search);
}
