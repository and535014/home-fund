import { revalidatePath } from "next/cache";
import { describe, expect, it, vi } from "vitest";
import { requireAuthenticatedMember } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import { batchRefundSearchRecordsAction } from "./record-search-actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/auth/app-access", () => ({
  requireAuthenticatedMember: vi.fn(),
}));

vi.mock("@/db/prisma", () => ({
  getPrismaClient: vi.fn(),
}));

describe("batchRefundSearchRecordsAction", () => {
  it("writes payment evidence for the reimbursed batch", async () => {
    vi.mocked(requireAuthenticatedMember).mockResolvedValue({
      access: {
        member: {
          id: "member-fin",
          googleAccountLinked: true,
          roles: ["finance_manager"],
        },
      },
    } as Awaited<ReturnType<typeof requireAuthenticatedMember>>);

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
