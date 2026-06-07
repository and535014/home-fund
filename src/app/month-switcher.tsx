"use client";

import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState } from "react";
import {
  addDashboardMonths,
  formatDashboardMonthLabel,
} from "./month-selection";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MonthSwitcherProps = {
  currentMonth: string;
};

export function MonthSwitcher({
  currentMonth,
}: MonthSwitcherProps) {
  const previousMonth = addDashboardMonths(currentMonth, -1);
  const nextMonth = addDashboardMonths(currentMonth, 1);
  const [currentYear, currentMonthNumber] = currentMonth.split("-");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthNumber);
  const yearOptions = buildYearOptions(Number(currentYear));

  return (
    <div className="flex w-full items-center gap-1 md:w-auto">
      <Button
        asChild
        aria-label="上一月"
        className="size-10"
        size="icon"
        variant="outline"
      >
        <a href={buildMonthHref(previousMonth)}>
          <ChevronLeft aria-hidden="true" size={18} />
        </a>
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button
            className="h-10 min-w-0 flex-1 px-3 md:flex-none"
            type="button"
            variant="outline"
          >
            <span>{currentMonth}</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>自訂月份</DialogTitle>
            <DialogDescription>
              目前查看 {formatDashboardMonthLabel(currentMonth)} 的月報。
            </DialogDescription>
          </DialogHeader>
          <form action="/" method="get">
            <FieldGroup>
              <input
                name="month"
                type="hidden"
                value={`${selectedYear}-${selectedMonth}`}
              />
              <div className="grid grid-cols-[minmax(0,1fr)_8rem] gap-3">
                <Field>
                  <FieldLabel>年份</FieldLabel>
                  <Select
                    onValueChange={setSelectedYear}
                    value={selectedYear}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year} 年
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel>月份</FieldLabel>
                  <Select
                    onValueChange={setSelectedMonth}
                    value={selectedMonth}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month) => (
                        <SelectItem key={month} value={month}>
                          {Number(month)} 月
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <Button type="submit">套用月份</Button>
            </FieldGroup>
          </form>
        </DialogContent>
      </Dialog>
      <Button
        asChild
        aria-label="下一月"
        className="size-10"
        size="icon"
        variant="outline"
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

function buildYearOptions(currentYear: number): number[] {
  return Array.from({ length: 11 }, (_, index) => currentYear - 5 + index);
}

const monthOptions = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
