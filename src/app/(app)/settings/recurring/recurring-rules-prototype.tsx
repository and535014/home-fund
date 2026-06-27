"use client";

import {
  Trash2,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { toast } from "sonner";
import {
  CategoryVisualMark,
  getCategoryVisual,
} from "@/app/category-visuals";
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

type MemberOption = {
  id: string;
  displayName: string;
};

type PostingMode = "immediate" | "reminder";
type RecordType = "income" | "expense";
type ScheduleAnchor = "fixed_day" | "month_end";
type PaymentSource = "fund" | "member";
type RecurringRuleTab = "expense" | "income";
type RecurringRule = {
  amount: number;
  categoryId: string;
  id: string;
  memberId: string;
  name: string;
  nextOccurrenceLabel: string;
  paymentSource: PaymentSource;
  postingMode: PostingMode;
  scheduleAnchor: ScheduleAnchor;
  scheduleDay: number;
  type: RecordType;
};

type RecurringRulesPrototypeProps = {
  categories: Category[];
  members: MemberOption[];
};

export function RecurringRulesPrototype({
  categories,
  members,
}: RecurringRulesPrototypeProps) {
  const fallbackMembers = members.length > 0
    ? members
    : [
        { id: "member-a", displayName: "成員 A" },
        { id: "member-b", displayName: "成員 B" },
      ];
  const fallbackCategories = categories.length > 0
    ? categories
    : [
        {
          color: "teal" as const,
          icon: "badge-dollar-sign" as const,
          id: "income-rent",
          name: "房租收入",
          sortOrder: 0,
          status: "active" as const,
          type: "income" as const,
        },
        {
          color: "blue" as const,
          icon: "wifi" as const,
          id: "expense-network",
          name: "網路費",
          sortOrder: 0,
          status: "active" as const,
          type: "expense" as const,
        },
        {
          color: "gold" as const,
          icon: "home" as const,
          id: "expense-maintenance",
          name: "管理費",
          sortOrder: 1,
          status: "active" as const,
          type: "expense" as const,
        },
      ];

  const incomeCategories = fallbackCategories.filter((category) =>
    category.status === "active" && category.type === "income",
  );
  const expenseCategories = fallbackCategories.filter((category) =>
    category.status === "active" && category.type === "expense",
  );
  const defaultIncomeCategoryId = incomeCategories[0]?.id ?? fallbackCategories[0]?.id ?? "";
  const defaultExpenseCategoryId = expenseCategories[0]?.id ?? defaultIncomeCategoryId;
  const defaultMemberId = fallbackMembers[0]?.id ?? "";
  const secondMemberId = fallbackMembers[1]?.id ?? defaultMemberId;

  const [rules, setRules] = useState<RecurringRule[]>(() => [
    {
      amount: 18000,
      categoryId: defaultIncomeCategoryId,
      id: "rule-rent",
      memberId: defaultMemberId,
      name: "成員 A 房租收入",
      nextOccurrenceLabel: "2026/07/01",
      paymentSource: "member",
      postingMode: "reminder",
      scheduleAnchor: "fixed_day",
      scheduleDay: 1,
      type: "income",
    },
    {
      amount: 1299,
      categoryId: defaultExpenseCategoryId,
      id: "rule-network",
      memberId: secondMemberId,
      name: "網路費",
      nextOccurrenceLabel: "2026/07/15",
      paymentSource: "member",
      postingMode: "immediate",
      scheduleAnchor: "fixed_day",
      scheduleDay: 15,
      type: "expense",
    },
    {
      amount: 3200,
      categoryId: expenseCategories[1]?.id ?? defaultExpenseCategoryId,
      id: "rule-month-end",
      memberId: secondMemberId,
      name: "月底管理費",
      nextOccurrenceLabel: "2026/07/31",
      paymentSource: "fund",
      postingMode: "reminder",
      scheduleAnchor: "month_end",
      scheduleDay: 31,
      type: "expense",
    },
  ]);
  const [deletingRuleId, setDeletingRuleId] = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] =
    useState<RecurringRuleTab>("expense");

  const incomeRules = rules.filter((rule) => rule.type === "income");
  const expenseRules = rules.filter((rule) => rule.type === "expense");
  const deletingRule =
    rules.find((rule) => rule.id === deletingRuleId) ?? null;

  function confirmDeleteRule() {
    if (!deletingRule) {
      return;
    }

    setRules((currentRules) =>
      currentRules.filter((rule) => rule.id !== deletingRule.id),
    );
    setDeletingRuleId(null);
    toast.success("週期事件已刪除");
  }

  return (
    <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)] gap-4">
      <div className="hidden min-h-0 gap-4 md:grid md:grid-cols-2">
        <RecurringRulePanelContent
          categories={fallbackCategories}
          count={expenseRules.length}
          emptyLabel="尚無支出週期事件"
          onDelete={setDeletingRuleId}
          rules={expenseRules}
          title="支出"
        />
        <RecurringRulePanelContent
          categories={fallbackCategories}
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
            categories={fallbackCategories}
            count={expenseRules.length}
            emptyLabel="尚無支出週期事件"
            onDelete={setDeletingRuleId}
            rules={expenseRules}
            showTitle={false}
            title="支出"
          />
        ) : (
          <RecurringRulePanelContent
            categories={fallbackCategories}
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
                    {formatCurrency(deletingRule.amount)} · {scheduleLabel(deletingRule)} ·{" "}
                    {postingModeLabel(deletingRule.postingMode)}
                  </p>
                </div>
              </DialogBody>
              <DialogFooter className="mt-4">
                <Button
                  onClick={() => setDeletingRuleId(null)}
                  type="button"
                  variant="outline"
                >
                  <X />
                  取消
                </Button>
                <Button
                  onClick={confirmDeleteRule}
                  type="button"
                  variant="destructive"
                >
                  <Trash2 />
                  確認刪除
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
        <ItemTitle className="truncate">{rule.name}</ItemTitle>
        <ItemDescription>
          {scheduleLabel(rule)} · {postingModeLabel(rule.postingMode)}
        </ItemDescription>
      </ItemContent>
      <ItemContent className="min-w-0 flex-none items-end text-right">
        <ItemTitle
          className={cn(
            "max-w-full justify-end",
            rule.type === "income" ? "text-income" : "text-expense",
          )}
        >
          <span className="truncate">{formatCurrency(rule.amount)}</span>
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

function scheduleLabel(rule: RecurringRule): string {
  return rule.scheduleAnchor === "month_end"
    ? "每月底"
    : `每月 ${rule.scheduleDay} 號`;
}

function postingModeLabel(mode: PostingMode): string {
  return mode === "immediate" ? "馬上入帳" : "提醒入帳";
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("zh-TW", {
    currency: "TWD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}
