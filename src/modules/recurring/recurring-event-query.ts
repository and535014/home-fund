import {
  resolveRecurringTargetDate,
  type RecurringPostingMode,
  type RecurringRecordType,
  type RecurringSchedule,
} from "./recurring-event";

type RecurringEventSettingsRow = {
  amountCents: number;
  categoryId: string;
  dayOfMonth: number | null;
  id: string;
  name: string;
  postingMode: RecurringPostingMode;
  scheduleAnchor: "fixed_day" | "month_end";
  type: RecurringRecordType;
};

export type RecurringEventSettingsItem = {
  amountCents: number;
  categoryId: string;
  id: string;
  name: string;
  nextOccurrenceLabel: string;
  postingMode: RecurringPostingMode;
  schedule: RecurringSchedule;
  type: RecurringRecordType;
};

export type RecurringEventSettingsPrismaClient = {
  recurringRule: {
    findMany(args: {
      orderBy: Array<{ type: "asc" } | { name: "asc" }>;
      select: Record<keyof RecurringEventSettingsRow, true>;
      where: {
        active: true;
        deletedAt: null;
        householdId: string;
      };
    }): Promise<RecurringEventSettingsRow[]>;
  };
};

export async function loadRecurringEventsForSettings({
  householdId,
  now = new Date(),
  prisma,
}: {
  householdId: string;
  now?: Date;
  prisma: RecurringEventSettingsPrismaClient;
}): Promise<RecurringEventSettingsItem[]> {
  const rows = await prisma.recurringRule.findMany({
    orderBy: [{ type: "asc" }, { name: "asc" }],
    select: {
      amountCents: true,
      categoryId: true,
      dayOfMonth: true,
      id: true,
      name: true,
      postingMode: true,
      scheduleAnchor: true,
      type: true,
    },
    where: {
      active: true,
      deletedAt: null,
      householdId,
    },
  });

  return rows.map((row) => {
    const schedule = mapSchedule(row);

    return {
      amountCents: row.amountCents,
      categoryId: row.categoryId,
      id: row.id,
      name: row.name,
      nextOccurrenceLabel: formatNextOccurrenceLabel(schedule, now),
      postingMode: row.postingMode,
      schedule,
      type: row.type,
    };
  });
}

function mapSchedule(row: RecurringEventSettingsRow): RecurringSchedule {
  return row.scheduleAnchor === "month_end"
    ? { anchor: "month_end" }
    : {
        anchor: "fixed_day",
        dayOfMonth: row.dayOfMonth ?? 1,
      };
}

function formatNextOccurrenceLabel(schedule: RecurringSchedule, now: Date): string {
  const currentMonth = formatYearMonth(now.getFullYear(), now.getMonth() + 1);
  const currentTargetDate = resolveRecurringTargetDate(schedule, currentMonth);

  if (
    typeof currentTargetDate === "string" &&
    currentTargetDate >= formatDateOnly(now)
  ) {
    return formatDisplayDate(currentTargetDate);
  }

  const nextMonthDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const nextMonth = formatYearMonth(
    nextMonthDate.getFullYear(),
    nextMonthDate.getMonth() + 1,
  );
  const nextTargetDate = resolveRecurringTargetDate(schedule, nextMonth);

  return typeof nextTargetDate === "string"
    ? formatDisplayDate(nextTargetDate)
    : "";
}

function formatYearMonth(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, "0")}`;
}

function formatDateOnly(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDisplayDate(date: string): string {
  return date.replaceAll("-", "/");
}
