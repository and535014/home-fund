"use client";

import {
  AlertTriangle,
  CalendarDays,
  HandCoins,
  Pencil,
  ReceiptText,
  Save,
  Search,
  SlidersHorizontal,
  StickyNote,
  Trash2,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { initialActionState } from "@/app/action-state";
import {
  reimburseLedgerRecordAction,
  updateLedgerRecordAction,
  voidLedgerRecordAction,
  type ReimburseLedgerRecordActionCode,
  type ReimburseLedgerRecordActionField,
  type UpdateLedgerRecordActionCode,
  type UpdateLedgerRecordActionField,
  type VoidLedgerRecordActionCode,
  type VoidLedgerRecordActionField,
} from "@/app/ledger-record-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Textarea } from "@/components/ui/textarea";
import { CategoryVisualMark, getCategoryVisual } from "@/app/category-visuals";
import { cn } from "@/lib/utils";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";

export function RecordListDetail({
  actor,
  categories,
  categoriesById,
  enableQuery = false,
  memberNames,
  records,
}: {
  actor: HouseholdAccessProfile;
  categories: Category[];
  categoriesById: Record<string, Category>;
  enableQuery?: boolean;
  memberNames: Record<string, string>;
  records: LedgerRecord[];
}) {
  const router = useRouter();
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);
  const [query, setQuery] = useState<RecordQueryState>(initialRecordQueryState);
  const selectedRecordTriggerRef = useRef<HTMLButtonElement | null>(null);
  const queryOptions = useMemo(
    () => buildRecordQueryOptions(categories, memberNames),
    [categories, memberNames],
  );
  const filteredRecords = useMemo(
    () =>
      enableQuery
        ? applyRecordQuery(records, {
            categoriesById,
            memberNames,
            query,
          })
        : records,
    [categoriesById, enableQuery, memberNames, query, records],
  );
  const hasActiveQuery = !enableQuery || !isInitialRecordQuery(query);
  const displayedRecords = hasActiveQuery ? filteredRecords : [];
  const selectedRecord =
    records.find((record) => record.id === selectedRecordId) ?? null;
  function closeSelectedRecord() {
    setSelectedRecordId(null);
    window.requestAnimationFrame(() => {
      selectedRecordTriggerRef.current?.focus();
    });
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-3">
        {enableQuery ? (
          <RecordQueryControls
            onChange={setQuery}
            options={queryOptions}
            query={query}
          />
        ) : null}

        {records.length === 0 ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-8 text-center text-muted-foreground">
            {enableQuery ? "尚無紀錄。" : "這個月份尚無紀錄。"}
          </div>
        ) : enableQuery && !hasActiveQuery ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-8 text-center text-muted-foreground">
            請輸入關鍵字或設定篩選條件。
          </div>
        ) : displayedRecords.length === 0 ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-8 text-center text-muted-foreground">
            沒有符合條件的紀錄。
          </div>
        ) : (
          <ItemGroup className="min-h-0 flex-1 overflow-y-auto divide-y divide-border">
            {displayedRecords.map((record) => (
              <RecordListItem
                category={categoriesById[record.categoryId]}
                key={record.id}
                memberNames={memberNames}
                onOpen={(trigger) => {
                  selectedRecordTriggerRef.current = trigger;
                  setSelectedRecordId(record.id);
                }}
                record={record}
              />
            ))}
          </ItemGroup>
        )}
      </div>

      <Dialog
        open={Boolean(selectedRecord)}
        onOpenChange={(open) => {
          if (!open) {
            closeSelectedRecord();
          }
        }}
      >
        {selectedRecord ? (
          <RecordDetailDialog
            actor={actor}
            category={categoriesById[selectedRecord.categoryId]}
            categories={categories}
            categoryName={
              categoriesById[selectedRecord.categoryId]?.name ??
              selectedRecord.categoryId
            }
            memberNames={memberNames}
            onMutationSuccess={() => {
              closeSelectedRecord();
              router.refresh();
            }}
            onRefresh={() => router.refresh()}
            record={selectedRecord}
          />
        ) : null}
      </Dialog>
    </>
  );
}

type RecordSortOrder = "newest" | "oldest" | "amount_desc" | "amount_asc";

type RecordQueryState = {
  categoryId: string;
  dateFrom: string;
  dateTo: string;
  participant: string;
  reimbursementStatus: string;
  search: string;
  sort: RecordSortOrder;
  type: string;
};

type RecordQueryOptions = {
  activeCategories: Category[];
  participants: { label: string; value: string }[];
};

const initialRecordQueryState: RecordQueryState = {
  categoryId: "all",
  dateFrom: "",
  dateTo: "",
  participant: "all",
  reimbursementStatus: "all",
  search: "",
  sort: "newest",
  type: "all",
};

function RecordQueryControls({
  onChange,
  options,
  query,
}: {
  onChange: (query: RecordQueryState) => void;
  options: RecordQueryOptions;
  query: RecordQueryState;
}) {
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState(query);
  const activeFilterCount = recordFilterCount(query);
  const draftFilterCount = recordFilterCount(draftQuery);
  const draftCategoryOptions = options.activeCategories.filter(
    (category) => draftQuery.type === "all" || category.type === draftQuery.type,
  );
  const draftParticipantOptions = options.participants.filter(
    (participant) => draftQuery.type !== "income" || participant.value !== "fund",
  );

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
      <div className="flex items-center gap-2">
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
          aria-label={
            activeFilterCount > 0
              ? `開啟篩選，已設定 ${activeFilterCount} 個條件`
              : "開啟篩選"
          }
          className={cn(
            activeFilterCount > 0 &&
              "border-primary/70 bg-primary/15 text-primary ring-2 ring-primary/35 hover:bg-primary/20",
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
          </DialogHeader>

          <DialogBody className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2 text-label">
                類型
                <NativeSelect
                  aria-label="依類型篩選"
                  onChange={(event) => {
                    const type = event.currentTarget.value;
                    const selectedCategory = options.activeCategories.find(
                      (category) => category.id === draftQuery.categoryId,
                    );

                    patchDraftQuery({
                      categoryId:
                        type === "all" ||
                        !selectedCategory ||
                        selectedCategory.type === type
                          ? draftQuery.categoryId
                          : "all",
                      participant:
                        type === "income" && draftQuery.participant === "fund"
                          ? "all"
                          : draftQuery.participant,
                      type,
                    });
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
            <Button
              onClick={applyDraftQuery}
              type="button"
            >
              套用
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function buildRecordQueryOptions(
  categories: Category[],
  memberNames: Record<string, string>,
): RecordQueryOptions {
  return {
    activeCategories: categories
      .filter((category) => category.status === "active")
      .toSorted((a, b) => {
        if (a.type !== b.type) {
          return a.type.localeCompare(b.type);
        }

        return a.sortOrder - b.sortOrder || a.name.localeCompare(b.name);
      }),
    participants: [
      { label: "基金", value: "fund" },
      ...Object.entries(memberNames)
        .map(([id, displayName]) => ({
          label: displayName,
          value: `member:${id}`,
        }))
        .toSorted((a, b) => a.label.localeCompare(b.label, "zh-TW")),
    ],
  };
}

function applyRecordQuery(
  records: LedgerRecord[],
  {
    categoriesById,
    memberNames,
    query,
  }: {
    categoriesById: Record<string, Category>;
    memberNames: Record<string, string>;
    query: RecordQueryState;
  },
): LedgerRecord[] {
  const search = query.search.trim().toLocaleLowerCase("zh-TW");

  return records
    .filter((record) => record.status === "active")
    .filter((record) => {
      const category = categoriesById[record.categoryId];

      if (query.type !== "all" && record.type !== query.type) {
        return false;
      }

      if (query.categoryId !== "all" && record.categoryId !== query.categoryId) {
        return false;
      }

      if (!recordMatchesParticipant(record, query.participant)) {
        return false;
      }

      if (!recordMatchesReimbursementStatus(record, query.reimbursementStatus)) {
        return false;
      }

      if (query.dateFrom && record.occurredOn < query.dateFrom) {
        return false;
      }

      if (query.dateTo && record.occurredOn > query.dateTo) {
        return false;
      }

      if (search && !recordSearchText(record, category, memberNames).includes(search)) {
        return false;
      }

      return true;
    })
    .toSorted((a, b) => compareRecords(a, b, query.sort));
}

function recordMatchesParticipant(
  record: LedgerRecord,
  participant: string,
): boolean {
  if (participant === "all") {
    return true;
  }

  if (participant === "fund") {
    return record.type === "expense" && record.paymentSource === "fund";
  }

  const memberId = participant.replace("member:", "");

  if (record.type === "income") {
    return record.sourceMemberId === memberId;
  }

  return record.paymentSource === "member" && record.payerMemberId === memberId;
}

function recordMatchesReimbursementStatus(
  record: LedgerRecord,
  reimbursementStatus: string,
): boolean {
  if (reimbursementStatus === "all") {
    return true;
  }

  if (record.type !== "expense" || record.paymentSource !== "member") {
    return false;
  }

  if (reimbursementStatus === "refunded") {
    return record.reimbursementStatus === "reimbursed";
  }

  return record.reimbursementStatus === "refundable";
}

function recordSearchText(
  record: LedgerRecord,
  category: Category | undefined,
  memberNames: Record<string, string>,
): string {
  const activeCategoryName =
    category?.status === "active" ? category.name : "";

  return [
    record.name,
    record.note,
    activeCategoryName,
    record.type === "income" ? "收入" : "支出",
    record.type === "expense" && record.paymentSource === "fund"
      ? "基金支出"
      : null,
    recordActorLabel(record, memberNames),
    ledgerRecordStatusLabel(record),
    formatDate(record.occurredOn),
    formatAmount(record.amountCents),
  ]
    .filter(Boolean)
    .join(" ")
    .toLocaleLowerCase("zh-TW");
}

function compareRecords(
  a: LedgerRecord,
  b: LedgerRecord,
  sort: RecordSortOrder,
): number {
  if (sort === "oldest") {
    return a.occurredOn.localeCompare(b.occurredOn) || a.name.localeCompare(b.name);
  }

  if (sort === "amount_desc") {
    return b.amountCents - a.amountCents || b.occurredOn.localeCompare(a.occurredOn);
  }

  if (sort === "amount_asc") {
    return a.amountCents - b.amountCents || b.occurredOn.localeCompare(a.occurredOn);
  }

  return b.occurredOn.localeCompare(a.occurredOn) || a.name.localeCompare(b.name);
}

function isInitialRecordQuery(query: RecordQueryState): boolean {
  return (
    query.categoryId === initialRecordQueryState.categoryId &&
    query.dateFrom === initialRecordQueryState.dateFrom &&
    query.dateTo === initialRecordQueryState.dateTo &&
    query.participant === initialRecordQueryState.participant &&
    query.reimbursementStatus === initialRecordQueryState.reimbursementStatus &&
    query.search === initialRecordQueryState.search &&
    query.sort === initialRecordQueryState.sort &&
    query.type === initialRecordQueryState.type
  );
}

function recordFilterCount(query: RecordQueryState): number {
  return [
    query.categoryId !== initialRecordQueryState.categoryId,
    query.dateFrom !== initialRecordQueryState.dateFrom,
    query.dateTo !== initialRecordQueryState.dateTo,
    query.participant !== initialRecordQueryState.participant,
    query.reimbursementStatus !== initialRecordQueryState.reimbursementStatus,
    query.sort !== initialRecordQueryState.sort,
    query.type !== initialRecordQueryState.type,
  ].filter(Boolean).length;
}

function RecordListItem({
  category,
  memberNames,
  onOpen,
  record,
}: {
  category?: Category;
  memberNames: Record<string, string>;
  onOpen: (trigger: HTMLButtonElement) => void;
  record: LedgerRecord;
}) {
  return (
    <Item
      asChild
      className="rounded-none border-0 hover:bg-secondary/45 focus-within:bg-secondary/45"
      size="sm"
    >
      <button
        aria-label={`查看${record.name}詳情`}
        className="w-full text-left"
        onClick={(event) => onOpen(event.currentTarget)}
        type="button"
      >
        <RecordSummaryContent
          category={category}
          memberNames={memberNames}
          record={record}
        />
      </button>
    </Item>
  );
}

function RecordSummaryContent({
  category,
  memberNames,
  record,
}: {
  category?: Category;
  memberNames: Record<string, string>;
  record: LedgerRecord;
}) {
  const isIncome = record.type === "income";
  const visual = category ? getCategoryVisual(category) : null;

  return (
    <>
      <ItemMedia className="self-center! translate-y-0!">
        {visual ? (
          <CategoryVisualMark color={visual.color} icon={visual.icon} />
        ) : null}
      </ItemMedia>

      <ItemContent className="min-w-0">
        <ItemTitle className="max-w-full">
          <span className="truncate">{record.name}</span>
        </ItemTitle>

        <ItemDescription className="truncate">
          {recordActorLabel(record, memberNames)}
        </ItemDescription>
      </ItemContent>

      <ItemContent className="min-w-0 flex-none items-end text-right">
        <ItemTitle
          className={`max-w-full justify-end ${
            isIncome ? "text-income" : "text-expense"
          }`}
        >
          <span className="truncate">{formatAmount(record.amountCents)}</span>
        </ItemTitle>

        <ItemDescription className="truncate">
          {formatDate(record.occurredOn)}
        </ItemDescription>
      </ItemContent>
    </>
  );
}

function RecordDetailDialog({
  actor,
  category,
  categories,
  categoryName,
  memberNames,
  onMutationSuccess,
  onRefresh,
  record,
}: {
  actor: HouseholdAccessProfile;
  category?: Category;
  categories: Category[];
  categoryName: string;
  memberNames: Record<string, string>;
  onMutationSuccess: () => void;
  onRefresh: () => void;
  record: LedgerRecord;
}) {
  const isIncome = record.type === "income";
  const [mode, setMode] = useState<"detail" | "edit" | "delete" | "refund">(
    "detail",
  );
  const [isRefundedLocally, setIsRefundedLocally] = useState(false);
  const displayedRecord =
    isRefundedLocally && record.type === "expense"
      ? ({
          ...record,
          reimbursementStatus: "reimbursed",
        } satisfies LedgerRecord)
      : record;
  const access = recordActionAccess(actor, displayedRecord);

  if (mode === "edit") {
    return (
      <EditRecordDialog
        categories={categories}
        memberNames={memberNames}
        onCancel={() => setMode("detail")}
        onSuccess={() => {
          toast.success("紀錄已更新", {
            description: "這筆紀錄已更新。",
            id: `edit-record-success-${record.id}`,
          });
          onMutationSuccess();
        }}
        record={record}
      />
    );
  }

  if (mode === "delete") {
    return (
      <DeleteRecordDialog
        onCancel={() => setMode("detail")}
        onSuccess={() => {
          toast.success("紀錄已刪除", {
            description: "這筆紀錄已移除。",
            id: `delete-record-success-${record.id}`,
          });
          onMutationSuccess();
        }}
        record={record}
      />
    );
  }

  if (mode === "refund") {
    return (
      <RefundRecordDialog
        category={category}
        memberNames={memberNames}
        onCancel={() => setMode("detail")}
        onSuccess={() => {
          setIsRefundedLocally(true);
          setMode("detail");
          toast.success("已完成退款", {
            description: "這筆紀錄已標記為已退款。",
            id: `refund-record-success-${record.id}`,
          });
          onRefresh();
        }}
        record={record}
      />
    );
  }

  return (
    <DialogContent aria-describedby={undefined} className="max-w-xl">
      <DialogHeader>
        <DialogTitle>{record.name}</DialogTitle>
      </DialogHeader>

      <DialogBody className="grid gap-4">
        <div className="rounded-card border border-border bg-secondary/30 p-4">
          <p className="text-caption text-muted-foreground">金額</p>
          <p
            className={`mt-1 text-heading ${
              isIncome ? "text-income" : "text-expense"
            }`}
          >
            {formatAmount(record.amountCents)}
          </p>
        </div>

        {access.blockedReason ? (
          <Alert variant="warning">
            <AlertTriangle />
            <AlertDescription>{access.blockedReason}</AlertDescription>
          </Alert>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <DetailField
            icon={<CalendarDays />}
            label="日期"
            value={formatDate(record.occurredOn)}
          />
          <DetailField
            icon={<ReceiptText />}
            label="分類"
            value={categoryName}
          />
          <DetailField
            icon={<WalletCards />}
            label="狀態"
            value={ledgerRecordStatusLabel(displayedRecord)}
          />
          <DetailField
            icon={<UserRound />}
            label="支付者"
            value={recordActorLabel(displayedRecord, memberNames)}
          />
        </div>

        <div className="rounded-card border border-border p-4">
          <div className="flex items-center gap-2 text-label">
            <StickyNote className="size-4 text-muted-foreground" />
            備註
          </div>
          <p className="mt-2 whitespace-pre-wrap text-body text-muted-foreground">
            {record.note?.trim() || "沒有備註。"}
          </p>
        </div>
      </DialogBody>

      {(access.canEdit || access.canDelete || access.canRefund) &&
      !access.blockedReason ? (
        <DialogFooter className="mt-4">
          {access.canDelete ? (
            <Button
              onClick={() => setMode("delete")}
              type="button"
              variant="destructive"
            >
              <Trash2 />
              刪除
            </Button>
          ) : null}
          {access.canRefund ? (
            <Button onClick={() => setMode("refund")} type="button">
              <HandCoins />
              退款
            </Button>
          ) : null}
          {access.canEdit ? (
            <Button onClick={() => setMode("edit")} type="button">
              <Pencil />
              編輯
            </Button>
          ) : null}
        </DialogFooter>
      ) : null}
    </DialogContent>
  );
}

function RefundRecordDialog({
  category,
  memberNames,
  onCancel,
  onSuccess,
  record,
}: {
  category?: Category;
  memberNames: Record<string, string>;
  onCancel: () => void;
  onSuccess: () => void;
  record: LedgerRecord;
}) {
  const [actionState, setActionState] = useState(() =>
    initialActionState<
      { recordId: string },
      ReimburseLedgerRecordActionField,
      ReimburseLedgerRecordActionCode
    >(),
  );
  const [isPending, startTransition] = useTransition();

  function formAction(formData: FormData) {
    startTransition(async () => {
      const nextState = await reimburseLedgerRecordAction(actionState, formData);

      setActionState(nextState);

      if (nextState.status === "success") {
        onSuccess();
      }
    });
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>確認退款</DialogTitle>
        <DialogDescription>將此紀錄標記為已退款。</DialogDescription>
      </DialogHeader>

      <form action={formAction}>
        {actionState.status === "error" && actionState.message ? (
          <Alert className="mb-3" role="alert" variant="destructive">
            <AlertDescription>{actionState.message}</AlertDescription>
          </Alert>
        ) : null}
        <input name="recordId" type="hidden" value={record.id} />
        <DialogBody className="grid gap-3">
          <Item className="border border-border bg-secondary/30">
            <RecordSummaryContent
              category={category}
              memberNames={memberNames}
              record={record}
            />
          </Item>
          <Alert variant="warning">
            <AlertTriangle />
            <AlertDescription>
              確認後，狀態會顯示為已退款，且無法編輯或刪除。
            </AlertDescription>
          </Alert>
        </DialogBody>

        <DialogFooter className="mt-4">
          <Button onClick={onCancel} type="button" variant="outline">
            <X />
            取消
          </Button>
          <Button disabled={isPending} type="submit">
            <HandCoins />
            {isPending ? "處理中..." : "確認退款"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function EditRecordDialog({
  categories,
  memberNames,
  onCancel,
  onSuccess,
  record,
}: {
  categories: Category[];
  memberNames: Record<string, string>;
  onCancel: () => void;
  onSuccess: () => void;
  record: LedgerRecord;
}) {
  const [paymentSource, setPaymentSource] = useState(
    record.type === "expense" ? record.paymentSource : "member",
  );
  const [actionState, setActionState] = useState(() =>
    initialActionState<
      { recordId: string },
      UpdateLedgerRecordActionField,
      UpdateLedgerRecordActionCode
    >(),
  );
  const [isPending, startTransition] = useTransition();
  const activeCategories = categories.filter(
    (category) => category.type === record.type && category.status === "active",
  );
  const members = Object.entries(memberNames).map(([id, displayName]) => ({
    id,
    displayName,
  }));

  function formAction(formData: FormData) {
    startTransition(async () => {
      const nextState = await updateLedgerRecordAction(actionState, formData);

      setActionState(nextState);

      if (nextState.status === "success") {
        onSuccess();
      }
    });
  }

  return (
    <DialogContent className="max-w-xl">
      <DialogHeader>
        <DialogTitle>編輯紀錄</DialogTitle>
        <DialogDescription>更新這筆紀錄的內容。</DialogDescription>
      </DialogHeader>

      <form action={formAction}>
        {actionState.status === "error" && actionState.message ? (
          <Alert className="mb-3" role="alert" variant="destructive">
            <AlertDescription>{actionState.message}</AlertDescription>
          </Alert>
        ) : null}
        <input name="recordId" type="hidden" value={record.id} />
        <input name="recordType" type="hidden" value={record.type} />
        <DialogBody className="grid gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-2 text-label">
              名稱
              <Input defaultValue={record.name} name="name" />
            </label>
            <label className="grid gap-2 text-label">
              金額
              <Input
                defaultValue={String(record.amountCents / 100)}
                inputMode="decimal"
                name="amountTwd"
              />
            </label>
            <label className="grid gap-2 text-label">
              日期
              <Input
                defaultValue={record.occurredOn}
                name="occurredOn"
                type="date"
              />
            </label>
            <label className="grid gap-2 text-label">
              分類
              <NativeSelect defaultValue={record.categoryId} name="categoryId">
                {activeCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </NativeSelect>
            </label>
            {record.type === "expense" ? (
              <>
                <label className="grid gap-2 text-label">
                  支出類型
                  <NativeSelect
                    name="paymentSource"
                    onChange={(event) =>
                      setPaymentSource(
                        event.currentTarget.value as "fund" | "member",
                      )
                    }
                    value={paymentSource}
                  >
                    <option value="member">成員代墊</option>
                    <option value="fund">基金支出</option>
                  </NativeSelect>
                </label>
                {paymentSource === "member" ? (
                  <label className="grid gap-2 text-label">
                    支付者
                    <NativeSelect
                      defaultValue={record.payerMemberId ?? ""}
                      name="payerMemberId"
                    >
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.displayName}
                        </option>
                      ))}
                    </NativeSelect>
                  </label>
                ) : null}
              </>
            ) : (
              <label className="grid gap-2 text-label">
                支付者
                <NativeSelect
                  defaultValue={record.sourceMemberId}
                  name="sourceMemberId"
                >
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.displayName}
                    </option>
                  ))}
                </NativeSelect>
              </label>
            )}
          </div>

          <label className="grid gap-2 text-label">
            備註
            <Textarea defaultValue={record.note ?? ""} name="note" />
          </label>
        </DialogBody>

        <DialogFooter className="mt-4">
          <Button onClick={onCancel} type="button" variant="outline">
            <X />
            取消
          </Button>
          <Button disabled={isPending} type="submit">
            <Save />
            {isPending ? "儲存中..." : "儲存變更"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function DeleteRecordDialog({
  onCancel,
  onSuccess,
  record,
}: {
  onCancel: () => void;
  onSuccess: () => void;
  record: LedgerRecord;
}) {
  const [actionState, setActionState] = useState(() =>
    initialActionState<
      { recordId: string },
      VoidLedgerRecordActionField,
      VoidLedgerRecordActionCode
    >(),
  );
  const [isPending, startTransition] = useTransition();

  function formAction(formData: FormData) {
    startTransition(async () => {
      const nextState = await voidLedgerRecordAction(actionState, formData);

      setActionState(nextState);

      if (nextState.status === "success") {
        onSuccess();
      }
    });
  }

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>刪除紀錄</DialogTitle>
        <DialogDescription>
          刪除後，這筆紀錄不會顯示在列表中。
        </DialogDescription>
      </DialogHeader>

      <form action={formAction}>
        {actionState.status === "error" && actionState.message ? (
          <Alert className="mb-3" role="alert" variant="destructive">
            <AlertDescription>{actionState.message}</AlertDescription>
          </Alert>
        ) : null}
        <input name="recordId" type="hidden" value={record.id} />
        <DialogBody>
          <div className="rounded-card border border-destructive/40 bg-destructive/10 p-4">
            <p className="text-body-strong">{record.name}</p>
            <p className="mt-1 text-body text-muted-foreground">
              {formatAmount(record.amountCents)} ·{" "}
              {formatDate(record.occurredOn)}
            </p>
          </div>
        </DialogBody>

        <DialogFooter className="mt-4">
          <Button onClick={onCancel} type="button" variant="outline">
            <X />
            取消
          </Button>
          <Button disabled={isPending} type="submit" variant="destructive">
            <Trash2 />
            {isPending ? "刪除中..." : "確認刪除"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function DetailField({
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

function recordActorLabel(
  record: LedgerRecord,
  memberNames: Record<string, string>,
): string {
  if (record.type === "income") {
    return memberNames[record.sourceMemberId] ?? "成員";
  }

  if (record.paymentSource === "member") {
    return memberNames[record.payerMemberId ?? ""] ?? "成員";
  }

  return "基金";
}

function ledgerRecordStatusLabel(record: LedgerRecord): string {
  if (record.type === "income") {
    return "---";
  }

  const reimbursementStatusLabels: Record<
    LedgerRecord["reimbursementStatus"],
    string
  > = {
    not_applicable: "不適用",
    not_refundable: "不需退款",
    refundable: "待退款",
    reimbursed: "已退款",
  };

  return reimbursementStatusLabels[record.reimbursementStatus];
}

function recordActionAccess(
  actor: HouseholdAccessProfile,
  record: LedgerRecord,
): {
  blockedReason?: string;
  canDelete: boolean;
  canEdit: boolean;
  canRefund: boolean;
} {
  const isOwner = actor.id === record.createdByMemberId;
  const isAdmin = actor.roles.includes("admin");
  const isFinanceManager = actor.roles.includes("finance_manager");
  const isReimbursedExpense =
    record.type === "expense" && record.reimbursementStatus === "reimbursed";
  const canPerformReimbursement = isAdmin || isFinanceManager;
  const canRefund =
    canPerformReimbursement &&
    record.type === "expense" &&
    record.status === "active" &&
    record.paymentSource === "member" &&
    record.reimbursementStatus === "refundable";

  if (isReimbursedExpense) {
    return {
      blockedReason: "這筆代墊支出已退款，無法編輯或刪除。",
      canDelete: false,
      canEdit: false,
      canRefund: false,
    };
  }

  return {
    canDelete: isAdmin || isOwner,
    canEdit: isAdmin || isFinanceManager || isOwner,
    canRefund,
  };
}

function formatAmount(amountCents: number): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function formatDate(date: string): string {
  return date.replaceAll("-", "/");
}
