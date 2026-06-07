import { describe, expect, it, vi } from "vitest";
import { createLedgerRecordInDatabase } from "./ledger-record-command";
import type { AuthenticatedMember } from "../identity-access/authorization";

const actor: AuthenticatedMember = {
  id: "member-mei",
  googleAccountLinked: true,
  roles: ["general_member"],
};

describe("createLedgerRecordInDatabase", () => {
  it("validates with active categories and writes an income record", async () => {
    const categoryFindMany = vi.fn(async () => [
      {
        id: "income-rent",
        type: "income" as const,
        status: "active" as const,
      },
    ]);
    const ledgerCreate = vi.fn(async () => undefined);

    await expect(createLedgerRecordInDatabase(actor, {
      type: "income",
      amountCents: 120_000,
      occurredOn: "2026-06-05",
      categoryId: "income-rent",
      sourceMemberId: "member-mei",
      note: "六月房租",
    }, {
      prisma: {
        category: { findMany: categoryFindMany },
        ledgerRecord: { create: ledgerCreate },
      },
      generateId: () => "record-1",
    })).resolves.toMatchObject({
      ok: true,
      record: {
        id: "record-1",
        type: "income",
      },
    });
    expect(ledgerCreate).toHaveBeenCalledWith({
      data: {
        id: "record-1",
        householdId: "household-demo",
        type: "income",
        amountCents: 120_000,
        occurredOn: new Date("2026-06-05T00:00:00.000Z"),
        categoryId: "income-rent",
        createdByMemberId: "member-mei",
        sourceMemberId: "member-mei",
        paymentSource: null,
        payerMemberId: null,
        reimbursementStatus: "not_applicable",
        note: "六月房租",
      },
    });
  });

  it("does not write when domain validation fails", async () => {
    const ledgerCreate = vi.fn(async () => undefined);

    await expect(createLedgerRecordInDatabase(actor, {
      type: "expense",
      amountCents: 1_000,
      occurredOn: "2026-06-09",
      categoryId: "income-rent",
      paymentSource: "fund",
    }, {
      prisma: {
        category: {
          findMany: async () => [
            {
              id: "income-rent",
              type: "income" as const,
              status: "active" as const,
            },
          ],
        },
        ledgerRecord: { create: ledgerCreate },
      },
    })).resolves.toEqual({
      ok: false,
      reason: "category_type_mismatch",
    });
    expect(ledgerCreate).not.toHaveBeenCalled();
  });
});
