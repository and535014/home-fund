import { beforeEach, describe, expect, it, vi } from "vitest";
import { initialActionState } from "./action-state";
import {
  createLedgerRecordAction,
  updateLedgerRecordAction,
} from "./ledger-record-actions";
import { requireMutationAccess } from "./server-action-adapter";
import { updateLedgerRecordInDatabase } from "@/modules/fund-ledger/ledger-record-command";
import { createManualRecord } from "@/modules/fund-ledger/ledger-record-creation";

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
  updateLedgerRecordInDatabase: vi.fn(),
  voidLedgerRecordInDatabase: vi.fn(),
}));

vi.mock("@/modules/fund-ledger/ledger-record-creation", () => ({
  createManualRecord: vi.fn(),
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
  vi.mocked(createManualRecord).mockReset();
});

describe("createLedgerRecordAction", () => {
  it("passes the existing scoped session member to createManualRecord", async () => {
    vi.mocked(createManualRecord).mockResolvedValueOnce({
      ok: true,
      recordId: "record-1",
    });

    await createLedgerRecordAction(initialActionState(), validFundExpenseForm());

    expect(createManualRecord).toHaveBeenCalledWith(
      { kind: "member", member },
      expect.objectContaining({
        type: "expense",
        paymentSource: "fund",
      }),
    );
  });

  it("maps a known creation rejection to its field error", async () => {
    vi.mocked(createManualRecord).mockResolvedValueOnce({
      ok: false,
      reason: "disabled_member",
    });

    const result = await createLedgerRecordAction(
      initialActionState(),
      validMemberExpenseForm(),
    );

    expect(result).toMatchObject({
      status: "error",
      code: "disabled_member",
      fieldErrors: { payerMemberId: ["這位成員目前無法作為財務歸屬。"] },
    });
  });

  it("does not retry createManualRecord when its outcome is unknown", async () => {
    vi.mocked(createManualRecord).mockRejectedValueOnce(new Error("network"));

    const result = await createLedgerRecordAction(
      initialActionState(),
      validFundExpenseForm(),
    );

    expect(createManualRecord).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      status: "error",
      code: "unavailable",
    });
  });
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
    [
      "record_changed",
      "這筆紀錄剛被其他操作更新，請重新載入後再試。",
      "recordId",
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

function validMemberExpenseForm(): FormData {
  const formData = validFundExpenseForm();
  formData.set("paymentSource", "member");
  formData.set("payerMemberId", "member-mei");
  return formData;
}

function validFundExpenseForm(): FormData {
  const formData = new FormData();
  formData.set("recordType", "expense");
  formData.set("name", "新增支出");
  formData.set("amountTwd", "350");
  formData.set("occurredOn", "2026-07-17");
  formData.set("categoryId", "expense-grocery");
  formData.set("paymentSource", "fund");
  return formData;
}
