import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAuthenticatedMember } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import {
  batchRefundSearchRecordsAction,
  loadReimbursementPaymentSearchPageAction,
} from "./record-search-actions";
import {
  loadReimbursementPaymentByLedgerRecordAction,
  loadReimbursementPaymentsByLedgerRecordIdsAction,
} from "@/app/_record-detail/reimbursement-payment-readback-actions";
import {
  editReimbursementPaymentAction,
} from "@/app/_record-detail/reimbursement-payment-edit-actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/auth/app-access", () => ({
  requireAuthenticatedMember: vi.fn(),
}));

vi.mock("@/db/prisma", () => ({
  getPrismaClient: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthenticatedMember();
});

describe("batchRefundSearchRecordsAction", () => {
  it("writes payment evidence for the reimbursed batch", async () => {
    type BatchCreateArgs = {
      data: {
        id: string;
      };
    };
    const reimbursementBatchCreate = vi.fn<(
      args: BatchCreateArgs
    ) => Promise<void>>(async () => undefined);
    const tx = {
      ledgerRecord: {
        findMany: vi.fn(async () => [
          {
            id: "expense-1",
            type: "expense" as const,
            name: "日用品代墊",
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
          },
          {
            id: "expense-2",
            type: "expense" as const,
            name: "停車費代墊",
            amountCents: 800,
            occurredOn: new Date("2026-06-10T00:00:00.000Z"),
            categoryId: "expense-transport",
            createdByMemberId: "member-mei",
            sourceMemberId: null,
            paymentSource: "member" as const,
            payerMemberId: "member-mei",
            reimbursementStatus: "refundable" as const,
            status: "active" as const,
            note: null,
          },
        ]),
        updateMany: vi.fn(async () => undefined),
      },
      reimbursementBatch: {
        create: reimbursementBatchCreate,
      },
      reimbursementPayment: {
        create: vi.fn(async () => undefined),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    vi.mocked(getPrismaClient).mockReturnValue(prisma as never);

    const result = await batchRefundSearchRecordsAction({
      recordIds: ["expense-1", "expense-2"],
      payment: {
        method: "cash",
        paidOn: "2026-06-24",
        note: "現金交付",
      },
    });

    expect(result).toMatchObject({
      ok: true,
      processedRecordIds: ["expense-1", "expense-2"],
      processedCount: 2,
      refundTotalCents: 4_000,
    });
    const batchCreateArgs = tx.reimbursementBatch.create.mock.calls[0]?.[0];
    const batchId = batchCreateArgs?.data.id;

    expect(tx.reimbursementBatch.create).toHaveBeenCalledWith({
      data: {
        id: expect.any(String),
        householdId: "household-demo",
        reimbursedById: "member-fin",
        reimbursedAt: expect.any(Date),
        items: {
          create: [
            { ledgerRecordId: "expense-1" },
            { ledgerRecordId: "expense-2" },
          ],
        },
      },
    });
    expect(tx.reimbursementPayment.create).toHaveBeenCalledWith({
      data: {
        id: expect.any(String),
        householdId: "household-demo",
        reimbursementBatchId: batchId,
        paidToMemberId: "member-mei",
        paidFromSource: "household_fund",
        method: "cash",
        amountCents: 4_000,
        paidOn: new Date("2026-06-24T00:00:00.000Z"),
        note: "現金交付",
        recordedByMemberId: "member-fin",
      },
    });
    expect(tx.ledgerRecord.updateMany).toHaveBeenCalledWith({
      where: {
        householdId: "household-demo",
        id: {
          in: ["expense-1", "expense-2"],
        },
        status: "active",
      },
      data: {
        reimbursementStatus: "reimbursed",
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/search");
  });
});

describe("loadReimbursementPaymentSearchPageAction", () => {
  it("loads reimbursement payment records with server pagination metadata", async () => {
    const prisma = {
      reimbursementPayment: {
        findMany: vi.fn(async () => [
          reimbursementPaymentRow({
            id: "payment-1",
            ledgerRecordId: "expense-1",
            ledgerRecordName: "網路費代墊",
          }),
        ]),
        count: vi.fn(async () => 1),
        aggregate: vi.fn(async () => ({
          _sum: {
            amountCents: 4_500,
          },
        })),
      },
    };

    vi.mocked(getPrismaClient).mockReturnValue(prisma as never);

    const result = await loadReimbursementPaymentSearchPageAction({
      query: {
        dateFrom: "",
        dateTo: "",
        paidToMemberId: "all",
        search: "",
        sort: "newest",
      },
    });

    expect(result).toMatchObject({
      ok: true,
      records: [
        {
          id: "payment-1",
          primaryLinkedRecordName: "網路費代墊",
          paidToMemberName: "小美",
          methodLabel: "銀行轉帳",
        },
      ],
      nextCursor: null,
      totalCount: 1,
      totalAmountCents: 4_500,
    });
  });
});

describe("loadReimbursementPaymentByLedgerRecordAction", () => {
  it("returns null when a reimbursed expense has no payment evidence", async () => {
    const prisma = {
      reimbursementPayment: {
        findFirst: vi.fn(async () => null),
      },
    };

    vi.mocked(getPrismaClient).mockReturnValue(prisma as never);

    await expect(loadReimbursementPaymentByLedgerRecordAction("legacy-expense")).resolves
      .toEqual({
        ok: true,
        record: null,
      });
    expect(prisma.reimbursementPayment.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          householdId: "household-demo",
          reimbursementBatch: expect.objectContaining({
            items: {
              some: expect.objectContaining({
                ledgerRecordId: "legacy-expense",
              }),
            },
          }),
        }),
      }),
    );
  });
});

describe("editReimbursementPaymentAction", () => {
  it("updates only editable refund evidence fields and returns readback", async () => {
    const row = reimbursementPaymentRow({
      id: "payment-1",
      ledgerRecordId: "expense-1",
      ledgerRecordName: "網路費代墊",
    });
    const tx = {
      reimbursementPayment: {
        findFirst: vi.fn()
          .mockResolvedValueOnce({ id: "payment-1" })
          .mockResolvedValueOnce({
            ...row,
            method: "cash",
            paidOn: new Date("2026-06-27T00:00:00.000Z"),
            note: "現金補登",
          }),
        update: vi.fn(async () => undefined),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    vi.mocked(getPrismaClient).mockReturnValue(prisma as never);

    const result = await editReimbursementPaymentAction({
      paymentId: "payment-1",
      method: "cash",
      paidOn: "2026-06-27",
      note: "現金補登",
    });

    expect(result).toMatchObject({
      ok: true,
      message: "退款紀錄已更新",
      record: {
        id: "payment-1",
        method: "cash",
        methodLabel: "現金",
        paidOn: "2026-06-27",
        note: "現金補登",
      },
    });
    expect(tx.reimbursementPayment.findFirst).toHaveBeenCalledWith({
      where: {
        id: "payment-1",
        householdId: "household-demo",
      },
      select: {
        id: true,
      },
    });
    expect(tx.reimbursementPayment.update).toHaveBeenCalledWith({
      where: {
        id: "payment-1",
      },
      data: {
        method: "cash",
        paidOn: new Date("2026-06-27T00:00:00.000Z"),
        note: "現金補登",
        editedAt: expect.any(Date),
        editedByMemberId: "member-fin",
      },
    });
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/search");
  });

  it("rejects general members before mutating refund evidence", async () => {
    mockAuthenticatedMember({
      id: "member-general",
      roles: ["general_member"],
    });
    const prisma = {
      $transaction: vi.fn(),
    };

    vi.mocked(getPrismaClient).mockReturnValue(prisma as never);

    await expect(
      editReimbursementPaymentAction({
        paymentId: "payment-1",
        method: "cash",
        paidOn: "2026-06-27",
      }),
    ).resolves.toEqual({
      ok: false,
      reason: "unauthorized",
      message: "目前帳號沒有編輯退款紀錄權限。",
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("returns field errors for invalid payment evidence", async () => {
    const prisma = {
      $transaction: vi.fn(),
    };

    vi.mocked(getPrismaClient).mockReturnValue(prisma as never);

    await expect(
      editReimbursementPaymentAction({
        paymentId: "payment-1",
        method: "line_pay",
        paidOn: "2026-06-27",
      }),
    ).resolves.toEqual({
      ok: false,
      reason: "invalid_payment_method",
      message: "付款方式不支援。",
      fieldErrors: {
        method: ["付款方式不支援。"],
      },
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("does not update cross-household refund evidence", async () => {
    const tx = {
      reimbursementPayment: {
        findFirst: vi.fn(async () => null),
        update: vi.fn(),
      },
    };
    const prisma = {
      $transaction: vi.fn(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx),
      ),
    };

    vi.mocked(getPrismaClient).mockReturnValue(prisma as never);

    await expect(
      editReimbursementPaymentAction({
        paymentId: "payment-other-household",
        method: "cash",
        paidOn: "2026-06-27",
      }),
    ).resolves.toEqual({
      ok: false,
      reason: "not_found",
      message: "找不到這筆退款紀錄。",
    });
    expect(tx.reimbursementPayment.update).not.toHaveBeenCalled();
  });
});

describe("loadReimbursementPaymentsByLedgerRecordIdsAction", () => {
  it("maps payment evidence back to requested ledger record ids", async () => {
    const prisma = {
      reimbursementPayment: {
        findMany: vi.fn(async () => [
          reimbursementPaymentRow({
            id: "payment-1",
            ledgerRecordId: "expense-1",
            ledgerRecordName: "網路費代墊",
          }),
        ]),
      },
    };

    vi.mocked(getPrismaClient).mockReturnValue(prisma as never);

    const result = await loadReimbursementPaymentsByLedgerRecordIdsAction([
      "expense-1",
      "expense-without-payment",
    ]);

    expect(result).toMatchObject({
      ok: true,
      recordsByLedgerRecordId: {
        "expense-1": {
          id: "payment-1",
          primaryLinkedRecordName: "網路費代墊",
        },
        "expense-without-payment": null,
      },
    });
    expect(prisma.reimbursementPayment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          householdId: "household-demo",
          reimbursementBatch: expect.objectContaining({
            items: {
              some: expect.objectContaining({
                ledgerRecordId: {
                  in: ["expense-1", "expense-without-payment"],
                },
              }),
            },
          }),
        }),
      }),
    );
  });
});

function mockAuthenticatedMember(overrides?: {
  id?: string;
  roles?: ("admin" | "finance_manager" | "general_member")[];
}) {
  vi.mocked(requireAuthenticatedMember).mockResolvedValue({
    access: {
      member: {
        id: overrides?.id ?? "member-fin",
        householdId: "household-demo",
        googleAccountLinked: true,
        roles: overrides?.roles ?? ["finance_manager"],
      },
    },
  } as Awaited<ReturnType<typeof requireAuthenticatedMember>>);
}

function reimbursementPaymentRow({
  id,
  ledgerRecordId,
  ledgerRecordName,
}: {
  id: string;
  ledgerRecordId: string;
  ledgerRecordName: string;
}) {
  return {
    id,
    reimbursementBatchId: `batch-${id}`,
    amountCents: 128_000,
    paidOn: new Date("2026-06-18T00:00:00.000Z"),
    paidToMemberId: "member-mei",
    method: "bank_transfer" as const,
    note: "末五碼 5521",
    paidToMember: {
      displayName: "小美",
    },
    reimbursementBatch: {
      items: [
        {
          ledgerRecord: {
            id: ledgerRecordId,
            type: "expense" as const,
            name: ledgerRecordName,
            amountCents: 128_000,
            occurredOn: new Date("2026-06-15T00:00:00.000Z"),
            categoryId: "expense-utilities",
            createdByMemberId: "member-mei",
            sourceMemberId: null,
            paymentSource: "member" as const,
            payerMemberId: "member-mei",
            reimbursementStatus: "reimbursed" as const,
            status: "active" as const,
            note: "退款紀錄關聯紀錄",
          },
        },
      ],
    },
  };
}
