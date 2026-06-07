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
