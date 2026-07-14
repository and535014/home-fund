import {
  resolveRecurringTargetDate,
  type RecurringPostingMode,
  type RecurringRecordType,
  type RecurringSchedule,
} from "./recurring-event";
import {
  formatDateInTimeZone,
  formatMonthInTimeZone,
} from "./recurring-date";

const RECURRING_TIME_ZONE = "Asia/Taipei";

type RecurringEventSettingsRow = {
  amountCents: number;
  categoryId: string;
  dayOfMonth: number | null;
  id: string;
  name: string;
  payerMemberId: string | null;
  paymentSource: "fund" | "member" | null;
  postingMode: RecurringPostingMode;
  scheduleAnchor: "fixed_day" | "month_end";
  sourceMemberId: string | null;
  type: RecurringRecordType;
};

export type RecurringEventSettingsItem = {
  amountCents: number;
  categoryId: string;
  id: string;
  name: string;
  nextOccurrenceLabel: string;
  payerMemberId: string | null;
  paymentSource: "fund" | "member" | null;
  postingMode: RecurringPostingMode;
  schedule: RecurringSchedule;
  sourceMemberId: string | null;
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
      payerMemberId: true,
      paymentSource: true,
      postingMode: true,
      scheduleAnchor: true,
      sourceMemberId: true,
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
      payerMemberId: row.payerMemberId,
      paymentSource: row.paymentSource,
      postingMode: row.postingMode,
      schedule,
      sourceMemberId: row.sourceMemberId,
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
  const currentMonth = formatMonthInTimeZone(now, RECURRING_TIME_ZONE);
  const currentTargetDate = resolveRecurringTargetDate(schedule, currentMonth);

  if (
    typeof currentTargetDate === "string" &&
    currentTargetDate >= formatDateInTimeZone(now, RECURRING_TIME_ZONE)
  ) {
    return formatDisplayDate(currentTargetDate);
  }

  const nextMonth = followingMonth(currentMonth);
  const nextTargetDate = resolveRecurringTargetDate(schedule, nextMonth);

  return typeof nextTargetDate === "string"
    ? formatDisplayDate(nextTargetDate)
    : "";
}

function followingMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const nextYear = monthNumber === 12 ? year + 1 : year;
  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;

  return `${nextYear}-${String(nextMonth).padStart(2, "0")}`;
}

function formatDisplayDate(date: string): string {
  return date.replaceAll("-", "/");
}
