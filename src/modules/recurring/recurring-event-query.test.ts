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
});
