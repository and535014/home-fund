"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import { canEditReimbursementPayments } from "./record-detail-actions";
import {
  RecordDetailFlowDialogs,
  useRecordDetailFlow,
} from "./record-detail-flow";
import { recordActorLabel } from "./record-display-utils";
import { RecordListItem } from "./record-list-item";
import { isRecurringPrototypeRecord } from "@/app/recurring-prototype-data";
import { ItemGroup } from "@/components/ui/item";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";

export function RecordListDetail({
  actor,
  categories,
  categoriesById,
  emptyMessage = "這個月份尚無紀錄。",
  hasMoreRecords = false,
  memberNames,
  onLoadMoreRecords,
  onToggleRecordSelection,
  pendingRecurringRecordIds = [],
  records,
  selectedRecordIds,
}: {
  actor: HouseholdAccessProfile;
  categories: Category[];
  categoriesById: Record<string, Category>;
  emptyMessage?: string;
  hasMoreRecords?: boolean;
  memberNames: Record<string, string>;
  onLoadMoreRecords?: () => void;
  onToggleRecordSelection?: (recordId: string) => void;
  pendingRecurringRecordIds?: string[];
  records: LedgerRecord[];
  selectedRecordIds?: Set<string>;
}) {
  const router = useRouter();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const detailFlow = useRecordDetailFlow({
    onRefresh: () => router.refresh(),
    pendingRecurringRecordIds,
    records,
  });

  useEffect(() => {
    if (!hasMoreRecords || !onLoadMoreRecords) {
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

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-3">
        {records.length === 0 ? (
          <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-8 text-center text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <ItemGroup className="min-h-0 flex-1 overflow-y-auto">
            {records.map((record) => {
              const isPendingRecurringRecord =
                detailFlow.isPendingRecurringRecord(record);
              const isRecurringRecord = isRecurringPrototypeRecord(record.id);

              return (
                <RecordListItem
                  category={categoriesById[record.categoryId]}
                  className={isPendingRecurringRecord ? "opacity-70" : undefined}
                  dateLabel={isPendingRecurringRecord ? "未入帳" : undefined}
                  description={
                    isRecurringRecord
                      ? `${recordActorLabel(record, memberNames)} · 週期事件`
                      : undefined
                  }
                  isSelected={selectedRecordIds?.has(record.id) ?? false}
                  key={record.id}
                  memberNames={memberNames}
                  onOpen={(trigger) => detailFlow.openRecord(record.id, trigger)}
                  onToggleSelection={onToggleRecordSelection}
                  record={record}
                />
              );
            })}
            {hasMoreRecords ? (
              <div
                ref={loadMoreRef}
                className="px-4 py-4 text-center text-caption text-muted-foreground"
              >
                載入更多紀錄...
              </div>
            ) : null}
          </ItemGroup>
        )}
      </div>

      <RecordDetailFlowDialogs
        actor={actor}
        canEditReimbursementPayments={canEditReimbursementPayments(actor)}
        categories={categories}
        categoriesById={categoriesById}
        flow={detailFlow}
        memberNames={memberNames}
      />
    </>
  );
}
