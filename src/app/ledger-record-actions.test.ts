import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialActionState } from "./action-state";
import { updateLedgerRecordAction } from "./ledger-record-actions";
import { requireMutationAccess } from "./server-action-adapter";
import { updateLedgerRecordInDatabase } from "@/modules/fund-ledger/ledger-record-command";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("./server-action-adapter", () => ({
  actionSuccessWithRevalidation: vi.fn((message, data, paths) => ({
    data,
    message,
    ok: true,
    revalidated: paths,
    status: "success",
  })),
  requireMutationAccess: vi.fn(),
}));

vi.mock("@/db/prisma", () => ({
  getPrismaClient: vi.fn(() => ({ prisma: true })),
}));

vi.mock("@/modules/fund-ledger/ledger-record-command", () => ({
  createLedgerRecordInDatabase: vi.fn(),
  updateLedgerRecordInDatabase: vi.fn(),
  voidLedgerRecordInDatabase: vi.fn(),
}));

vi.mock("@/modules/reimbursement/reimbursement-command", () => ({
  markExpensesReimbursedInDatabase: vi.fn(),
}));

const member = {
  id: "member-mei",
  googleAccountLinked: true,
  householdId: "household-demo",
  roles: ["general_member" as const],
};

beforeEach(() => {
  vi.mocked(requireMutationAccess).mockResolvedValue({
    access: {
      events: ["Household member access resolved"],
      member,
      ok: true,
      profile: {
        capabilities: [],
        displayName: "小美",
        householdId: "household-demo",
        id: "member-mei",
        roles: ["general_member"],
      },
    },
    accessHints: {} as never,
    profile: {
      capabilities: [],
      displayName: "小美",
      householdId: "household-demo",
      id: "member-mei",
      roles: ["general_member"],
    },
  });
  vi.mocked(updateLedgerRecordInDatabase).mockReset();
});

describe("updateLedgerRecordAction", () => {
  it.each([
    [
      "income_source_outside_household",
      "收入來源不屬於目前家庭。",
      "sourceMemberId",
    ],
    [
      "expense_payer_outside_household",
      "代墊成員不屬於目前家庭。",
      "payerMemberId",
    ],
  ] as const)("maps %s to the target member field", async (code, message, field) => {
    vi.mocked(updateLedgerRecordInDatabase).mockResolvedValueOnce({
      ok: false,
      reason: code,
    });

    const formData = validMemberExpenseUpdateForm();
    const result = await updateLedgerRecordAction(initialActionState(), formData);

    expect(result).toMatchObject({
      status: "error",
      code,
      message,
      fieldErrors: { [field]: [message] },
    });
  });
});

function validMemberExpenseUpdateForm(): FormData {
  const formData = new FormData();
  formData.set("recordId", "expense-1");
  formData.set("recordType", "expense");
  formData.set("name", "修正後紀錄");
  formData.set("amountTwd", "350");
  formData.set("occurredOn", "2026-06-10");
  formData.set("categoryId", "expense-grocery");
  formData.set("paymentSource", "member");
  formData.set("payerMemberId", "member-mei");
  return formData;
}
