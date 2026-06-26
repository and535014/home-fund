"use client";

import { useState } from "react";
import { formatDashboardMonthLabel } from "./month-selection";
import { Button } from "@/components/ui/button";
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

type MonthPickerDialogProps = {
  currentMonth: string;
};

export function MonthPickerDialog({
  currentMonth,
}: MonthPickerDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <MonthPickerButton currentMonth={currentMonth} />
      </DialogTrigger>
      <MonthPickerDialogContent currentMonth={currentMonth} />
    </Dialog>
  );
}

type MonthPickerButtonProps = {
  currentMonth: string;
} & Omit<React.ComponentProps<typeof Button>, "children">;

function MonthPickerButton({
  currentMonth,
  ...props
}: MonthPickerButtonProps) {
  return (
    <Button
      className="h-10 min-w-28 flex-1 rounded-none border-x border-border bg-transparent px-4 tabular-nums md:flex-none"
      type="button"
      variant="ghost"
      {...props}
    >
      <span>{currentMonth}</span>
    </Button>
  );
}

type MonthPickerDialogContentProps = {
  currentMonth: string;
};

function MonthPickerDialogContent({
  currentMonth,
}: MonthPickerDialogContentProps) {
  const [currentYear, currentMonthNumber] = currentMonth.split("-");
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthNumber);
  const yearOptions = buildYearOptions(Number(currentYear));

  return (
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle>自訂月份</DialogTitle>
        <DialogDescription className="sr-only">
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
          <div className="grid gap-3 sm:grid-cols-2">
            <Field>
              <FieldLabel>年份</FieldLabel>
              <Select onValueChange={setSelectedYear} value={selectedYear}>
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
              <Select onValueChange={setSelectedMonth} value={selectedMonth}>
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
          <DialogFooter>
            <FormSubmitButton pendingLabel="套用中..." type="submit">
              套用月份
            </FormSubmitButton>
          </DialogFooter>
        </FieldGroup>
      </form>
    </DialogContent>
  );
}

function buildYearOptions(currentYear: number): number[] {
  return Array.from({ length: 11 }, (_, index) => currentYear - 5 + index);
}

const monthOptions = Array.from({ length: 12 }, (_, index) =>
  String(index + 1).padStart(2, "0"),
);
