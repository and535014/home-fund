import { describe, expect, it, vi } from "vitest";
import {
  createLedgerRecordInDatabase,
  updateLedgerRecordInDatabase,
  voidLedgerRecordInDatabase,
} from "./ledger-record-command";
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
      name: "六月房租",
      amountCents: 120_000,
      occurredOn: "2026-06-05",
      categoryId: "income-rent",
      sourceMemberId: "member-mei",
      note: "六月房租",
    }, {
      householdId: "household-demo",
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
        name: "六月房租",
        amountCents: 120_000,
        occurredOn: new Date("2026-06-05T00:00:00.000Z"),
        categoryId: "income-rent",
        createdByMemberId: "member-mei",
        sourceMemberId: "member-mei",
        paymentSource: null,
        payerMemberId: null,
        reimbursementStatus: "not_applicable",
        status: "active",
        note: "六月房租",
      },
    });
  });

  it("does not write when domain validation fails", async () => {
    const ledgerCreate = vi.fn(async () => undefined);

    await expect(createLedgerRecordInDatabase(actor, {
      type: "expense",
      name: "分類錯誤",
      amountCents: 1_000,
      occurredOn: "2026-06-09",
      categoryId: "income-rent",
      paymentSource: "fund",
    }, {
      householdId: "household-demo",
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

describe("updateLedgerRecordInDatabase", () => {
  it.each([
    [
      "income source",
      {
        recordId: "expense-1",
        type: "income" as const,
        name: "邀請中成員收入",
        amountCents: 3_500,
        occurredOn: "2026-06-10",
        categoryId: "income-rent",
        sourceMemberId: "member-invited",
      },
    ],
    [
      "member-paid expense payer",
      {
        recordId: "expense-1",
        type: "expense" as const,
        name: "邀請中成員代墊",
        amountCents: 3_500,
        occurredOn: "2026-06-10",
        categoryId: "expense-grocery",
        paymentSource: "member" as const,
        payerMemberId: "member-invited",
      },
    ],
  ] as const)("allows an invited household member as the %s", async (
    _attribution,
    command,
  ) => {
    const memberFindMany = vi.fn(async ({
      where,
    }: {
      where: {
        householdId: string;
        status: "active" | { in: Array<"active" | "invited"> };
      };
    }) => {
      const statuses = typeof where.status === "string"
        ? [where.status]
        : where.status.in;

      return [
        { id: "member-mei" },
        ...(statuses.includes("invited")
          ? [{ id: "member-invited" }]
          : []),
      ];
    });
    const tx = ledgerRecordUpdateTransaction(memberFindMany);
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    await expect(updateLedgerRecordInDatabase(actor, command, {
      householdId: "household-demo",
      prisma,
    })).resolves.toMatchObject({ ok: true });
    expect(memberFindMany).toHaveBeenCalledWith({
      where: {
        householdId: "household-demo",
        status: { in: ["active", "invited"] },
      },
      select: { id: true },
    });
    expect(tx.ledgerRecord.update).toHaveBeenCalledOnce();
  });

  it("converts an active expense to income inside one transaction", async () => {
    const tx = {
      category: {
        findMany: vi.fn(async () => [
          { id: "expense-grocery", type: "expense" as const, status: "active" as const },
          { id: "expense-internet", type: "expense" as const, status: "active" as const },
          { id: "income-rent", type: "income" as const, status: "active" as const },
        ]),
      },
      member: {
        findMany: vi.fn(async () => [
          { id: "member-mei" },
          { id: "member-kai" },
        ]),
      },
      ledgerRecord: {
        findFirst: vi.fn(async () => ({
          id: "expense-1",
          householdId: "household-demo",
          type: "expense" as const,
          name: "日用品",
          amountCents: 3_200,
          occurredOn: new Date("2026-06-09T00:00:00.000Z"),
          categoryId: "expense-grocery",
          createdByMemberId: "member-mei",
          sourceMemberId: null,
          paymentSource: "member" as const,
          payerMemberId: "member-mei",
          reimbursementStatus: "refundable" as const,
          status: "active" as const,
          note: null,
        })),
        update: vi.fn(async () => undefined),
      },
      recurringOccurrence: {
        update: vi.fn(async () => undefined),
      },
      ledgerImportRow: {
        update: vi.fn(async () => undefined),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    await expect(updateLedgerRecordInDatabase(actor, {
      recordId: "expense-1",
      type: "income",
      name: "支出誤記改收入",
      amountCents: 3_500,
      occurredOn: "2026-06-10",
      categoryId: "income-rent",
      sourceMemberId: "member-mei",
      note: "補正",
    }, { householdId: "household-demo", prisma })).resolves.toMatchObject({
      ok: true,
      record: {
        id: "expense-1",
        type: "income",
        reimbursementStatus: "not_applicable",
      },
    });
    expect(prisma.$transaction).toHaveBeenCalledOnce();
    expect(tx.member.findMany).toHaveBeenCalledWith({
      where: {
        householdId: "household-demo",
        status: { in: ["active", "invited"] },
      },
      select: { id: true },
    });
    expect(tx.ledgerRecord.update).toHaveBeenCalledWith({
      where: { id: "expense-1" },
      data: {
        type: "income",
        name: "支出誤記改收入",
        amountCents: 3_500,
        occurredOn: new Date("2026-06-10T00:00:00.000Z"),
        categoryId: "income-rent",
        sourceMemberId: "member-mei",
        paymentSource: null,
        payerMemberId: null,
        reimbursementStatus: "not_applicable",
        note: "補正",
        status: "active",
      },
    });
    expect(tx.recurringOccurrence.update).not.toHaveBeenCalled();
    expect(tx.ledgerImportRow.update).not.toHaveBeenCalled();
  });

  it("does not update missing active records", async () => {
    const tx = {
      category: { findMany: vi.fn(async () => []) },
      member: { findMany: vi.fn(async () => [{ id: "member-mei" }]) },
      ledgerRecord: {
        findFirst: vi.fn(async () => null),
        update: vi.fn(async () => undefined),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    await expect(updateLedgerRecordInDatabase(actor, {
      recordId: "missing",
      type: "expense",
      name: "不存在的紀錄",
      amountCents: 3_500,
      occurredOn: "2026-06-10",
      categoryId: "expense-grocery",
      paymentSource: "fund",
    }, { householdId: "household-demo", prisma })).resolves.toEqual({
      ok: false,
      reason: "record_not_found",
    });
    expect(tx.ledgerRecord.update).not.toHaveBeenCalled();
  });

  it.each([
    [
      "income_source_outside_household",
      {
        recordId: "expense-1",
        type: "income" as const,
        name: "跨家庭收入",
        amountCents: 3_500,
        occurredOn: "2026-06-10",
        categoryId: "income-rent",
        sourceMemberId: "member-other-household",
      },
    ],
    [
      "expense_payer_outside_household",
      {
        recordId: "expense-1",
        type: "expense" as const,
        name: "跨家庭代墊",
        amountCents: 3_500,
        occurredOn: "2026-06-10",
        categoryId: "expense-grocery",
        paymentSource: "member" as const,
        payerMemberId: "member-other-household",
      },
    ],
  ] as const)("rejects an update with %s", async (reason, command) => {
    const tx = {
      category: {
        findMany: vi.fn(async () => [
          { id: "expense-grocery", type: "expense" as const, status: "active" as const },
          { id: "income-rent", type: "income" as const, status: "active" as const },
        ]),
      },
      member: { findMany: vi.fn(async () => [{ id: "member-mei" }]) },
      ledgerRecord: {
        findFirst: vi.fn(async () => ({
          id: "expense-1",
          householdId: "household-demo",
          type: "expense" as const,
          name: "日用品",
          amountCents: 3_200,
          occurredOn: new Date("2026-06-09T00:00:00.000Z"),
          categoryId: "expense-grocery",
          createdByMemberId: "member-mei",
          sourceMemberId: null,
          paymentSource: "member" as const,
          payerMemberId: "member-mei",
          reimbursementStatus: "refundable" as const,
          status: "active" as const,
          note: null,
        })),
        update: vi.fn(async () => undefined),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    await expect(updateLedgerRecordInDatabase(actor, command, {
      householdId: "household-demo",
      prisma,
    })).resolves.toEqual({ ok: false, reason });
    expect(tx.ledgerRecord.update).not.toHaveBeenCalled();
  });

  it("rejects a disabled household member as update attribution", async () => {
    const tx = ledgerRecordUpdateTransaction(vi.fn(async () => [
      { id: "member-mei" },
      { id: "member-invited" },
    ]));
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    await expect(updateLedgerRecordInDatabase(actor, {
      recordId: "expense-1",
      type: "income",
      name: "停用成員收入",
      amountCents: 3_500,
      occurredOn: "2026-06-10",
      categoryId: "income-rent",
      sourceMemberId: "member-disabled",
    }, {
      householdId: "household-demo",
      prisma,
    })).resolves.toEqual({
      ok: false,
      reason: "income_source_outside_household",
    });
    expect(tx.ledgerRecord.update).not.toHaveBeenCalled();
  });
});

describe("voidLedgerRecordInDatabase", () => {
  it("marks an active record voided without deleting it", async () => {
    const tx = {
      category: { findMany: vi.fn(async () => []) },
      member: { findMany: vi.fn(async () => [{ id: "member-mei" }]) },
      ledgerRecord: {
        findFirst: vi.fn(async () => ({
          id: "expense-1",
          householdId: "household-demo",
          type: "expense" as const,
          name: "日用品",
          amountCents: 3_200,
          occurredOn: new Date("2026-06-09T00:00:00.000Z"),
          categoryId: "expense-grocery",
          createdByMemberId: "member-mei",
          sourceMemberId: null,
          paymentSource: "member" as const,
          payerMemberId: "member-mei",
          reimbursementStatus: "refundable" as const,
          status: "active" as const,
          note: null,
        })),
        update: vi.fn(async () => undefined),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    await expect(voidLedgerRecordInDatabase(actor, {
      recordId: "expense-1",
    }, { householdId: "household-demo", prisma })).resolves.toMatchObject({
      ok: true,
      record: {
        id: "expense-1",
        status: "voided",
      },
      events: ["Ledger record voided"],
    });
    expect(tx.ledgerRecord.update).toHaveBeenCalledWith({
      where: { id: "expense-1" },
      data: { status: "voided" },
    });
  });
});

function ledgerRecordUpdateTransaction(
  memberFindMany: ReturnType<typeof vi.fn>,
) {
  return {
    category: {
      findMany: vi.fn(async () => [
        {
          id: "expense-grocery",
          type: "expense" as const,
          status: "active" as const,
        },
        {
          id: "income-rent",
          type: "income" as const,
          status: "active" as const,
        },
      ]),
    },
    member: { findMany: memberFindMany },
    ledgerRecord: {
      findFirst: vi.fn(async () => ({
        id: "expense-1",
        householdId: "household-demo",
        type: "expense" as const,
        name: "日用品",
        amountCents: 3_200,
        occurredOn: new Date("2026-06-09T00:00:00.000Z"),
        categoryId: "expense-grocery",
        createdByMemberId: "member-mei",
        sourceMemberId: null,
        paymentSource: "member" as const,
        payerMemberId: "member-mei",
        reimbursementStatus: "refundable" as const,
        status: "active" as const,
        note: null,
      })),
      update: vi.fn(async () => undefined),
    },
  };
}
