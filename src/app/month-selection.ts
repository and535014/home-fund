export const defaultDashboardMonth = "2026-06";

export function readDashboardMonth(
  value: string | string[] | undefined,
): string {
  const month = Array.isArray(value) ? value[0] : value;

  return isMonth(month) ? month : defaultDashboardMonth;
}

function isMonth(value: string | undefined): value is string {
  if (!value) {
    return false;
  }

  const match = /^(?<year>\d{4})-(?<month>\d{2})$/.exec(value);

  if (!match?.groups) {
    return false;
  }

  const month = Number(match.groups.month);

  return month >= 1 && month <= 12;
}

export function addDashboardMonths(month: string, offset: number): string {
  const [yearPart, monthPart] = month.split("-");
  const date = new Date(Date.UTC(Number(yearPart), Number(monthPart) - 1 + offset, 1));

  return formatDashboardMonth(date);
}

export function formatDashboardMonthLabel(month: string): string {
  const [year, monthPart] = month.split("-");

  return `${year} 年 ${Number(monthPart)} 月`;
}

export function getCurrentDashboardMonth(date = new Date()): string {
  return formatDashboardMonth(date);
}

function formatDashboardMonth(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}
