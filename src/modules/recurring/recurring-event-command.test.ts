import { beforeEach, describe, expect, it, vi } from "vitest";
import { postRecurringOccurrence } from "../fund-ledger/ledger-record-creation";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  createRecurringEventInDatabase,
  deleteRecurringEventInDatabase,
  ensureRecurringOccurrencesForMonth,
  runRecurringPostingJob,
} from "./recurring-event-command";

vi.mock("../fund-ledger/ledger-record-creation", () => ({
  postRecurringOccurrence: vi.fn(),
}));

const admin: AuthenticatedMember = {
  id: "member-admin",
  googleAccountLinked: true,
  roles: ["admin"],
};

const categories = [
  { id: "income-rent", status: "active" as const, type: "income" as const },
  { id: "expense-network", status: "active" as const, type: "expense" as const },
];

beforeEach(() => {
  vi.mocked(postRecurringOccurrence).mockReset();
});

function recurringRule(overrides: Record<string, unknown> = {}) {
  return {
    active: true,
    amountCents: 1_800_000,
    categoryId: "income-rent",
    createdAt: new Date("2026-06-01T00:00:00.000Z"),
    createdByMemberId: "member-admin",
    dayOfMonth: 1,
    deletedAt: null,
    householdId: "household-demo",
    id: "event-rent",
    name: "成員 A 房租收入",
    note: null,
    payerMemberId: null,
    paymentSource: null,
    postingMode: "reminder" as const,
    scheduleAnchor: "fixed_day" as const,
    sourceMemberId: "member-a",
    type: "income" as const,
    ...overrides,
  };
}

function commandPrisma({
  rules = [],
  existingOccurrence = null,
}: {
  rules?: ReturnType<typeof recurringRule>[];
  existingOccurrence?: Record<string, unknown> | null;
} = {}) {
  let transactionOpen = false;
  const tx = {
    category: { findMany: vi.fn(async () => categories) },
    recurringOccurrence: {
      create: vi.fn(async ({ data }) => data),
      findUnique: vi.fn(async () => existingOccurrence),
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
    recurringRule: {
      create: vi.fn(async ({ data }) => data),
      findFirst: vi.fn(async () => rules[0] ?? null),
      findMany: vi.fn(async () => rules),
      update: vi.fn(async () => undefined),
    },
  };
  const prisma = {
    $transaction: vi.fn(async (callback: (value: typeof tx) => unknown) => {
      transactionOpen = true;
      try {
        return await callback(tx);
      } finally {
        transactionOpen = false;
      }
    }),
  };

  return { prisma, transactionOpen: () => transactionOpen, tx };
}

describe("createRecurringEventInDatabase", () => {
  it("commits a future reminder event and occurrence without posting", async () => {
    const { prisma, tx } = commandPrisma();

    await expect(createRecurringEventInDatabase(admin, {
      amountCents: 1_800_000,
      categoryId: "income-rent",
      name: "成員 A 房租收入",
      postingMode: "reminder",
      schedule: { anchor: "fixed_day", dayOfMonth: 17 },
      sourceMemberId: "member-a",
      type: "income",
    }, {
      generateId: () => "event-rent",
      generateOccurrenceId: () => "occ-rent-2026-06",
      householdId: "household-demo",
      now: () => new Date("2026-06-16T01:00:00.000Z"),
      prisma: prisma as never,
    })).resolves.toMatchObject({
      ok: true,
      currentOccurrenceStatus: "pending",
      event: { id: "event-rent" },
    });
    expect(tx.recurringRule.create).toHaveBeenCalledTimes(1);
    expect(tx.recurringOccurrence.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "occ-rent-2026-06",
        status: "pending",
        targetDate: new Date("2026-06-17T00:00:00.000Z"),
      }),
    });
    expect(postRecurringOccurrence).not.toHaveBeenCalled();
  });

  it("commits an immediate event before posting and reports unavailable separately", async () => {
    const { prisma, transactionOpen, tx } = commandPrisma();
    vi.mocked(postRecurringOccurrence).mockImplementation(async (_actor, input) => {
      expect(transactionOpen()).toBe(false);
      return { status: "unavailable", occurrenceId: input.occurrenceId };
    });

    await expect(createRecurringEventInDatabase(admin, {
      amountCents: 129_900,
      categoryId: "expense-network",
      name: "網路費",
      payerMemberId: "member-a",
      paymentSource: "member",
      postingMode: "immediate",
      schedule: { anchor: "fixed_day", dayOfMonth: 16 },
      type: "expense",
    }, {
      generateId: () => "event-network",
      generateOccurrenceId: () => "occ-network-2026-06",
      householdId: "household-demo",
      now: () => new Date("2026-06-16T01:00:00.000Z"),
      prisma: prisma as never,
    })).resolves.toMatchObject({
      ok: true,
      currentOccurrenceStatus: "unavailable",
      event: { id: "event-network" },
    });
    expect(tx.recurringRule.create).toHaveBeenCalledTimes(1);
    expect(tx.recurringOccurrence.create).toHaveBeenCalledTimes(1);
    expect(postRecurringOccurrence).toHaveBeenCalledWith(
      {
        kind: "member",
        member: { ...admin, householdId: "household-demo" },
      },
      { occurrenceId: "occ-network-2026-06" },
    );
  });

  it("does not create a current occurrence whose target date already passed", async () => {
    const { prisma, tx } = commandPrisma();

    await expect(createRecurringEventInDatabase(admin, {
      amountCents: 1_800_000,
      categoryId: "income-rent",
      name: "已過日期",
      postingMode: "reminder",
      schedule: { anchor: "fixed_day", dayOfMonth: 1 },
      sourceMemberId: "member-a",
      type: "income",
    }, {
      householdId: "household-demo",
      now: () => new Date("2026-06-16T01:00:00.000Z"),
      prisma: prisma as never,
    })).resolves.toMatchObject({
      ok: true,
      currentOccurrenceStatus: "not_created",
    });
    expect(tx.recurringOccurrence.create).not.toHaveBeenCalled();
    expect(postRecurringOccurrence).not.toHaveBeenCalled();
  });
});

describe("deleteRecurringEventInDatabase", () => {
  it("soft-deletes an active recurring event and skips pending occurrences", async () => {
    const { prisma, tx } = commandPrisma({ rules: [recurringRule()] });

    await expect(deleteRecurringEventInDatabase(admin, {
      recurringEventId: "event-rent",
    }, {
      householdId: "household-demo",
      now: () => new Date("2026-06-28T00:00:00.000Z"),
      prisma: prisma as never,
    })).resolves.toEqual({
      ok: true,
      recurringEventId: "event-rent",
      skippedPendingOccurrenceCount: 1,
    });
    expect(tx.recurringOccurrence.updateMany).toHaveBeenCalledWith({
      where: {
        householdId: "household-demo",
        recurringRuleId: "event-rent",
        status: "pending",
      },
      data: { status: "skipped" },
    });
  });
});

describe("ensureRecurringOccurrencesForMonth", () => {
  it("commits each generated occurrence independently", async () => {
    const rules = [
      recurringRule({ id: "event-first" }),
      recurringRule({ id: "event-failing" }),
    ];
    const committedOccurrenceIds: string[] = [];
    let stagedOccurrenceIds: string[] = [];
    const tx = {
      recurringOccurrence: {
        create: vi.fn(async ({ data }: { data: { id: string } }) => {
          stagedOccurrenceIds.push(data.id);
          if (data.id === "occ-failing") {
            throw Object.assign(new Error("database unavailable"), {
              name: "PrismaClientKnownRequestError",
            });
          }
          return data;
        }),
        findUnique: vi.fn(async () => null),
      },
      recurringRule: {
        findMany: vi.fn(async () => rules),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (value: typeof tx) => unknown) => {
        stagedOccurrenceIds = [];
        try {
          const result = await callback(tx);
          committedOccurrenceIds.push(...stagedOccurrenceIds);
          return result;
        } finally {
          stagedOccurrenceIds = [];
        }
      }),
    };
    const generatedIds = ["occ-first", "occ-failing"];

    await expect(ensureRecurringOccurrencesForMonth(
      { kind: "system", capability: "post_recurring_occurrence", householdId: "household-demo" },
      { month: "2026-07" },
      {
        generateOccurrenceId: () => generatedIds.shift() ?? "unexpected",
        householdId: "household-demo",
        now: () => new Date("2026-07-15T01:00:00.000Z"),
        prisma: prisma as never,
      },
    )).rejects.toThrow("database unavailable");
    expect(committedOccurrenceIds).toEqual(["occ-first"]);
  });

  it("commits generation first, then posts each due immediate occurrence once", async () => {
    const rules = [
      recurringRule({
        id: "event-network",
        categoryId: "expense-network",
        name: "網路費",
        postingMode: "immediate",
        type: "expense",
        paymentSource: "fund",
        sourceMemberId: null,
        dayOfMonth: 15,
      }),
      recurringRule({ id: "event-rent", postingMode: "reminder" }),
    ];
    const { prisma, transactionOpen } = commandPrisma({ rules });
    vi.mocked(postRecurringOccurrence).mockImplementation(async (_actor, input) => {
      expect(transactionOpen()).toBe(false);
      return {
        status: "blocked",
        occurrenceId: input.occurrenceId,
        reason: "archived_category",
      };
    });

    await expect(ensureRecurringOccurrencesForMonth(
      { kind: "system", capability: "post_recurring_occurrence", householdId: "household-demo" },
      { month: "2026-07" },
      {
        householdId: "household-demo",
        now: () => new Date("2026-07-15T01:00:00.000Z"),
        prisma: prisma as never,
      },
    )).resolves.toEqual({
      alreadyPostedCount: 0,
      blockedCount: 1,
      pendingCount: 1,
      postedCount: 0,
      skippedCount: 0,
      unavailableCount: 0,
    });
    expect(postRecurringOccurrence).toHaveBeenCalledTimes(1);
  });

  it("keeps future immediate occurrences pending but counts them as skipped for posting", async () => {
    const { prisma } = commandPrisma({
      rules: [recurringRule({ postingMode: "immediate", dayOfMonth: 28 })],
    });

    await expect(ensureRecurringOccurrencesForMonth(
      { kind: "system", capability: "post_recurring_occurrence", householdId: "household-demo" },
      { month: "2026-07" },
      {
        householdId: "household-demo",
        now: () => new Date("2026-07-15T01:00:00.000Z"),
        prisma: prisma as never,
      },
    )).resolves.toMatchObject({
      postedCount: 0,
      skippedCount: 1,
    });
    expect(postRecurringOccurrence).not.toHaveBeenCalled();
  });
});

describe("runRecurringPostingJob", () => {
  it("constructs a scoped system actor per household without loading a Member", async () => {
    const { prisma: transactionPrisma } = commandPrisma({
      rules: [recurringRule({ postingMode: "immediate", dayOfMonth: 1 })],
    });
    const prisma = {
      ...transactionPrisma,
      household: {
        findMany: vi.fn(async () => [
          { id: "household-a" },
          { id: "household-b" },
        ]),
      },
    };
    vi.mocked(postRecurringOccurrence).mockImplementation(async (_actor, input) => ({
      status: "posted",
      occurrenceId: input.occurrenceId,
      recordId: `record-${input.occurrenceId}`,
    }));

    await expect(runRecurringPostingJob({
      prisma: prisma as never,
      targetDate: new Date("2026-06-30T16:30:00.000Z"),
    })).resolves.toMatchObject({
      blockedCount: 0,
      householdCount: 2,
      postedCount: 2,
      skippedHouseholdCount: 0,
      targetMonth: "2026-07",
      unavailableCount: 0,
    });
    expect(postRecurringOccurrence).toHaveBeenNthCalledWith(
      1,
      {
        kind: "system",
        capability: "post_recurring_occurrence",
        householdId: "household-a",
      },
      expect.any(Object),
    );
    expect(postRecurringOccurrence).toHaveBeenNthCalledWith(
      2,
      {
        kind: "system",
        capability: "post_recurring_occurrence",
        householdId: "household-b",
      },
      expect.any(Object),
    );
    expect(prisma).not.toHaveProperty("member");
  });
});
