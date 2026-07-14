export function formatMonthInTimeZone(
  date: Date,
  timeZone: string,
): string {
  const parts = datePartsInTimeZone(date, timeZone);

  return `${parts.year}-${parts.month}`;
}

export function formatDateInTimeZone(
  date: Date,
  timeZone: string,
): string {
  const parts = datePartsInTimeZone(date, timeZone);

  return `${parts.year}-${parts.month}-${parts.day}`;
}

function datePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric",
  }).formatToParts(date);
  const valueByType = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return {
    day: valueByType.day,
    month: valueByType.month,
    year: valueByType.year,
  };
}
