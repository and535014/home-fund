const defaultTimeZone = "Asia/Taipei";

export function readMonthParam(
  value: string | string[] | undefined,
  now = new Date(),
): string {
  const month = Array.isArray(value) ? value[0] : value;

  return isMonth(month) ? month : getCurrentMonth(now);
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

export function addMonths(month: string, offset: number): string {
  const [yearPart, monthPart] = month.split("-");
  const date = new Date(Date.UTC(Number(yearPart), Number(monthPart) - 1 + offset, 1));

  return formatUtcMonth(date);
}

export function formatMonthLabel(month: string): string {
  const [year, monthPart] = month.split("-");

  return `${year} 年 ${Number(monthPart)} 月`;
}

export function getCurrentMonth(date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    month: "2-digit",
    timeZone: defaultTimeZone,
    year: "numeric",
  }).formatToParts(date);
  const valueByType = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${valueByType.year}-${valueByType.month}`;
}

function formatUtcMonth(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}
