import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
    <Card className="gap-2 py-3 sm:gap-4 sm:py-4">
      <CardContent className="px-2.5 sm:px-4">
        <p className="text-center text-caption text-muted-foreground sm:text-left sm:text-label">
          {label}
        </p>
        <p
          className={cn(
            "mt-1 truncate text-center text-body-strong sm:mt-2 sm:text-left sm:text-heading",
            valueColor,
          )}
        >
          {value}
        </p>
      </CardContent>
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
