import { describe, expect, it, vi } from "vitest";
import { loadRecurringEventsForSettings } from "./recurring-event-query";

describe("loadRecurringEventsForSettings", () => {
  it("loads active recurring events for settings", async () => {
    const findMany = vi.fn(async () => [
      {
        amountCents: 129_900,
        categoryId: "expense-network",
        dayOfMonth: 15,
        id: "event-network",
        name: "網路費",
        payerMemberId: "member-mei",
        paymentSource: "member" as const,
        postingMode: "immediate" as const,
        scheduleAnchor: "fixed_day" as const,
        sourceMemberId: null,
        type: "expense" as const,
      },
      {
        amountCents: 320_000,
        categoryId: "expense-maintenance",
        dayOfMonth: null,
        id: "event-maintenance",
        name: "月底管理費",
        payerMemberId: null,
        paymentSource: "fund" as const,
        postingMode: "reminder" as const,
        scheduleAnchor: "month_end" as const,
        sourceMemberId: null,
        type: "expense" as const,
      },
    ]);

    await expect(
      loadRecurringEventsForSettings({
        householdId: "household-demo",
        now: new Date("2026-07-16T08:00:00.000+08:00"),
        prisma: { recurringRule: { findMany } },
      }),
    ).resolves.toEqual([
      {
        amountCents: 129_900,
        categoryId: "expense-network",
        id: "event-network",
        name: "網路費",
        nextOccurrenceLabel: "2026/08/15",
        payerMemberId: "member-mei",
        paymentSource: "member",
        postingMode: "immediate",
        schedule: { anchor: "fixed_day", dayOfMonth: 15 },
        sourceMemberId: null,
        type: "expense",
      },
      {
        amountCents: 320_000,
        categoryId: "expense-maintenance",
        id: "event-maintenance",
        name: "月底管理費",
        nextOccurrenceLabel: "2026/07/31",
        payerMemberId: null,
        paymentSource: "fund",
        postingMode: "reminder",
        schedule: { anchor: "month_end" },
        sourceMemberId: null,
        type: "expense",
      },
    ]);
    expect(findMany).toHaveBeenCalledWith({
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
        householdId: "household-demo",
      },
    });
  });

  it.each([
    [
      "uses the Taipei calendar date when UTC is still on the previous day",
      "2026-07-14T16:30:00.000Z",
      14,
      "2026/08/14",
    ],
    [
      "rolls a fixed day after the 28th into the next month",
      "2026-07-28T16:30:00.000Z",
      28,
      "2026/08/28",
    ],
    [
      "rolls December into the next year",
      "2026-12-28T16:30:00.000Z",
      28,
      "2027/01/28",
    ],
  ] as const)("%s", async (_case, now, dayOfMonth, expectedLabel) => {
    const previousTimeZone = process.env.TZ;
    process.env.TZ = "UTC";

    try {
      await expect(nextFixedDayLabel({
        dayOfMonth,
        now: new Date(now),
      })).resolves.toBe(expectedLabel);
    } finally {
      if (previousTimeZone === undefined) {
        delete process.env.TZ;
      } else {
        process.env.TZ = previousTimeZone;
      }
    }
  });
});

async function nextFixedDayLabel({
  dayOfMonth,
  now,
}: {
  dayOfMonth: number;
  now: Date;
}) {
  const items = await loadRecurringEventsForSettings({
    householdId: "household-demo",
    now,
    prisma: {
      recurringRule: {
        findMany: vi.fn(async () => [
          {
            amountCents: 1_000,
            categoryId: "income-living",
            dayOfMonth,
            id: "event-fixed-day",
            name: "固定日期收入",
            payerMemberId: null,
            paymentSource: null,
            postingMode: "reminder" as const,
            scheduleAnchor: "fixed_day" as const,
            sourceMemberId: "member-mei",
            type: "income" as const,
          },
        ]),
      },
    },
  });

  return items[0]?.nextOccurrenceLabel;
}
