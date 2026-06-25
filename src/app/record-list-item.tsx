"use client";

import { Check } from "lucide-react";
import type { ReactNode } from "react";

import {
  CategoryVisualMark,
  getCategoryVisual,
} from "@/app/category-visuals";
import {
  formatRecordDate,
  recordActorLabel,
} from "@/app/record-display-utils";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";

export function RecordListItem({
  amountClassName,
  ariaLabel,
  category,
  dateLabel,
  description,
  isSelected,
  leadingVisual,
  memberNames,
  onOpen,
  onToggleSelection,
  record,
}: {
  amountClassName?: string;
  ariaLabel?: string;
  category?: Category;
  dateLabel?: string;
  description?: string;
  isSelected: boolean;
  leadingVisual?: ReactNode;
  memberNames: Record<string, string>;
  onOpen: (trigger: HTMLButtonElement) => void;
  onToggleSelection?: (recordId: string) => void;
  record: LedgerRecord;
}) {
  if (onToggleSelection) {
    return (
      <Item size="sm">
        <button
          aria-label={isSelected ? `取消選取${record.name}` : `選取${record.name}`}
          aria-pressed={isSelected}
          className={cn(
            "flex size-7 shrink-0 items-center justify-center rounded-sm border transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
            isSelected
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-accent-foreground",
          )}
          onClick={() => onToggleSelection(record.id)}
          type="button"
        >
          {isSelected ? <Check className="size-3.5" /> : null}
        </button>
        <button
          aria-label={ariaLabel ?? `查看${record.name}詳情`}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
          onClick={(event) => onOpen(event.currentTarget)}
          type="button"
        >
          <RecordSummaryContent
            amountClassName={amountClassName}
            category={category}
            dateLabel={dateLabel}
            description={description}
            leadingVisual={leadingVisual}
            memberNames={memberNames}
            record={record}
          />
        </button>
      </Item>
    );
  }

  return (
    <Item asChild size="sm">
      <button
        aria-label={ariaLabel ?? `查看${record.name}詳情`}
        className="w-full text-left"
        onClick={(event) => onOpen(event.currentTarget)}
        type="button"
      >
        <RecordSummaryContent
          amountClassName={amountClassName}
          category={category}
          dateLabel={dateLabel}
          description={description}
          leadingVisual={leadingVisual}
          memberNames={memberNames}
          record={record}
        />
      </button>
    </Item>
  );
}

export function RecordSummaryContent({
  amountClassName,
  category,
  dateLabel,
  description,
  leadingVisual,
  memberNames,
  record,
}: {
  amountClassName?: string;
  category?: Category;
  dateLabel?: string;
  description?: string;
  leadingVisual?: ReactNode;
  memberNames: Record<string, string>;
  record: LedgerRecord;
}) {
  const isIncome = record.type === "income";
  const visual = category ? getCategoryVisual(category) : null;

  return (
    <>
      <ItemMedia className="self-center! translate-y-0!">
        {leadingVisual ?? (visual ? (
          <CategoryVisualMark color={visual.color} icon={visual.icon} />
        ) : null)}
      </ItemMedia>

      <ItemContent className="min-w-0">
        <ItemTitle className="max-w-full">
          <span className="truncate">{record.name}</span>
        </ItemTitle>

        <ItemDescription className="truncate">
          {description ?? recordActorLabel(record, memberNames)}
        </ItemDescription>
      </ItemContent>

      <ItemContent className="min-w-0 flex-none items-end text-right">
        <ItemTitle
          className={cn(
            "max-w-full justify-end",
            amountClassName ?? (isIncome ? "text-income" : "text-expense"),
          )}
        >
          <span className="truncate">{formatAmount(record.amountCents)}</span>
        </ItemTitle>

        <ItemDescription className="truncate">
          {dateLabel ?? formatRecordDate(record.occurredOn)}
        </ItemDescription>
      </ItemContent>
    </>
  );
}
