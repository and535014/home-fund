import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";

export function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "income" | "expense";
}) {
  const valueColor =
    tone === "income"
      ? "text-income"
      : tone === "expense"
        ? "text-expense"
        : "text-foreground";

  return (
    <Card>
      <CardContent>
        <p className="text-label text-muted-foreground">{label}</p>
        <p className={`mt-2 text-heading ${valueColor}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

export function RecordsTable({
  categoryNames,
  records,
}: {
  categoryNames: Map<string, string>;
  records: LedgerRecord[];
}) {
  return (
    <Card className="overflow-hidden">
      <Table className="min-w-[42rem] sm:min-w-0">
        <TableHeader>
          <TableRow>
            <TableHead>日期</TableHead>
            <TableHead>分類</TableHead>
            <TableHead>狀態</TableHead>
            <TableHead className="text-right">金額</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.length === 0 ? (
            <TableRow>
              <TableCell
                className="py-8 text-center text-muted-foreground"
                colSpan={4}
              >
                這個月份尚無紀錄。
              </TableCell>
            </TableRow>
          ) : (
            records.map((record) => (
              <RecordRow
                categoryNames={categoryNames}
                key={record.id}
                record={record}
              />
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

export function formatAmount(amountCents: number): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function RecordRow({
  categoryNames,
  record,
}: {
  categoryNames: Map<string, string>;
  record: LedgerRecord;
}) {
  const isIncome = record.type === "income";

  return (
    <TableRow>
      <TableCell className="text-caption text-muted-foreground">
        {record.occurredOn}
      </TableCell>
      <TableCell className="min-w-52">
        <p className="truncate text-body-strong">{record.name}</p>
        <p className="text-caption text-muted-foreground">
          {categoryNames.get(record.categoryId) ?? record.categoryId} ·{" "}
          {isIncome
            ? "家庭成員收入"
            : record.paymentSource === "member"
              ? "成員代墊"
              : "基金支出"}
        </p>
      </TableCell>
      <TableCell>
        <Badge>{ledgerRecordStatusLabel(record)}</Badge>
      </TableCell>
      <TableCell
        className={`text-right text-body-strong ${
          isIncome ? "text-income" : "text-expense"
        }`}
      >
        {isIncome ? "+" : "-"}
        {formatAmount(record.amountCents)}
      </TableCell>
    </TableRow>
  );
}

function ledgerRecordStatusLabel(record: LedgerRecord): string {
  if (record.type === "income") {
    return "已入帳";
  }

  const reimbursementStatusLabels: Record<
    LedgerRecord["reimbursementStatus"],
    string
  > = {
    not_applicable: "不適用",
    not_refundable: "不需退款",
    refundable: "待退款",
    reimbursed: "已退款",
  };

  return reimbursementStatusLabels[record.reimbursementStatus];
}
