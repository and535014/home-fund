"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Loader2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type PrototypeMode = "normal" | "empty" | "permission" | "conflict";

type LedgerFixture = {
  id: string;
  name: string;
  occurredOn: string;
  status: string;
  amountCents: number;
  type: "income" | "expense";
};

const baseRecords: LedgerFixture[] = [
  {
    id: "income-rent-june",
    name: "六月房租",
    occurredOn: "2026-06-05",
    status: "已入帳",
    amountCents: 120_000_00,
    type: "income",
  },
  {
    id: "expense-internet-june",
    name: "網路費",
    occurredOn: "2026-06-05",
    status: "不需退款",
    amountCents: 899_00,
    type: "expense",
  },
  {
    id: "expense-grocery-june",
    name: "日用品代墊",
    occurredOn: "2026-06-09",
    status: "待退款",
    amountCents: 6_420_00,
    type: "expense",
  },
  {
    id: "income-living-june",
    name: "六月生活費",
    occurredOn: "2026-06-10",
    status: "已入帳",
    amountCents: 80_000_00,
    type: "income",
  },
  {
    id: "expense-supplies-june",
    name: "補充用品代墊",
    occurredOn: "2026-06-13",
    status: "待退款",
    amountCents: 1_880_00,
    type: "expense",
  },
];

const confirmedRecurringRecord: LedgerFixture = {
  id: "income-living-kai-recurring-june",
  name: "Kai 每月生活費",
  occurredOn: "2026-06-10",
  status: "週期確認",
  amountCents: 80_000_00,
  type: "income",
};

export function RecurringReminderConfirmationPrototype() {
  const [mode, setMode] = useState<PrototypeMode>("normal");
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const records = useMemo(
    () => (isConfirmed ? [...baseRecords, confirmedRecurringRecord] : baseRecords),
    [isConfirmed],
  );
  const totals = useMemo(() => calculateTotals(records), [records]);
  const hasPendingReminder = mode === "normal" && !isConfirmed;

  function changeMode(nextMode: PrototypeMode) {
    setMode(nextMode);
    setIsConfirmed(false);
    setIsDialogOpen(false);
    setIsSubmitting(false);
  }

  function confirmReminder() {
    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      setIsDialogOpen(false);
      setIsConfirmed(true);
    }, 550);
  }

  return (
    <div className="grid gap-5">
      <section aria-label="Prototype states" className="flex flex-wrap gap-2">
        {prototypeModes.map((prototypeMode) => (
          <Button
            aria-pressed={mode === prototypeMode.id}
            key={prototypeMode.id}
            onClick={() => changeMode(prototypeMode.id)}
            type="button"
            variant={mode === prototypeMode.id ? "default" : "secondary"}
          >
            {prototypeMode.label}
          </Button>
        ))}
      </section>

      <section
        aria-label="月報摘要"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
      >
        <SummaryMetric
          label="確認收入"
          tone="income"
          value={formatAmount(totals.incomeCents)}
        />
        <SummaryMetric
          label="確認支出"
          tone="expense"
          value={formatAmount(totals.expenseCents)}
        />
        <SummaryMetric
          label="本月結餘"
          tone="default"
          value={formatAmount(totals.incomeCents - totals.expenseCents)}
        />
        <SummaryMetric
          label="待確認"
          tone="default"
          value={hasPendingReminder ? formatAmount(80_000_00) : "$0"}
        />
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
        <section aria-labelledby="records-title" className="min-w-0">
          <div className="mb-3">
            <h3 id="records-title" className="text-subheading">
              本月紀錄
            </h3>
            <p className="text-caption text-muted-foreground">
              {records.length} 筆確認紀錄
            </p>
          </div>
          <Card className="overflow-hidden">
            <Table className="min-w-[34rem] sm:min-w-0">
              <TableHeader>
                <TableRow>
                  <TableHead>日期</TableHead>
                  <TableHead>項目</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right">金額</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="text-caption text-muted-foreground">
                      {record.occurredOn}
                    </TableCell>
                    <TableCell>{record.name}</TableCell>
                    <TableCell>
                      <Badge
                        variant={record.status === "週期確認" ? "default" : "secondary"}
                      >
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className={`text-right text-body-strong ${
                        record.type === "income" ? "text-income" : "text-expense"
                      }`}
                    >
                      {record.type === "income" ? "+" : "-"}
                      {formatAmount(record.amountCents)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>

        <aside className="grid content-start gap-5">
          <section aria-labelledby="pending-title">
            <div className="mb-3">
              <h3 id="pending-title" className="text-subheading">
                待確認週期項目
              </h3>
              <p className="text-caption text-muted-foreground">
                提醒項目確認前不計入本月總額
              </p>
            </div>
            <Card>
              <CardContent className="grid gap-3">
                {mode === "permission" ? (
                  <Alert variant="destructive">
                    <AlertTriangle aria-hidden="true" size={16} />
                    <AlertDescription>
                      你不能確認會建立其他成員紀錄的週期項目。
                    </AlertDescription>
                  </Alert>
                ) : null}
                {mode === "conflict" ? (
                  <Alert variant="destructive">
                    <AlertTriangle aria-hidden="true" size={16} />
                    <AlertDescription>
                      這筆週期項目已經確認，請重新整理後再查看。
                    </AlertDescription>
                  </Alert>
                ) : null}
                {isConfirmed ? (
                  <Alert>
                    <CheckCircle2 aria-hidden="true" size={16} />
                    <AlertDescription>
                      已確認週期項目，並建立本月收入紀錄。
                    </AlertDescription>
                  </Alert>
                ) : null}
                <PendingReminderContent
                  isConfirmed={isConfirmed}
                  mode={mode}
                  onConfirm={() => setIsDialogOpen(true)}
                />
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>確認政策</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-body">
              <p>
                確認提醒會建立實際 ledger record，因此 prototype 建議沿用
                ledger record creation 權限。
              </p>
              <p className="text-muted-foreground">
                Admin / finance manager 可代確認；一般成員只能確認會建立自己紀錄的提醒。
              </p>
            </CardContent>
          </Card>
        </aside>
      </div>

      <Dialog onOpenChange={setIsDialogOpen} open={isDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>確認週期項目</DialogTitle>
            <DialogDescription>
              確認後會建立 2026-06-10 的收入紀錄「Kai 每月生活費」，
              並計入本月總額。
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-card border border-border bg-secondary/60 p-3">
            <p className="text-body-strong">Kai 每月生活費</p>
            <p className="text-caption text-muted-foreground">
              生活費 · 收入 · {formatAmount(80_000_00)}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button disabled={isSubmitting} type="button" variant="secondary">
                取消
              </Button>
            </DialogClose>
            <Button disabled={isSubmitting} onClick={confirmReminder} type="button">
              {isSubmitting ? (
                <Loader2 aria-hidden="true" className="animate-spin" size={16} />
              ) : null}
              確認入帳
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PendingReminderContent({
  isConfirmed,
  mode,
  onConfirm,
}: {
  isConfirmed: boolean;
  mode: PrototypeMode;
  onConfirm: () => void;
}) {
  if (mode === "empty" || isConfirmed) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-card border border-border p-3">
        <div>
          <p className="text-body-strong">沒有待確認項目</p>
          <p className="text-caption text-muted-foreground">
            本月週期提醒都已處理。
          </p>
        </div>
        <Badge variant="secondary">完成</Badge>
      </div>
    );
  }

  return (
    <div className="grid gap-3 rounded-card border border-border p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-body-strong">Kai 每月生活費</p>
          <p className="text-caption text-muted-foreground">
            2026-06-10 · 生活費 · 收入 · 尚未計入本月總額
          </p>
        </div>
        <Badge variant="outline">待確認</Badge>
      </div>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-body-strong text-income">
          <CircleDollarSign aria-hidden="true" size={16} />
          {formatAmount(80_000_00)}
        </p>
        <Button
          disabled={mode === "permission" || mode === "conflict"}
          onClick={onConfirm}
          type="button"
        >
          <Clock3 aria-hidden="true" size={16} />
          確認入帳
        </Button>
      </div>
    </div>
  );
}

function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "income" | "expense";
}) {
  const valueColor =
    tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "";

  return (
    <Card>
      <CardContent>
        <p className="text-label text-muted-foreground">{label}</p>
        <p className={`mt-2 text-heading ${valueColor}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function calculateTotals(records: LedgerFixture[]) {
  return records.reduce(
    (totals, record) => {
      if (record.type === "income") {
        totals.incomeCents += record.amountCents;
      } else {
        totals.expenseCents += record.amountCents;
      }

      return totals;
    },
    { incomeCents: 0, expenseCents: 0 },
  );
}

function formatAmount(amountCents: number): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

const prototypeModes: { id: PrototypeMode; label: string }[] = [
  { id: "normal", label: "一般" },
  { id: "empty", label: "空狀態" },
  { id: "permission", label: "權限不足" },
  { id: "conflict", label: "已確認衝突" },
];
