import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  confirmRecurringOccurrenceInDatabase,
  createRecurringEventInDatabase,
  deleteRecurringEventInDatabase,
  ensureRecurringOccurrencesForMonth,
} from "./recurring-event-command";

const admin: AuthenticatedMember = {
  id: "member-admin",
  googleAccountLinked: true,
  roles: ["admin"],
};

const generalMember: AuthenticatedMember = {
  id: "member-a",
  googleAccountLinked: true,
  roles: ["general_member"],
};

const categories = [
  { id: "income-rent", status: "active" as const, type: "income" as const },
  { id: "expense-network", status: "active" as const, type: "expense" as const },
];

function createRecurringRuleRow(overrides: Record<string, unknown> = {}) {
  return {
    active: true,
    amountCents: 1_800_000,
    categoryId: "income-rent",
    createdByMemberId: "member-admin",
    dayOfMonth: 1,
    deletedAt: null,
    householdId: "household-demo",
    id: "event-rent",
    name: "成員 A 房租收入",
    note: null,
    payerMemberId: null,
    paymentSource: null,
    postingMode: "reminder",
    scheduleAnchor: "fixed_day",
    sourceMemberId: "member-a",
    type: "income",
    ...overrides,
  };
}

describe("createRecurringEventInDatabase", () => {
  it("validates and writes a recurring event", async () => {
    const recurringRuleCreate = vi.fn(async ({ data }) => data);
    const prisma = {
      category: { findMany: vi.fn(async () => categories) },
      recurringRule: { create: recurringRuleCreate },
    };

    await expect(createRecurringEventInDatabase(admin, {
      amountCents: 1_800_000,
      categoryId: "income-rent",
      name: "成員 A 房租收入",
      postingMode: "reminder",
      schedule: { anchor: "fixed_day", dayOfMonth: 1 },
      sourceMemberId: "member-a",
      type: "income",
    }, {
      householdId: "household-demo",
      prisma,
      generateId: () => "event-rent",
    })).resolves.toMatchObject({
      ok: true,
      event: {
        id: "event-rent",
        schedule: { anchor: "fixed_day", dayOfMonth: 1 },
      },
    });

    expect(recurringRuleCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amountCents: 1_800_000,
        categoryId: "income-rent",
        createdByMemberId: "member-admin",
        dayOfMonth: 1,
        householdId: "household-demo",
        id: "event-rent",
        name: "成員 A 房租收入",
        postingMode: "reminder",
        scheduleAnchor: "fixed_day",
        sourceMemberId: "member-a",
        type: "income",
      }),
    });
  });
});

describe("deleteRecurringEventInDatabase", () => {
  it("soft-deletes an active recurring event", async () => {
    const tx = {
      recurringOccurrence: {
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
      recurringRule: {
        findFirst: vi.fn(async () => createRecurringRuleRow()),
        update: vi.fn(async () => undefined),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    await expect(deleteRecurringEventInDatabase(admin, {
      recurringEventId: "event-rent",
    }, {
      householdId: "household-demo",
      now: () => new Date("2026-06-28T00:00:00.000Z"),
      prisma,
    })).resolves.toEqual({
      ok: true,
      recurringEventId: "event-rent",
      skippedPendingOccurrenceCount: 1,
    });

    expect(tx.recurringRule.update).toHaveBeenCalledWith({
      where: { id: "event-rent" },
      data: {
        active: false,
        deletedAt: new Date("2026-06-28T00:00:00.000Z"),
      },
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
  it("creates a pending reminder occurrence", async () => {
    const tx = {
      category: { findMany: vi.fn(async () => categories) },
      ledgerRecord: { create: vi.fn(async () => undefined) },
      recurringOccurrence: {
        create: vi.fn(async ({ data }) => data),
        findUnique: vi.fn(async () => null),
        update: vi.fn(async () => undefined),
      },
      recurringRule: {
        findMany: vi.fn(async () => [createRecurringRuleRow()]),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    await expect(ensureRecurringOccurrencesForMonth(admin, {
      month: "2026-07",
    }, {
      generateOccurrenceId: () => "occ-rent-2026-07",
      householdId: "household-demo",
      prisma,
    })).resolves.toEqual({
      alreadyPostedCount: 0,
      pendingCount: 1,
      postedCount: 0,
      skippedCount: 0,
    });

    expect(tx.recurringOccurrence.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        householdId: "household-demo",
        id: "occ-rent-2026-07",
        month: "2026-07",
        recurringRuleId: "event-rent",
        status: "pending",
        targetDate: new Date("2026-07-01T00:00:00.000Z"),
      }),
    });
    expect(tx.ledgerRecord.create).not.toHaveBeenCalled();
  });

  it("posts an immediate occurrence once and links the ledger record", async () => {
    const tx = {
      category: { findMany: vi.fn(async () => categories) },
      ledgerRecord: { create: vi.fn(async () => undefined) },
      recurringOccurrence: {
        create: vi.fn(async ({ data }) => data),
        findUnique: vi.fn(async () => null),
        update: vi.fn(async () => undefined),
      },
      recurringRule: {
        findMany: vi.fn(async () => [
          createRecurringRuleRow({
            amountCents: 129_900,
            categoryId: "expense-network",
            dayOfMonth: 15,
            id: "event-network",
            name: "網路費",
            payerMemberId: "member-b",
            paymentSource: "member",
            postingMode: "immediate",
            sourceMemberId: null,
            type: "expense",
          }),
        ]),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    await expect(ensureRecurringOccurrencesForMonth(admin, {
      month: "2026-07",
    }, {
      generateLedgerRecordId: () => "record-network-2026-07",
      generateOccurrenceId: () => "occ-network-2026-07",
      householdId: "household-demo",
      now: () => new Date("2026-07-15T01:00:00.000Z"),
      prisma,
    })).resolves.toEqual({
      alreadyPostedCount: 0,
      pendingCount: 0,
      postedCount: 1,
      skippedCount: 0,
    });

    expect(tx.ledgerRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "record-network-2026-07",
        name: "網路費",
        occurredOn: new Date("2026-07-15T00:00:00.000Z"),
        payerMemberId: "member-b",
        paymentSource: "member",
        reimbursementStatus: "refundable",
        type: "expense",
      }),
    });
    expect(tx.recurringOccurrence.update).toHaveBeenCalledWith({
      where: { id: "occ-network-2026-07" },
      data: {
        ledgerRecordId: "record-network-2026-07",
        postedAt: new Date("2026-07-15T01:00:00.000Z"),
        postedByMemberId: "member-admin",
        status: "posted",
      },
    });
  });
});

describe("confirmRecurringOccurrenceInDatabase", () => {
  it("confirms a pending occurrence through ordinary ledger creation rules", async () => {
    const tx = {
      category: { findMany: vi.fn(async () => categories) },
      ledgerRecord: { create: vi.fn(async () => undefined) },
      recurringOccurrence: {
        findFirst: vi.fn(async () => ({
          id: "occ-rent-2026-07",
          ledgerRecordId: null,
          month: "2026-07",
          recurringRule: createRecurringRuleRow(),
          status: "pending",
        })),
        update: vi.fn(async () => undefined),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    await expect(confirmRecurringOccurrenceInDatabase(generalMember, {
      occurrenceId: "occ-rent-2026-07",
    }, {
      generateLedgerRecordId: () => "record-rent-2026-07",
      householdId: "household-demo",
      now: () => new Date("2026-07-01T03:00:00.000Z"),
      prisma,
    })).resolves.toEqual({
      ok: true,
      occurrenceId: "occ-rent-2026-07",
      recordId: "record-rent-2026-07",
    });

    expect(tx.ledgerRecord.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "record-rent-2026-07",
        occurredOn: new Date("2026-07-01T00:00:00.000Z"),
        sourceMemberId: "member-a",
        type: "income",
      }),
    });
    expect(tx.recurringOccurrence.update).toHaveBeenCalledWith({
      where: { id: "occ-rent-2026-07" },
      data: {
        ledgerRecordId: "record-rent-2026-07",
        postedAt: new Date("2026-07-01T03:00:00.000Z"),
        postedByMemberId: "member-a",
        status: "posted",
      },
    });
  });

  it("does not duplicate an already posted occurrence", async () => {
    const tx = {
      category: { findMany: vi.fn(async () => categories) },
      ledgerRecord: { create: vi.fn(async () => undefined) },
      recurringOccurrence: {
        findFirst: vi.fn(async () => ({
          id: "occ-rent-2026-07",
          ledgerRecordId: "record-rent-2026-07",
          month: "2026-07",
          recurringRule: createRecurringRuleRow(),
          status: "posted",
        })),
        update: vi.fn(async () => undefined),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    await expect(confirmRecurringOccurrenceInDatabase(admin, {
      occurrenceId: "occ-rent-2026-07",
    }, {
      householdId: "household-demo",
      prisma,
    })).resolves.toEqual({
      ok: false,
      reason: "already_posted",
      recordId: "record-rent-2026-07",
    });
    expect(tx.ledgerRecord.create).not.toHaveBeenCalled();
  });
});
