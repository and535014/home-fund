export function formatAmount(amountCents: number): string {
  return formatAmountFromMajor(amountCents / 100);
}

export function formatAmountFromMajor(amount: number): string {
  return new Intl.NumberFormat("zh-TW", {
    currency: "TWD",
    maximumFractionDigits: 0,
    style: "currency",
  }).format(amount);
}
