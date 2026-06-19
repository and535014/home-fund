"use client";

import { CalendarCheck } from "lucide-react";
import { useActionState, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { initialActionState } from "@/app/action-state";
import { confirmRecurringReminderAction } from "@/app/recurring-reminder-actions";
import type {
  RecurringReminderActionCode,
  RecurringReminderActionField,
} from "@/app/recurring-reminder-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
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
import type { PendingRecurringReminder } from "./home-access";

type RecurringReminderConfirmationPanelProps = {
  month: string;
  pendingReminders: PendingRecurringReminder[];
};

export function RecurringReminderConfirmationPanel({
  month,
  pendingReminders,
}: RecurringReminderConfirmationPanelProps) {
  const router = useRouter();
  const [actionState, formAction] = useActionState(
    confirmRecurringReminderAction,
    initialActionState<
      { month: string; occurrenceId: string },
      RecurringReminderActionField,
      RecurringReminderActionCode
    >(),
  );
  const isHydrated = useHydrated();
  const [selectedReminderId, setSelectedReminderId] = useState<string>();
  const selectedReminder = useMemo(
    () => pendingReminders.find((reminder) => reminder.id === selectedReminderId),
    [pendingReminders, selectedReminderId],
  );
  const feedbackMessage = actionState.message;

  useEffect(() => {
    if (actionState.status !== "success") {
      return;
    }

    router.refresh();
  }, [actionState, router]);

  return (
    <section
      aria-labelledby="pending-title"
      data-recurring-ready={isHydrated ? "true" : "false"}
    >
      <h3 id="pending-title" className="mb-3 text-subheading">
        待確認週期項目
      </h3>
      <Card className="p-0">
        <ItemGroup>
          {pendingReminders.length === 0 ? (
            <Item className="rounded-none">
              <ItemContent>
                <ItemTitle>沒有待確認週期項目</ItemTitle>
                <ItemDescription>
                  已確認的週期項目會出現在本月紀錄。
                </ItemDescription>
              </ItemContent>
            </Item>
          ) : (
            pendingReminders.map((reminder) => (
              <Item
                className="grid rounded-none border-b border-border last:border-b-0"
                key={reminder.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <ItemContent className="min-w-0">
                    <ItemTitle>{reminder.name}</ItemTitle>
                    <ItemDescription>
                      {reminder.expectedOn} · {reminder.categoryName} ·{" "}
                      {reminder.targetMemberName}
                    </ItemDescription>
                  </ItemContent>
                  <Badge className="shrink-0">待確認</Badge>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-body-strong">
                      {formatAmount(reminder.amountCents)}
                    </p>
                    <p className="text-caption text-muted-foreground">
                      尚未計入本月總額
                    </p>
                  </div>
                  {reminder.canConfirm ? (
                    <Button
                      aria-label={`確認 ${reminder.name} 入帳`}
                      disabled={!isHydrated}
                      onClick={() => setSelectedReminderId(reminder.id)}
                      size="icon"
                      type="button"
                      variant="secondary"
                    >
                      <CalendarCheck aria-hidden="true" size={18} />
                    </Button>
                  ) : null}
                </div>
              </Item>
            ))
          )}
        </ItemGroup>
      </Card>

      {feedbackMessage ? (
        <Alert
          className="mt-3"
          variant={actionState.status === "success" ? "default" : "destructive"}
        >
          <AlertDescription>{feedbackMessage}</AlertDescription>
        </Alert>
      ) : null}

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReminderId(undefined);
          }
        }}
        open={Boolean(selectedReminder)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>確認週期提醒</DialogTitle>
            <DialogDescription>
              {selectedReminder
                ? `將 ${selectedReminder.name} 建立為 ${selectedReminder.expectedOn} 的本月紀錄，金額 ${formatAmount(selectedReminder.amountCents)}。`
                : "確認後會建立本月紀錄。"}
            </DialogDescription>
          </DialogHeader>
          {selectedReminder ? (
            <form
              action={formAction}
              className="grid gap-4"
              onSubmit={() => setSelectedReminderId(undefined)}
            >
              <input name="month" type="hidden" value={month} />
              <input
                name="occurrenceId"
                type="hidden"
                value={selectedReminder.id}
              />
              <div className="flex justify-end gap-2">
                <DialogClose asChild>
                  <Button type="button" variant="secondary">
                    取消
                  </Button>
                </DialogClose>
                <Button type="submit">確認建立紀錄</Button>
              </div>
            </form>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}

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
