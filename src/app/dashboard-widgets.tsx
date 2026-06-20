import { Card, CardContent } from "@/components/ui/card";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import { RecordListDetail } from "@/app/record-list-detail";

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
  memberNames,
  records,
}: {
  categoryNames: Map<string, string>;
  memberNames: Map<string, string>;
  records: LedgerRecord[];
}) {
  return (
    <RecordListDetail
      categoryNames={Object.fromEntries(categoryNames)}
      memberNames={Object.fromEntries(memberNames)}
      records={records}
    />
  );
}

export function formatAmount(amountCents: number): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}
