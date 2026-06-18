import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  confirmRecurringOccurrenceInDatabase,
  type RecurringConfirmationPrismaClient,
} from "./recurring-confirmation-command";

const financeManager: AuthenticatedMember = {
  id: "member-fin",
  googleAccountLinked: true,
  roles: ["finance_manager"],
};

const generalMember: AuthenticatedMember = {
  id: "member-mei",
  googleAccountLinked: true,
  roles: ["general_member"],
};

const pendingOccurrenceRow = {
  id: "occurrence-living-kai",
  householdId: "household-demo",
  recurringRuleId: "rule-living-kai",
  month: "2026-06",
  status: "pending" as const,
  ledgerRecordId: null,
  recurringRule: {
    id: "rule-living-kai",
    type: "income" as const,
    amountCents: 8_000_000,
    categoryId: "income-living",
    sourceMemberId: "member-kai",
    paymentSource: null,
    payerMemberId: null,
    postingMode: "reminder" as const,
    dayOfMonth: 10,
    note: "Kai 每月生活費提醒",
    active: true,
  },
};

const activeCategories = [
  {
    id: "income-living",
    type: "income" as const,
    status: "active" as const,
  },
];

describe("confirmRecurringOccurrenceInDatabase", () => {
  it("creates the ledger record and marks the occurrence posted in one transaction", async () => {
    const ledgerCreate = vi.fn(async () => undefined);
    const occurrenceUpdateMany = vi.fn(async () => ({ count: 1 }));
    const prisma = createPrismaMock({
      ledgerCreate,
      occurrenceUpdateMany,
    });

    await expect(confirmRecurringOccurrenceInDatabase(financeManager, {
      occurrenceId: "occurrence-living-kai",
    }, {
      prisma,
      generateLedgerRecordId: () => "ledger-recurring-living-kai",
    })).resolves.toMatchObject({
      ok: true,
      occurrence: {
        id: "occurrence-living-kai",
        status: "posted",
        ledgerRecordId: "ledger-recurring-living-kai",
      },
      ledgerRecord: {
        id: "ledger-recurring-living-kai",
        name: "Kai 每月生活費提醒",
        amountCents: 8_000_000,
        sourceMemberId: "member-kai",
      },
    });
    expect(ledgerCreate).toHaveBeenCalledWith({
      data: {
        id: "ledger-recurring-living-kai",
        householdId: "household-demo",
        type: "income",
        name: "Kai 每月生活費提醒",
        amountCents: 8_000_000,
        occurredOn: new Date("2026-06-10T00:00:00.000Z"),
        categoryId: "income-living",
        createdByMemberId: "member-fin",
        sourceMemberId: "member-kai",
        paymentSource: null,
        payerMemberId: null,
        reimbursementStatus: "not_applicable",
        note: "Kai 每月生活費提醒",
      },
    });
    expect(occurrenceUpdateMany).toHaveBeenCalledWith({
      where: {
        id: "occurrence-living-kai",
        householdId: "household-demo",
        status: "pending",
        ledgerRecordId: null,
      },
      data: {
        status: "posted",
        ledgerRecordId: "ledger-recurring-living-kai",
      },
    });
  });

  it("rejects missing occurrences without writing", async () => {
    const ledgerCreate = vi.fn(async () => undefined);
    const occurrenceUpdateMany = vi.fn(async () => ({ count: 0 }));
    const prisma = createPrismaMock({
      occurrenceFindFirst: vi.fn(async () => null),
      ledgerCreate,
      occurrenceUpdateMany,
    });

    await expect(confirmRecurringOccurrenceInDatabase(financeManager, {
      occurrenceId: "missing-occurrence",
    }, {
      prisma,
    })).resolves.toEqual({
      ok: false,
      reason: "missing_occurrence",
    });
    expect(ledgerCreate).not.toHaveBeenCalled();
    expect(occurrenceUpdateMany).not.toHaveBeenCalled();
  });

  it("returns permission_denied before writing when ledger creation authorization fails", async () => {
    const ledgerCreate = vi.fn(async () => undefined);
    const occurrenceUpdateMany = vi.fn(async () => ({ count: 1 }));
    const prisma = createPrismaMock({
      ledgerCreate,
      occurrenceUpdateMany,
    });

    await expect(confirmRecurringOccurrenceInDatabase(generalMember, {
      occurrenceId: "occurrence-living-kai",
    }, {
      prisma,
    })).resolves.toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "cannot_create_record_for_other_member",
    });
    expect(ledgerCreate).not.toHaveBeenCalled();
    expect(occurrenceUpdateMany).not.toHaveBeenCalled();
  });

  it("rolls back the ledger write when the occurrence is stale during update", async () => {
    const ledgerCreate = vi.fn(async () => undefined);
    const occurrenceUpdateMany = vi.fn(async () => ({ count: 0 }));
    const prisma = createPrismaMock({
      ledgerCreate,
      occurrenceUpdateMany,
    });

    await expect(confirmRecurringOccurrenceInDatabase(financeManager, {
      occurrenceId: "occurrence-living-kai",
    }, {
      prisma,
      generateLedgerRecordId: () => "ledger-recurring-living-kai",
    })).resolves.toEqual({
      ok: false,
      reason: "stale_confirmation",
    });
    expect(ledgerCreate).toHaveBeenCalledTimes(1);
    expect(prisma.rejectsInternalRollback()).toBe(true);
  });
});

function createPrismaMock(overrides: {
  occurrenceFindFirst?: ReturnType<typeof vi.fn>;
  occurrenceUpdateMany?: ReturnType<typeof vi.fn>;
  ledgerCreate?: ReturnType<typeof vi.fn>;
  categoryFindMany?: ReturnType<typeof vi.fn>;
} = {}): RecurringConfirmationPrismaClient & {
  rejectsInternalRollback: () => boolean;
} {
  const tx = {
    recurringOccurrence: {
      findFirst:
        overrides.occurrenceFindFirst ?? vi.fn(async () => pendingOccurrenceRow),
      updateMany:
        overrides.occurrenceUpdateMany ?? vi.fn(async () => ({ count: 1 })),
    },
    category: {
      findMany: overrides.categoryFindMany ?? vi.fn(async () => activeCategories),
    },
    ledgerRecord: {
      create: overrides.ledgerCreate ?? vi.fn(async () => undefined),
    },
  };
  let rejectsInternalRollback = false;
  async function transaction<T>(callback: (value: typeof tx) => Promise<T>): Promise<T> {
    try {
      return await callback(tx);
    } catch (error) {
      rejectsInternalRollback = true;
      throw error;
    }
  }

  return {
    ...tx,
    $transaction: transaction,
    rejectsInternalRollback: () => rejectsInternalRollback,
  } as unknown as RecurringConfirmationPrismaClient & {
    rejectsInternalRollback: () => boolean;
  };
}
