"use client";

import {
  AlertTriangle,
  CheckSquare,
  HandCoins,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

import { RecordListDetail } from "@/app/record-list-detail";
import {
  applyRecordQuery,
  buildRecordQueryOptions,
  initialRecordQueryState,
  isInitialRecordQuery,
  nextDraftQueryForType,
  recordFilterCount,
  type RecordQueryOptions,
  type RecordQueryState,
  type RecordSortOrder,
} from "@/app/record-query";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { PageFooter } from "@/components/layout/page-layout";
import { cn } from "@/lib/utils";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";

const SEARCH_PAGE_SIZE = 30;

export function RecordSearchPanel({
  actor,
  categories,
  categoriesById,
  memberNames,
  records,
}: {
  actor: HouseholdAccessProfile;
  categories: Category[];
  categoriesById: Record<string, Category>;
  memberNames: Record<string, string>;
  records: LedgerRecord[];
}) {
  const [query, setQuery] = useState<RecordQueryState>(initialRecordQueryState);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [visibleRecordCount, setVisibleRecordCount] =
    useState(SEARCH_PAGE_SIZE);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [locallyVoidedIds, setLocallyVoidedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [locallyRefundedIds, setLocallyRefundedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [batchAction, setBatchAction] = useState<"delete" | "refund" | null>(
    null,
  );
  const prototypeRecords = useMemo(
    () =>
      records
        .filter((record) => !locallyVoidedIds.has(record.id))
        .map((record) =>
          locallyRefundedIds.has(record.id) && record.type === "expense"
            ? ({
                ...record,
                reimbursementStatus: "reimbursed",
              } satisfies LedgerRecord)
            : record,
        ),
    [locallyRefundedIds, locallyVoidedIds, records],
  );
  const queryOptions = useMemo(
    () => buildRecordQueryOptions(categories, memberNames),
    [categories, memberNames],
  );
  const filteredRecords = useMemo(
    () => applyRecordQuery(prototypeRecords, query),
    [prototypeRecords, query],
  );
  const hasActiveQuery = !isInitialRecordQuery(query);
  const displayedRecords = hasActiveQuery ? filteredRecords : [];
  const visibleRecords = displayedRecords.slice(0, visibleRecordCount);
  const hasMoreRecords = visibleRecordCount < displayedRecords.length;
  const emptyMessage = records.length === 0
    ? "尚無紀錄。"
    : hasActiveQuery
      ? "沒有符合條件的紀錄。"
      : "請輸入關鍵字或設定篩選條件。";
  const selectedRecords = displayedRecords.filter((record) =>
    selectedRecordIds.has(record.id),
  );

  function changeQuery(nextQuery: RecordQueryState) {
    setQuery(nextQuery);
    setVisibleRecordCount(SEARCH_PAGE_SIZE);
    setSelectedRecordIds(new Set());
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

  function selectAllResults() {
    setSelectedRecordIds(new Set(displayedRecords.map((record) => record.id)));
  }

  const loadMoreRecords = useCallback(() => {
    setVisibleRecordCount((current) =>
      Math.min(current + SEARCH_PAGE_SIZE, displayedRecords.length),
    );
  }, [displayedRecords.length]);

  function toggleSelectionMode() {
    setIsSelectionMode((current) => {
      const next = !current;

      if (!next) {
        setSelectedRecordIds(new Set());
      }

      return next;
    });
  }

  function completeBatchAction(eligibleRecords: LedgerRecord[]) {
    if (batchAction === "delete") {
      setLocallyVoidedIds((current) => {
        const next = new Set(current);
        eligibleRecords.forEach((record) => next.add(record.id));
        return next;
      });
      toast.success("已完成批次刪除", {
        description: `${eligibleRecords.length} 筆紀錄已從目前結果移除。`,
      });
    }

    if (batchAction === "refund") {
      setLocallyRefundedIds((current) => {
        const next = new Set(current);
        eligibleRecords.forEach((record) => next.add(record.id));
        return next;
      });
      toast.success("已完成批次退款", {
        description: `${eligibleRecords.length} 筆紀錄已標記為已退款。`,
      });
    }

    setBatchAction(null);
    clearSelection();
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
        records={visibleRecords}
        selectedRecordIds={isSelectionMode ? selectedRecordIds : undefined}
      />
      {hasActiveQuery ? (
        <BatchSearchFooter
          actor={actor}
          isSelectionMode={isSelectionMode}
          onClearSelection={clearSelection}
          onDelete={() => setBatchAction("delete")}
          onRefund={() => setBatchAction("refund")}
          onSelectAll={selectAllResults}
          records={displayedRecords}
          selectedRecords={selectedRecords}
          selectedCount={selectedRecordIds.size}
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

function BatchSearchFooter({
  actor,
  isSelectionMode,
  onClearSelection,
  onDelete,
  onRefund,
  onSelectAll,
  records,
  selectedCount,
  selectedRecords,
}: {
  actor: HouseholdAccessProfile;
  isSelectionMode: boolean;
  onClearSelection: () => void;
  onDelete: () => void;
  onRefund: () => void;
  onSelectAll: () => void;
  records: LedgerRecord[];
  selectedCount: number;
  selectedRecords: LedgerRecord[];
}) {
  const refundableCount = selectedRecords.filter((record) =>
    canBatchRefundRecord(actor, record),
  ).length;
  const deletableCount = selectedRecords.filter((record) =>
    canBatchDeleteRecord(actor, record),
  ).length;
  const resultNetCents = sumRecordNetAmount(records);
  const selectedNetCents = sumRecordNetAmount(selectedRecords);
  const displayedNetCents = isSelectionMode ? selectedNetCents : resultNetCents;
  const hasSelectedAll = records.length > 0 && selectedCount === records.length;

  return (
    <PageFooter className="-mx-5 lg:-mx-6">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-label">
          {isSelectionMode
            ? `已選取 ${selectedCount} 筆`
            : `搜尋結果 ${records.length} 筆`}
        </span>
        <span className="text-caption text-muted-foreground">總額</span>
        <span className={cn("text-label", netAmountTone(displayedNetCents))}>
          {formatAmount(Math.abs(displayedNetCents))}
        </span>
      </div>
      {isSelectionMode ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={records.length === 0 || hasSelectedAll}
            onClick={onSelectAll}
            size="sm"
            type="button"
            variant="ghost"
          >
            {hasSelectedAll ? "已全選搜尋結果" : "全選搜尋結果"}
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

function BatchActionDialog({
  action,
  actor,
  onCancel,
  onConfirm,
  records,
}: {
  action: "delete" | "refund" | null;
  actor: HouseholdAccessProfile;
  onCancel: () => void;
  onConfirm: (eligibleRecords: LedgerRecord[]) => void;
  records: LedgerRecord[];
}) {
  const isDelete = action === "delete";
  const eligibleRecords = records.filter((record) =>
    isDelete
      ? canBatchDeleteRecord(actor, record)
      : canBatchRefundRecord(actor, record),
  );
  const skippedCount = records.length - eligibleRecords.length;
  const eligibleTotalCents = sumRecordAmounts(eligibleRecords);

  return (
    <Dialog open={Boolean(action)} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isDelete ? "確認批次刪除" : "確認批次退款"}</DialogTitle>
          <DialogDescription>
            {isDelete
              ? "符合條件的紀錄會從目前結果與月報統計中移除。"
              : "符合條件的代墊支出會標記為已退款。"}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-card border border-border p-3">
              <p className="text-caption text-muted-foreground">將處理</p>
              <p className="mt-1 text-heading">{eligibleRecords.length} 筆</p>
            </div>
            <div className="rounded-card border border-border p-3">
              <p className="text-caption text-muted-foreground">略過</p>
              <p className="mt-1 text-heading">{skippedCount} 筆</p>
            </div>
          </div>

          {!isDelete ? (
            <div className="rounded-card border border-border p-3">
              <p className="text-caption text-muted-foreground">退款總金額</p>
              <p className="mt-1 text-heading text-expense">
                {formatAmount(eligibleTotalCents)}
              </p>
            </div>
          ) : null}

          {skippedCount > 0 ? (
            <Alert variant="warning">
              <AlertTriangle />
              <AlertDescription>
                不符合權限、狀態或退款條件的紀錄會保留不變。
              </AlertDescription>
            </Alert>
          ) : null}
        </DialogBody>

        <DialogFooter className="mt-4">
          <Button onClick={onCancel} type="button" variant="outline">
            <X />
            取消
          </Button>
          <Button
            disabled={eligibleRecords.length === 0}
            onClick={() => onConfirm(eligibleRecords)}
            type="button"
            variant={isDelete ? "destructive" : "default"}
          >
            {isDelete ? <Trash2 /> : <HandCoins />}
            {isDelete ? "確認刪除" : "確認退款"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecordSearchControls({
  isSelectionMode,
  onChange,
  onToggleSelectionMode,
  options,
  query,
}: {
  isSelectionMode: boolean;
  onChange: (query: RecordQueryState) => void;
  onToggleSelectionMode: () => void;
  options: RecordQueryOptions;
  query: RecordQueryState;
}) {
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState(query);
  const activeFilterCount = recordFilterCount(query);
  const draftFilterCount = recordFilterCount(draftQuery);
  const draftCategoryOptions = options.categoriesForType(draftQuery.type);
  const draftParticipantOptions = options.participantsForType(draftQuery.type);

  function patchQuery(patch: Partial<RecordQueryState>) {
    onChange({ ...query, ...patch });
  }

  function patchDraftQuery(patch: Partial<RecordQueryState>) {
    setDraftQuery({ ...draftQuery, ...patch });
  }

  function openFilterDialog() {
    setDraftQuery(query);
    setIsFilterDialogOpen(true);
  }

  function applyDraftQuery() {
    onChange({ ...draftQuery, search: query.search });
    setIsFilterDialogOpen(false);
  }

  return (
    <div className="grid shrink-0 gap-3">
      <div className="flex items-center gap-2 p-0.5">
        <label className="relative block min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="搜尋紀錄"
            className="pl-9 pr-9"
            onChange={(event) =>
              patchQuery({ search: event.currentTarget.value })
            }
            placeholder="搜尋紀錄"
            value={query.search}
          />
          {query.search ? (
            <Button
              aria-label="清除搜尋"
              className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
              onClick={() => patchQuery({ search: "" })}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X />
            </Button>
          ) : null}
        </label>

        <Button
          aria-label={isSelectionMode ? "關閉選取模式" : "開啟選取模式"}
          aria-pressed={isSelectionMode}
          className={cn(
            isSelectionMode &&
              "relative z-10 border-primary/70 bg-primary/15 text-primary ring-2 ring-inset ring-primary/35 hover:bg-primary/20",
          )}
          onClick={onToggleSelectionMode}
          size="icon"
          type="button"
          variant={isSelectionMode ? "secondary" : "outline"}
        >
          <CheckSquare />
        </Button>

        <Button
          aria-label={
            activeFilterCount > 0
              ? `開啟篩選，已設定 ${activeFilterCount} 個條件`
              : "開啟篩選"
          }
          className={cn(
            activeFilterCount > 0 &&
              "relative z-10 border-primary/70 bg-primary/15 text-primary ring-2 ring-inset ring-primary/35 hover:bg-primary/20",
          )}
          size="icon"
          onClick={openFilterDialog}
          type="button"
          variant={activeFilterCount > 0 ? "secondary" : "outline"}
        >
          <SlidersHorizontal />
        </Button>
      </div>

      <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>篩選與排序</DialogTitle>
            <DialogDescription className="sr-only">
              設定搜尋頁的紀錄篩選條件與排序方式。
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-label">
                類型
                <NativeSelect
                  aria-label="依類型篩選"
                  onChange={(event) => {
                    setDraftQuery(
                      nextDraftQueryForType(
                        draftQuery,
                        event.currentTarget.value,
                        options.activeCategories,
                      ),
                    );
                  }}
                  value={draftQuery.type}
                >
                  <option value="all">全部</option>
                  <option value="income">收入</option>
                  <option value="expense">支出</option>
                </NativeSelect>
              </label>

              <label className="grid gap-2 text-label">
                分類
                <NativeSelect
                  aria-label="依分類篩選"
                  onChange={(event) =>
                    patchDraftQuery({ categoryId: event.currentTarget.value })
                  }
                  value={draftQuery.categoryId}
                >
                  <option value="all">全部</option>
                  {draftCategoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </NativeSelect>
              </label>

              <label className="grid gap-2 text-label">
                收支對象
                <NativeSelect
                  aria-label="依收支對象篩選"
                  onChange={(event) =>
                    patchDraftQuery({ participant: event.currentTarget.value })
                  }
                  value={draftQuery.participant}
                >
                  <option value="all">全部</option>
                  {draftParticipantOptions.map((participant) => (
                    <option key={participant.value} value={participant.value}>
                      {participant.label}
                    </option>
                  ))}
                </NativeSelect>
              </label>

              <label className="grid gap-2 text-label">
                退款狀態
                <NativeSelect
                  aria-label="依退款狀態篩選"
                  onChange={(event) =>
                    patchDraftQuery({
                      reimbursementStatus: event.currentTarget.value,
                    })
                  }
                  value={draftQuery.reimbursementStatus}
                >
                  <option value="all">全部</option>
                  <option value="refunded">已退款</option>
                  <option value="unrefunded">未退款</option>
                </NativeSelect>
              </label>

              <label className="grid gap-2 text-label">
                開始日期
                <Input
                  aria-label="開始日期"
                  onChange={(event) =>
                    patchDraftQuery({ dateFrom: event.currentTarget.value })
                  }
                  type="date"
                  value={draftQuery.dateFrom}
                />
              </label>

              <label className="grid gap-2 text-label">
                結束日期
                <Input
                  aria-label="結束日期"
                  onChange={(event) =>
                    patchDraftQuery({ dateTo: event.currentTarget.value })
                  }
                  type="date"
                  value={draftQuery.dateTo}
                />
              </label>
            </div>

            <label className="grid gap-2 text-label">
              排序
              <NativeSelect
                aria-label="紀錄排序"
                onChange={(event) =>
                  patchDraftQuery({
                    sort: event.currentTarget.value as RecordSortOrder,
                  })
                }
                value={draftQuery.sort}
              >
                <option value="newest">新到舊</option>
                <option value="oldest">舊到新</option>
                <option value="amount_desc">金額高到低</option>
                <option value="amount_asc">金額低到高</option>
              </NativeSelect>
            </label>
          </DialogBody>

          <DialogFooter className="mt-4">
            {draftFilterCount > 0 ? (
              <Button
                onClick={() => {
                  setDraftQuery({
                    ...initialRecordQueryState,
                    search: query.search,
                  });
                }}
                type="button"
                variant="outline"
              >
                <X />
                清除
              </Button>
            ) : null}
            <Button onClick={applyDraftQuery} type="button">
              套用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function canBatchDeleteRecord(
  actor: HouseholdAccessProfile,
  record: LedgerRecord,
): boolean {
  const isOwner = actor.id === record.createdByMemberId;
  const isAdmin = actor.roles.includes("admin");
  const isReimbursedExpense =
    record.type === "expense" && record.reimbursementStatus === "reimbursed";

  return (
    record.status === "active" && !isReimbursedExpense && (isAdmin || isOwner)
  );
}

function canBatchRefundRecord(
  actor: HouseholdAccessProfile,
  record: LedgerRecord,
): boolean {
  const canPerformReimbursement =
    actor.roles.includes("admin") || actor.roles.includes("finance_manager");

  return (
    canPerformReimbursement &&
    record.type === "expense" &&
    record.status === "active" &&
    record.paymentSource === "member" &&
    record.reimbursementStatus === "refundable"
  );
}

function sumRecordNetAmount(records: LedgerRecord[]): number {
  return records.reduce(
    (total, record) =>
      total +
      (record.type === "income" ? record.amountCents : -record.amountCents),
    0,
  );
}

function sumRecordAmounts(records: LedgerRecord[]): number {
  return records.reduce((total, record) => total + record.amountCents, 0);
}

function formatAmount(amountCents: number): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function netAmountTone(amountCents: number): string {
  if (amountCents > 0) {
    return "text-income";
  }

  if (amountCents < 0) {
    return "text-expense";
  }

  return "text-muted-foreground";
}
