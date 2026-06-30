export type RecurringEventLabelSource = {
  dayOfMonth: number | null;
  postingMode: "immediate" | "reminder";
  scheduleAnchor: "fixed_day" | "month_end";
};

export function recurringEventLabel(rule: RecurringEventLabelSource): string {
  const scheduleLabel = rule.scheduleAnchor === "month_end"
    ? "每月底"
    : `每月 ${rule.dayOfMonth ?? 1} 號`;
  const postingModeLabel = rule.postingMode === "immediate"
    ? "馬上入帳"
    : "提醒入帳";

  return `${scheduleLabel}，${postingModeLabel}`;
}
