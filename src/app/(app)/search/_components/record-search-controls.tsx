"use client";

import { CheckSquare, Search, SlidersHorizontal, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  initialReimbursementPaymentQueryState,
  type ReimbursementPaymentQueryState,
} from "@/modules/reporting/reimbursement-payment-search-query";
import {
  initialRecordQueryState,
  nextDraftQueryForParticipant,
  nextDraftQueryForReimbursementStatus,
  nextDraftQueryForType,
  recordFilterCount,
  type RecordQueryOptions,
  type RecordQueryState,
} from "@/modules/reporting/record-query";

export type SearchSurface = "records" | "reimbursements";

export function RecordSearchControls({
  activeSurface,
  isSelectionMode,
  onChange,
  onPaymentQueryChange,
  onSurfaceChange,
  onToggleSelectionMode,
  options,
  paymentQuery,
  query,
}: {
  activeSurface: SearchSurface;
  isSelectionMode: boolean;
  onChange: (query: RecordQueryState) => void;
  onPaymentQueryChange: (query: ReimbursementPaymentQueryState) => void;
  onSurfaceChange: (surface: SearchSurface) => void;
  onToggleSelectionMode: () => void;
  options: RecordQueryOptions;
  paymentQuery: ReimbursementPaymentQueryState;
  query: RecordQueryState;
}) {
  const router = useRouter();
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState(query);
  const [draftPaymentQuery, setDraftPaymentQuery] = useState(paymentQuery);
  const activeFilterCount = recordFilterCount(query);
  const draftFilterCount = recordFilterCount(draftQuery);
  const activePaymentFilterCount = reimbursementRecordFilterCount(paymentQuery);
  const draftPaymentFilterCount =
    reimbursementRecordFilterCount(draftPaymentQuery);
  const draftCategoryOptions = options.categoriesForType(draftQuery.type);
  const draftParticipantOptions = options.participantsForType(draftQuery.type);
  const isPaymentSurface = activeSurface === "reimbursements";
  const currentSearch = isPaymentSurface ? paymentQuery.search : query.search;
  const currentFilterCount = isPaymentSurface
    ? activePaymentFilterCount
    : activeFilterCount;

  function patchQuery(patch: Partial<RecordQueryState>) {
    onChange({ ...query, ...patch });
  }

  function patchPaymentQuery(patch: Partial<ReimbursementPaymentQueryState>) {
    onPaymentQueryChange({ ...paymentQuery, ...patch });
  }

  function patchDraftQuery(patch: Partial<RecordQueryState>) {
    setDraftQuery({ ...draftQuery, ...patch });
  }

  function openFilterDialog() {
    setDraftQuery(query);
    setDraftPaymentQuery(paymentQuery);
    setIsFilterDialogOpen(true);
  }

  function applyDraftQuery() {
    if (isPaymentSurface) {
      onPaymentQueryChange({ ...draftPaymentQuery, search: paymentQuery.search });
    } else {
      onChange({ ...draftQuery, search: query.search });
    }
    setIsFilterDialogOpen(false);
  }

  function navigateBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <div className="grid shrink-0 gap-3">
      <div className="flex items-center gap-2">
        <Tabs
          className="min-w-0 flex-1 gap-0"
          onValueChange={(value) => onSurfaceChange(value as SearchSurface)}
          value={activeSurface}
        >
          <TabsList aria-label="搜尋類型" className="w-full" variant="line">
            <TabsTrigger value="records">收支紀錄</TabsTrigger>
            <TabsTrigger value="reimbursements">退款紀錄</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          aria-label="關閉搜尋頁"
          className="md:hidden"
          onClick={navigateBack}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X />
        </Button>
      </div>

      <div className="flex items-center gap-2 p-0.5">
        <label className="relative block min-w-0 flex-1">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            aria-label="搜尋紀錄"
            className="pl-9 pr-9"
            onChange={(event) => {
              if (isPaymentSurface) {
                patchPaymentQuery({ search: event.currentTarget.value });
              } else {
                patchQuery({ search: event.currentTarget.value });
              }
            }}
            placeholder={isPaymentSurface ? "搜尋退款紀錄" : "搜尋收支紀錄"}
            value={currentSearch}
          />
          {currentSearch ? (
            <Button
              aria-label="清除搜尋"
              className="absolute right-1 top-1/2 size-8 -translate-y-1/2"
              onClick={() => {
                if (isPaymentSurface) {
                  patchPaymentQuery({ search: "" });
                } else {
                  patchQuery({ search: "" });
                }
              }}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <X />
            </Button>
          ) : null}
        </label>

        {!isPaymentSurface ? (
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
        ) : null}

        <Button
          aria-label={
            currentFilterCount > 0
              ? `開啟篩選，已設定 ${currentFilterCount} 個條件`
              : "開啟篩選"
          }
          className={cn(
            currentFilterCount > 0 &&
              "relative z-10 border-primary/70 bg-primary/15 text-primary ring-2 ring-inset ring-primary/35 hover:bg-primary/20",
          )}
          size="icon"
          onClick={openFilterDialog}
          type="button"
          variant={currentFilterCount > 0 ? "secondary" : "outline"}
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
            {isPaymentSurface ? (
              <ReimbursementPaymentFilterFields
                draftPaymentQuery={draftPaymentQuery}
                onChange={(patch) =>
                  setDraftPaymentQuery({ ...draftPaymentQuery, ...patch })
                }
                paidToMemberOptions={options.participants
                  .filter((participant) => participant.value !== "fund")
                  .map((participant) => ({
                    label: participant.label,
                    value: participant.value.replace("member:", ""),
                  }))}
              />
            ) : (
              <RecordFilterFields
                draftCategoryOptions={draftCategoryOptions}
                draftParticipantOptions={draftParticipantOptions}
                draftQuery={draftQuery}
                onChange={(patch) => patchDraftQuery(patch)}
                onParticipantChange={(participant) => {
                  setDraftQuery(
                    nextDraftQueryForParticipant(
                      draftQuery,
                      participant,
                      options.activeCategories,
                    ),
                  );
                }}
                onReimbursementStatusChange={(reimbursementStatus) => {
                  setDraftQuery(
                    nextDraftQueryForReimbursementStatus(
                      draftQuery,
                      reimbursementStatus,
                      options.activeCategories,
                    ),
                  );
                }}
                onTypeChange={(type) => {
                  setDraftQuery(
                    nextDraftQueryForType(
                      draftQuery,
                      type,
                      options.activeCategories,
                    ),
                  );
                }}
              />
            )}
          </DialogBody>

          <DialogFooter className="mt-4">
            {(isPaymentSurface ? draftPaymentFilterCount : draftFilterCount) > 0 ? (
              <Button
                onClick={() => {
                  if (isPaymentSurface) {
                    setDraftPaymentQuery({
                      ...initialReimbursementPaymentQueryState,
                      search: paymentQuery.search,
                    });
                  } else {
                    setDraftQuery({
                      ...initialRecordQueryState,
                      search: query.search,
                    });
                  }
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

function RecordFilterFields({
  draftCategoryOptions,
  draftParticipantOptions,
  draftQuery,
  onChange,
  onParticipantChange,
  onReimbursementStatusChange,
  onTypeChange,
}: {
  draftCategoryOptions: RecordQueryOptions["activeCategories"];
  draftParticipantOptions: { label: string; value: string }[];
  draftQuery: RecordQueryState;
  onChange: (patch: Partial<RecordQueryState>) => void;
  onParticipantChange: (participant: string) => void;
  onReimbursementStatusChange: (reimbursementStatus: string) => void;
  onTypeChange: (type: string) => void;
}) {
  const reimbursementStatusDisabled = draftQuery.type === "income";
  const incomeOptionDisabled =
    draftQuery.participant === "fund" || draftQuery.reimbursementStatus !== "all";

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-2 text-label">
          類型
          <NativeSelect
            aria-label="依類型篩選"
            onChange={(event) => onTypeChange(event.currentTarget.value)}
            value={draftQuery.type}
          >
            <option value="all">全部</option>
            <option disabled={incomeOptionDisabled} value="income">收入</option>
            <option value="expense">支出</option>
          </NativeSelect>
        </label>

        <label className="grid gap-2 text-label">
          分類
          <NativeSelect
            aria-label="依分類篩選"
            onChange={(event) => onChange({ categoryId: event.currentTarget.value })}
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
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-2 text-label">
          收支對象
          <NativeSelect
            aria-label="依收支對象篩選"
            onChange={(event) =>
              onParticipantChange(event.currentTarget.value)
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
            disabled={reimbursementStatusDisabled}
            onChange={(event) =>
              onReimbursementStatusChange(event.currentTarget.value)
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
            onChange={(event) => onChange({ dateFrom: event.currentTarget.value })}
            type="date"
            value={draftQuery.dateFrom}
          />
        </label>

        <label className="grid gap-2 text-label">
          結束日期
          <Input
            aria-label="結束日期"
            onChange={(event) => onChange({ dateTo: event.currentTarget.value })}
            type="date"
            value={draftQuery.dateTo}
          />
        </label>
      </div>

      <SortField
        label="排序"
        onChange={(sort) => onChange({ sort })}
        value={draftQuery.sort}
      />
    </>
  );
}

function ReimbursementPaymentFilterFields({
  draftPaymentQuery,
  onChange,
  paidToMemberOptions,
}: {
  draftPaymentQuery: ReimbursementPaymentQueryState;
  onChange: (patch: Partial<ReimbursementPaymentQueryState>) => void;
  paidToMemberOptions: { label: string; value: string }[];
}) {
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <label className="grid gap-2 text-label">
          收款成員
          <NativeSelect
            aria-label="依收款成員篩選"
            onChange={(event) =>
              onChange({ paidToMemberId: event.currentTarget.value })
            }
            value={draftPaymentQuery.paidToMemberId}
          >
            <option value="all">全部</option>
            {paidToMemberOptions.map((member) => (
              <option key={member.value} value={member.value}>
                {member.label}
              </option>
            ))}
          </NativeSelect>
        </label>

        <SortField
          label="排序"
          onChange={(sort) => onChange({ sort })}
          value={draftPaymentQuery.sort}
        />

        <label className="grid gap-2 text-label">
          付款開始日期
          <Input
            aria-label="付款開始日期"
            onChange={(event) => onChange({ dateFrom: event.currentTarget.value })}
            type="date"
            value={draftPaymentQuery.dateFrom}
          />
        </label>

        <label className="grid gap-2 text-label">
          付款結束日期
          <Input
            aria-label="付款結束日期"
            onChange={(event) => onChange({ dateTo: event.currentTarget.value })}
            type="date"
            value={draftPaymentQuery.dateTo}
          />
        </label>
      </div>
    </>
  );
}

function SortField<TSort extends string>({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (sort: TSort) => void;
  value: TSort;
}) {
  return (
    <label className="grid gap-2 text-label">
      {label}
      <NativeSelect
        aria-label={label}
        onChange={(event) =>
          onChange(event.currentTarget.value as TSort)
        }
        value={value}
      >
        <option value="newest">新到舊</option>
        <option value="oldest">舊到新</option>
        <option value="amount_desc">金額高到低</option>
        <option value="amount_asc">金額低到高</option>
      </NativeSelect>
    </label>
  );
}

function reimbursementRecordFilterCount(
  query: ReimbursementPaymentQueryState,
): number {
  return [
    query.dateFrom !== initialReimbursementPaymentQueryState.dateFrom,
    query.dateTo !== initialReimbursementPaymentQueryState.dateTo,
    query.paidToMemberId !==
      initialReimbursementPaymentQueryState.paidToMemberId,
    query.sort !== initialReimbursementPaymentQueryState.sort,
  ].filter(Boolean).length;
}
