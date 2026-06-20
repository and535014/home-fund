"use client";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { MonthPickerDialog } from "./month-picker-dialog";
import { addDashboardMonths } from "./month-selection";
import { Button } from "@/components/ui/button";

type MonthSwitcherProps = {
  currentMonth: string;
};

export function MonthSwitcher({
  currentMonth,
}: MonthSwitcherProps) {
  const previousMonth = addDashboardMonths(currentMonth, -1);
  const nextMonth = addDashboardMonths(currentMonth, 1);

  return (
    <div className="inline-flex h-10 w-full items-center overflow-hidden rounded-button border border-border bg-card md:w-auto">
      <Button
        asChild
        aria-label="上一月"
        className="size-10 rounded-none border-0 bg-transparent"
        size="icon"
        variant="ghost"
      >
        <a href={buildMonthHref(previousMonth)}>
          <ChevronLeft aria-hidden="true" size={18} />
        </a>
      </Button>
      <MonthPickerDialog currentMonth={currentMonth} />
      <Button
        asChild
        aria-label="下一月"
        className="size-10 rounded-none border-0 bg-transparent"
        size="icon"
        variant="ghost"
      >
        <a href={buildMonthHref(nextMonth)}>
          <ChevronRight aria-hidden="true" size={18} />
        </a>
      </Button>
    </div>
  );
}

function buildMonthHref(month: string): string {
  return `/?month=${encodeURIComponent(month)}`;
}
