"use client";

import { HandCoins } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
import type {
  MonthlyReimbursementTable,
  ReimbursementTableExpense,
} from "@/modules/reimbursement/reimbursement-table";

type ReimbursementFeedback =
  | "success"
  | "permission_denied"
  | "empty_selection"
  | "expense_not_found"
  | "not_refundable"
  | "already_reimbursed";

type ReimbursementSettlementPanelProps = {
  canPerformReimbursement: boolean;
  feedback?: ReimbursementFeedback;
  markExpensesReimbursedAction: (formData: FormData) => void;
  month: string;
  reimbursementTable: MonthlyReimbursementTable;
  returnTo?: string;
};

export function ReimbursementSettlementPanel({
  canPerformReimbursement,
  feedback,
  markExpensesReimbursedAction,
  month,
  reimbursementTable,
  returnTo = "/",
}: ReimbursementSettlementPanelProps) {
  const isHydrated = useHydrated();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedExpenseIds, setSelectedExpenseIds] = useState<string[]>([]);
  const expenseById = useMemo(() => {
    const entries = reimbursementTable.groups.flatMap((group) =>
      group.expenses.map((expense) => [expense.id, expense] as const),
    );

    return new Map(entries);
  }, [reimbursementTable.groups]);
  const selectedExpenses = selectedExpenseIds
    .map((expenseId) => expenseById.get(expenseId))
    .filter((expense): expense is ReimbursementTableExpense => Boolean(expense));
  const selectedTotalCents = selectedExpenses.reduce(
    (total, expense) => total + expense.amountCents,
    0,
  );
  const pendingExpenseCount = reimbursementTable.groups.reduce(
    (total, group) => total + group.expenseIds.length,
    0,
  );
  const feedbackMessage = feedback ? feedbackMessages[feedback] : undefined;

  function toggleExpense(expenseId: string, checked: boolean) {
    setSelectedExpenseIds((current) =>
      checked
        ? current.includes(expenseId)
          ? current
          : [...current, expenseId]
        : current.filter((currentExpenseId) => currentExpenseId !== expenseId),
    );
  }

  return (
    <section
      aria-labelledby="reimbursement-title"
      data-settlement-ready={isHydrated ? "true" : "false"}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 id="reimbursement-title" className="text-subheading">
            退款表
          </h3>
          <p className="text-caption text-muted-foreground">
            {pendingExpenseCount} 筆待處理 · {formatAmount(reimbursementTable.totalAmountCents)}
          </p>
        </div>
        {canPerformReimbursement ? (
          <Button
            aria-label="執行退款"
            disabled={!isHydrated || selectedExpenseIds.length === 0}
            onClick={() => setIsConfirmOpen(true)}
            size="icon"
            type="button"
            variant="secondary"
          >
            <HandCoins aria-hidden="true" size={18} />
          </Button>
        ) : null}
      </div>

      <Card className="p-0">
        <ItemGroup>
          {reimbursementTable.groups.length === 0 ? (
            <Item className="rounded-none">
              <ItemContent>
                <ItemTitle>沒有待退款支出</ItemTitle>
                <ItemDescription>
                  目前沒有成員代墊且尚未退款的支出。
                </ItemDescription>
              </ItemContent>
            </Item>
          ) : (
            reimbursementTable.groups.map((group) => (
              <Item
                className="grid rounded-none border-b border-border last:border-b-0"
                key={group.memberId}
              >
                <div className="flex items-start justify-between gap-3">
                  <ItemContent className="min-w-0">
                    <ItemTitle>{group.displayName}</ItemTitle>
                    <ItemDescription>
                      {group.expenseIds.length} 筆支出需退款
                    </ItemDescription>
                  </ItemContent>
                  <p className="shrink-0 text-body-strong">
                    {formatAmount(group.totalAmountCents)}
                  </p>
                </div>
                <div className="grid gap-2">
                  {group.expenses.map((expense) => (
                    <label
                      className="grid grid-cols-[1rem_1fr_auto] items-center gap-2 text-body"
                      key={expense.id}
                    >
                      {canPerformReimbursement ? (
                        <input
                          aria-label={`選取 ${group.displayName} ${expense.occurredOn} ${formatAmount(expense.amountCents)} 退款`}
                          checked={selectedExpenseIds.includes(expense.id)}
                          className="size-4 accent-primary"
                          disabled={!isHydrated}
                          name="selectedExpenseIds"
                          onChange={(event) =>
                            toggleExpense(expense.id, event.currentTarget.checked)
                          }
                          onInput={(event) =>
                            toggleExpense(expense.id, event.currentTarget.checked)
                          }
                          type="checkbox"
                          value={expense.id}
                        />
                      ) : (
                        <span aria-hidden="true" />
                      )}
                      <span className="min-w-0 truncate text-muted-foreground">
                        {group.displayName} {expense.occurredOn}
                      </span>
                      <span className="text-body-strong">
                        {formatAmount(expense.amountCents)}
                      </span>
                    </label>
                  ))}
                </div>
              </Item>
            ))
          )}
        </ItemGroup>
      </Card>

      {canPerformReimbursement ? (
        <div className="mt-3 flex items-center justify-between gap-3 text-body">
          <span className="text-muted-foreground">
            已選取 {selectedExpenseIds.length} 筆
          </span>
          <span className="text-body-strong">
            {formatAmount(selectedTotalCents)}
          </span>
        </div>
      ) : null}

      {feedbackMessage ? (
        <Alert
          className="mt-3"
          variant={feedback === "success" ? "default" : "destructive"}
        >
          <AlertDescription>{feedbackMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Dialog onOpenChange={setIsConfirmOpen} open={isConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>確認退款</DialogTitle>
            <DialogDescription>
              將 {selectedExpenseIds.length} 筆支出標記為已退款，總額{" "}
              {formatAmount(selectedTotalCents)}。
            </DialogDescription>
          </DialogHeader>
          <form action={markExpensesReimbursedAction} className="grid gap-4">
            <input name="month" type="hidden" value={month} />
            <input name="returnTo" type="hidden" value={returnTo} />
            {selectedExpenseIds.map((expenseId) => (
              <input
                key={expenseId}
                name="selectedExpenseIds"
                type="hidden"
                value={expenseId}
              />
            ))}
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  取消
                </Button>
              </DialogClose>
              <Button disabled={selectedExpenseIds.length === 0} type="submit">
                確認退款
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}

const feedbackMessages: Record<ReimbursementFeedback, string> = {
  success: "已完成退款。",
  permission_denied: "你沒有執行退款的權限。",
  empty_selection: "請先選擇要退款的支出。",
  expense_not_found: "找不到其中一筆退款支出，請重新整理後再試。",
  not_refundable: "其中一筆支出目前不可退款，請重新整理後再試。",
  already_reimbursed: "其中一筆支出已經退款，請重新整理後再試。",
};

function formatAmount(amountCents: number): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function useHydrated(): boolean {
  return useSyncExternalStore(subscribeHydration, readClientSnapshot, readServerSnapshot);
}

function subscribeHydration() {
  return () => {};
}

function readClientSnapshot() {
  return true;
}

function readServerSnapshot() {
  return false;
}
