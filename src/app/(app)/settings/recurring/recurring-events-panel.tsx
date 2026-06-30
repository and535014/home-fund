"use client";

import {
  Trash2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { initialActionState } from "@/app/action-state";
import {
  CategoryVisualMark,
  getCategoryVisual,
} from "@/app/category-visuals";
import {
  deleteRecurringEventAction,
  type DeleteRecurringEventActionState,
} from "@/app/recurring-event-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { Category } from "@/modules/categorization/category-catalog";
import type { RecurringEventSettingsItem } from "@/modules/recurring/recurring-event-query";

type PostingMode = "immediate" | "reminder";
type RecordType = "income" | "expense";
type RecurringRuleTab = "expense" | "income";
type RecurringRule = {
  amountCents: number;
  categoryId: string;
  id: string;
  memberName?: string;
  name: string;
  nextOccurrenceLabel: string;
  postingMode: PostingMode;
  type: RecordType;
};

type RecurringEventsPanelProps = {
  categories: Category[];
  events: RecurringEventSettingsItem[];
  memberNameById: Record<string, string>;
};

export function RecurringEventsPanel({
  categories,
  events,
  memberNameById,
}: RecurringEventsPanelProps) {
  const [deletedRuleIds, setDeletedRuleIds] = useState<string[]>([]);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] =
    useState<RecurringRuleTab>("expense");
  const [isPending, startTransition] = useTransition();

  const rules = useMemo(
    () =>
      events
        .filter((event) => !deletedRuleIds.includes(event.id))
        .map((event) => toRecurringRule(event, memberNameById)),
    [deletedRuleIds, events, memberNameById],
  );
  const incomeRules = rules.filter((rule) => rule.type === "income");
  const expenseRules = rules.filter((rule) => rule.type === "expense");
  const deletingRule =
    rules.find((rule) => rule.id === deletingRuleId) ?? null;

  function confirmDeleteRule() {
    if (!deletingRule) {
      return;
    }

    const formData = new FormData();
    formData.set("recurringEventId", deletingRule.id);

    startTransition(async () => {
      const result = await deleteRecurringEventAction(
        initialActionState() as DeleteRecurringEventActionState,
        formData,
      );

      if (result.status === "error") {
        toast.error(result.message ?? "週期事件刪除失敗。");
        return;
      }

      setDeletedRuleIds((currentIds) => [...currentIds, deletingRule.id]);
      setDeletingRuleId(null);
      toast.success(result.message ?? "週期事件已刪除");
    });
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)] gap-4">
      <div className="hidden min-h-0 gap-4 md:grid md:grid-cols-2">
        <RecurringRulePanelContent
          categories={categories}
          count={expenseRules.length}
          emptyLabel="尚無支出週期事件"
          onDelete={setDeletingRuleId}
          rules={expenseRules}
          title="支出"
        />
        <RecurringRulePanelContent
          categories={categories}
          count={incomeRules.length}
          emptyLabel="尚無收入週期事件"
          onDelete={setDeletingRuleId}
          rules={incomeRules}
          title="收入"
        />
      </div>

      <Tabs
        className="min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-4 md:hidden"
        onValueChange={(value) => setActiveMobileTab(value as RecurringRuleTab)}
        value={activeMobileTab}
      >
        <TabsList aria-label="週期事件類型" className="w-full" variant="line">
          <TabsTrigger value="expense">支出({expenseRules.length})</TabsTrigger>
          <TabsTrigger value="income">收入({incomeRules.length})</TabsTrigger>
        </TabsList>
        {activeMobileTab === "expense" ? (
          <RecurringRulePanelContent
            categories={categories}
            count={expenseRules.length}
            emptyLabel="尚無支出週期事件"
            onDelete={setDeletingRuleId}
            rules={expenseRules}
            showTitle={false}
            title="支出"
          />
        ) : (
          <RecurringRulePanelContent
            categories={categories}
            count={incomeRules.length}
            emptyLabel="尚無收入週期事件"
            onDelete={setDeletingRuleId}
            rules={incomeRules}
            showTitle={false}
            title="收入"
          />
        )}
      </Tabs>
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setDeletingRuleId(null);
          }
        }}
        open={deletingRule !== null}
      >
        <DialogContent aria-describedby={undefined} className="max-w-md">
          <DialogHeader>
            <DialogTitle>刪除週期事件</DialogTitle>
          </DialogHeader>
          {deletingRule ? (
            <>
              <DialogBody>
                <div className="rounded-card border border-destructive/40 bg-destructive/10 p-4">
                  <p className="text-body-strong">{deletingRule.name}</p>
                  <p className="mt-1 text-body text-muted-foreground">
                    {formatCurrency(deletingRule.amountCents)} ·{" "}
                    {postingModeLabel(deletingRule.postingMode)}
                  </p>
                </div>
              </DialogBody>
              <DialogFooter className="mt-4">
                <Button
                  onClick={() => setDeletingRuleId(null)}
                  disabled={isPending}
                  type="button"
                  variant="outline"
                >
                  <X />
                  取消
                </Button>
                <Button
                  onClick={confirmDeleteRule}
                  disabled={isPending}
                  type="button"
                  variant="destructive"
                >
                  <Trash2 />
                  {isPending ? "刪除中..." : "確認刪除"}
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RecurringRulePanelContent({
  categories,
  count,
  emptyLabel,
  onDelete,
  rules,
  showTitle = true,
  title,
}: {
  categories: Category[];
  count: number;
  emptyLabel: string;
  onDelete: (ruleId: string) => void;
  rules: RecurringRule[];
  showTitle?: boolean;
  title: string;
}) {
  return (
    <RecurringPanel count={count} showTitle={showTitle} title={title}>
      {rules.length > 0 ? (
        <RecurringRuleList
          categories={categories}
          onDelete={onDelete}
          rules={rules}
        />
      ) : (
        <RecurringEmptyState label={emptyLabel} />
      )}
    </RecurringPanel>
  );
}

function RecurringPanel({
  children,
  count,
  showTitle = true,
  title,
}: {
  children: ReactNode;
  count: number;
  showTitle?: boolean;
  title: string;
}) {
  return (
    <section
      aria-label={`${title}週期事件`}
      className="flex min-h-0 min-w-0 flex-col justify-start gap-3 overflow-hidden"
    >
      {showTitle ? (
        <h3 className="shrink-0 text-body-strong text-foreground">
          {title} ({count})
        </h3>
      ) : null}
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">
        {children}
      </div>
    </section>
  );
}

function RecurringRuleList({
  categories,
  onDelete,
  rules,
}: {
  categories: Category[];
  onDelete: (ruleId: string) => void;
  rules: RecurringRule[];
}) {
  return (
    <div className="grid gap-3">
      {rules.map((rule) => (
        <RecurringRuleItem
          category={categories.find((category) => category.id === rule.categoryId)}
          key={rule.id}
          onDelete={() => onDelete(rule.id)}
          rule={rule}
        />
      ))}
    </div>
  );
}

function RecurringRuleItem({
  category,
  onDelete,
  rule,
}: {
  category?: Category;
  onDelete: () => void;
  rule: RecurringRule;
}) {
  const visual = category ? getCategoryVisual(category) : null;

  return (
    <Item className="flex-nowrap" size="sm" variant="outline">
      {visual ? (
        <ItemMedia className="self-center! translate-y-0!">
          <CategoryVisualMark color={visual.color} icon={visual.icon} />
        </ItemMedia>
      ) : null}
      <ItemContent className="min-w-0">
        <ItemTitle className="w-full min-w-0 flex-wrap">
          <span className="min-w-0 truncate">{rule.name}</span>
          <Badge variant="outline">{postingModeLabel(rule.postingMode)}</Badge>
        </ItemTitle>
        {rule.memberName ? (
          <ItemDescription className="truncate">{rule.memberName}</ItemDescription>
        ) : null}
      </ItemContent>
      <ItemContent className="min-w-0 flex-none items-end text-right">
        <ItemTitle
          className={cn(
            "max-w-full justify-end",
            rule.type === "income" ? "text-income" : "text-expense",
          )}
        >
          <span className="truncate">{formatCurrency(rule.amountCents)}</span>
        </ItemTitle>
        <ItemDescription className="truncate">
          下次 {rule.nextOccurrenceLabel}
        </ItemDescription>
      </ItemContent>
      <ItemActions className="shrink-0">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={`刪除 ${rule.name}`}
              onClick={onDelete}
              size="icon-sm"
              type="button"
              variant="destructive"
            >
              <Trash2 aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>刪除週期事件</TooltipContent>
        </Tooltip>
      </ItemActions>
    </Item>
  );
}

function RecurringEmptyState({ label }: { label: string }) {
  return (
    <div className="grid min-h-32 place-items-center rounded-card border border-dashed border-border text-center">
      <p className="text-caption text-muted-foreground">{label}</p>
    </div>
  );
}

function postingModeLabel(mode: PostingMode): string {
  return mode === "immediate" ? "馬上入帳" : "提醒入帳";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("zh-TW", {
    currency: "TWD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount / 100);
}

function toRecurringRule(
  event: RecurringEventSettingsItem,
  memberNameById: Record<string, string>,
): RecurringRule {
  const memberName = recurringRuleMemberName(event, memberNameById);

  return {
    amountCents: event.amountCents,
    categoryId: event.categoryId,
    id: event.id,
    ...(memberName ? { memberName } : {}),
    name: event.name,
    nextOccurrenceLabel: event.nextOccurrenceLabel,
    postingMode: event.postingMode,
    type: event.type,
  };
}

function recurringRuleMemberName(
  event: RecurringEventSettingsItem,
  memberNameById: Record<string, string>,
): string | null {
  if (event.type === "income") {
    return event.sourceMemberId
      ? memberNameById[event.sourceMemberId] ?? "成員"
      : null;
  }

  if (event.paymentSource === "fund") {
    return "基金";
  }

  return event.payerMemberId
    ? memberNameById[event.payerMemberId] ?? "成員"
    : null;
}
