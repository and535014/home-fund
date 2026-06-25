"use client";

import { ArrowLeft, CheckSquare, Search, SlidersHorizontal, X } from "lucide-react";
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
import { cn } from "@/lib/utils";
import {
  initialRecordQueryState,
  nextDraftQueryForType,
  recordFilterCount,
  type RecordQueryOptions,
  type RecordQueryState,
  type RecordSortOrder,
} from "./record-query";

export function RecordSearchControls({
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
  const router = useRouter();
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

  function navigateBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <div className="grid shrink-0 gap-3">
      <div className="flex items-center gap-2 p-0.5">
        <Button
          aria-label="返回上一頁"
          className="md:hidden"
          onClick={navigateBack}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ArrowLeft />
        </Button>
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
            <div className="grid grid-cols-2 gap-3">
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
                  <option value="reimbursement_payment">退款金流</option>
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
            </div>

            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid gap-3 sm:grid-cols-2">
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
            </div>
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
