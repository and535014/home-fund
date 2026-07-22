import { describe, expect, it, vi } from "vitest";
import {
  updateLedgerRecordInDatabase,
  voidLedgerRecordInDatabase,
} from "./ledger-record-command";
import type { AuthenticatedMember } from "../identity-access/authorization";

const actor: AuthenticatedMember = {
  id: "member-mei",
  googleAccountLinked: true,
  roles: ["general_member"],
};

describe("updateLedgerRecordInDatabase", () => {
  it("rejects an update when the record version changed after validation", async () => {
    const tx = ledgerRecordUpdateTransaction(vi.fn(async () => [
      { id: "member-mei" },
    ]));
    tx.ledgerRecord.updateMany.mockResolvedValueOnce({ count: 0 });
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    await expect(updateLedgerRecordInDatabase(actor, {
      recordId: "expense-1",
      type: "income",
      name: "競爭更新",
      amountCents: 3_500,
      occurredOn: "2026-06-10",
      categoryId: "income-rent",
      sourceMemberId: "member-mei",
    }, {
      householdId: "household-demo",
      prisma,
    })).resolves.toEqual({
      ok: false,
      reason: "record_changed",
    });
    expect(tx.ledgerRecord.updateMany).toHaveBeenCalledWith({
      where: {
        householdId: "household-demo",
        id: "expense-1",
        status: "active",
        updatedAt: new Date("2026-06-09T01:00:00.000Z"),
      },
      data: expect.objectContaining({
        type: "income",
        reimbursementStatus: "not_applicable",
      }),
    });
  });

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
    expect(tx.ledgerRecord.updateMany).toHaveBeenCalledOnce();
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
          updatedAt: new Date("2026-06-09T01:00:00.000Z"),
        })),
        updateMany: vi.fn(async () => ({ count: 1 })),
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
    expect(tx.ledgerRecord.updateMany).toHaveBeenCalledWith({
      where: {
        householdId: "household-demo",
        id: "expense-1",
        status: "active",
        updatedAt: new Date("2026-06-09T01:00:00.000Z"),
      },
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
        updateMany: vi.fn(async () => ({ count: 0 })),
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
    expect(tx.ledgerRecord.updateMany).not.toHaveBeenCalled();
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
          updatedAt: new Date("2026-06-09T01:00:00.000Z"),
        })),
        updateMany: vi.fn(async () => ({ count: 1 })),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    await expect(updateLedgerRecordInDatabase(actor, command, {
      householdId: "household-demo",
      prisma,
    })).resolves.toEqual({ ok: false, reason });
    expect(tx.ledgerRecord.updateMany).not.toHaveBeenCalled();
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
    expect(tx.ledgerRecord.updateMany).not.toHaveBeenCalled();
  });
});

describe("voidLedgerRecordInDatabase", () => {
  it("rejects a void when the record version changed after validation", async () => {
    const tx = ledgerRecordUpdateTransaction(vi.fn(async () => [
      { id: "member-mei" },
    ]));
    tx.ledgerRecord.updateMany.mockResolvedValueOnce({ count: 0 });
    const prisma = {
      $transaction: vi.fn(async (callback) => callback(tx)),
    };

    await expect(voidLedgerRecordInDatabase(actor, {
      recordId: "expense-1",
    }, { householdId: "household-demo", prisma })).resolves.toEqual({
      ok: false,
      reason: "record_changed",
    });
  });

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
          updatedAt: new Date("2026-06-09T01:00:00.000Z"),
        })),
        updateMany: vi.fn(async () => ({ count: 1 })),
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
    expect(tx.ledgerRecord.updateMany).toHaveBeenCalledWith({
      where: {
        householdId: "household-demo",
        id: "expense-1",
        status: "active",
        updatedAt: new Date("2026-06-09T01:00:00.000Z"),
      },
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
        updatedAt: new Date("2026-06-09T01:00:00.000Z"),
      })),
      updateMany: vi.fn(async () => ({ count: 1 })),
    },
  };
}
