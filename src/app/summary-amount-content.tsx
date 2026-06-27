import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";

export function SummaryAmountContent({
  amountToneClassName,
  className,
  label,
  totalAmountCents,
  totalCount,
}: {
  amountToneClassName: string;
  className?: string;
  label?: string;
  totalAmountCents: number;
  totalCount: number;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center justify-between gap-3",
        className,
      )}
    >
      <span className="text-label">{label ?? `搜尋結果 ${totalCount} 筆`}</span>
      <div className="flex min-w-0 items-center gap-2 text-right">
        <span className="text-caption text-muted-foreground">總額</span>
        <span className={cn("text-label", amountToneClassName)}>
          {formatAmount(Math.abs(totalAmountCents))}
        </span>
      </div>
    </div>
  );
}
