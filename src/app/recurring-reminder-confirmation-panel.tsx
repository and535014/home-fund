"use client";

import { CalendarCheck } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
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
import type { RecurringReminderFeedback } from "./recurring-reminder-feedback";
import type { PendingRecurringReminder } from "./home-access";

type RecurringReminderConfirmationPanelProps = {
  confirmRecurringReminderAction: (formData: FormData) => void;
  feedback?: RecurringReminderFeedback;
  month: string;
  pendingReminders: PendingRecurringReminder[];
  returnTo?: string;
};

export function RecurringReminderConfirmationPanel({
  confirmRecurringReminderAction,
  feedback,
  month,
  pendingReminders,
  returnTo = "/",
}: RecurringReminderConfirmationPanelProps) {
  const isHydrated = useHydrated();
  const [selectedReminderId, setSelectedReminderId] = useState<string>();
  const selectedReminder = useMemo(
    () => pendingReminders.find((reminder) => reminder.id === selectedReminderId),
    [pendingReminders, selectedReminderId],
  );
  const feedbackMessage = feedback ? feedbackMessages[feedback] : undefined;

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
          variant={feedback === "confirmed" ? "default" : "destructive"}
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
            <form action={confirmRecurringReminderAction} className="grid gap-4">
              <input name="month" type="hidden" value={month} />
              <input name="returnTo" type="hidden" value={returnTo} />
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

const feedbackMessages: Record<RecurringReminderFeedback, string> = {
  confirmed: "已確認週期提醒。",
  permission_denied: "你沒有確認這筆週期提醒的權限。",
  missing_occurrence: "找不到這筆週期提醒，請重新整理後再試。",
  occurrence_already_posted: "這筆週期提醒已確認入帳，請重新整理。",
  stale_confirmation: "這筆週期提醒已確認入帳，請重新整理。",
  occurrence_rule_mismatch: "這筆週期提醒資料不一致，請重新整理後再試。",
  ledger_record_creation_failed: "這筆週期提醒目前無法建立紀錄。",
  invalid_amount: "這筆週期提醒的金額無法建立紀錄。",
  invalid_day_of_month: "這筆週期提醒的日期無法建立紀錄。",
  missing_category: "這筆週期提醒缺少分類，請檢查規則設定。",
  archived_category: "這筆週期提醒的分類已封存，請檢查規則設定。",
  category_type_mismatch: "這筆週期提醒的分類類型不符，請檢查規則設定。",
  missing_income_source_member: "這筆收入提醒缺少收入來源成員。",
  missing_payment_source: "這筆支出提醒缺少付款來源。",
  missing_member_payer: "這筆支出提醒缺少代墊成員。",
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
