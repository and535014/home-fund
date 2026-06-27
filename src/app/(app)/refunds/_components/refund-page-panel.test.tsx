// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { RefundPageData } from "@/modules/reimbursement/refund-page/refund-page-query";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    refresh: vi.fn(),
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

vi.mock("@/app/_record-detail/record-detail-flow", () => ({
  RecordDetailFlowDialogs: () => null,
  useRecordDetailFlow: () => ({
    openPaymentResult: vi.fn(),
    openRecord: vi.fn(),
  }),
}));

afterEach(() => {
  cleanup();
});

describe("RefundPagePanel", () => {
  it("filters unpaid expenses, refund records, and summaries by member tab", async () => {
    await renderRefundPagePanel();

    expect(screen.getByText("未退款 2 筆")).toBeVisible();
    expect(screen.getByText("$8,300")).toBeVisible();
    expect(screen.getByText("已退款 2 筆")).toBeVisible();
    expect(screen.getByText("$1,600")).toBeVisible();

    selectTab("Mei");

    await waitFor(() => {
      expect(screen.getByText("未退款 1 筆")).toBeVisible();
    });
    expect(screen.getByText("$6,420", { selector: ".text-label" }))
      .toBeVisible();
    expect(screen.getByText("已退款 1 筆")).toBeVisible();
    expect(screen.getByText("$1,280", { selector: ".text-label" }))
      .toBeVisible();
    expect(screen.getByRole("button", { name: "查看日用品代墊詳情" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "查看補充用品代墊詳情" })).toBeNull();
    expect(screen.getByRole("button", {
      name: "查看付給 Mei 退款紀錄詳情",
    })).toBeVisible();
    expect(screen.queryByRole("button", {
      name: "查看付給 Kai 退款紀錄詳情",
    })).toBeNull();
  });

  it("switches unpaid summary to selected count and total in selection mode", async () => {
    await renderRefundPagePanel();

    const unpaidSection = screen.getByRole("region", {
      name: "未退款支出紀錄",
    });

    fireEvent.click(within(unpaidSection).getByRole("button", { name: "選取" }));

    expect(screen.getByText("已選取 0 筆")).toBeVisible();
    expect(screen.getByText("$0")).toBeVisible();
    expect(within(unpaidSection).getByRole("button", { name: "批次退款" }))
      .toBeDisabled();

    fireEvent.click(
      within(unpaidSection).getByRole("button", { name: "選取日用品代墊" }),
    );

    expect(screen.getByText("已選取 1 筆")).toBeVisible();
    expect(
      within(unpaidSection).getByText("$6,420", {
        selector: ".text-label",
      }),
    ).toBeVisible();
    expect(within(unpaidSection).getByRole("button", { name: "批次退款" }))
      .toBeEnabled();

    fireEvent.click(
      within(unpaidSection).getByRole("button", { name: "取消選取" }),
    );

    expect(screen.getByText("未退款 2 筆")).toBeVisible();
    expect(screen.queryByText("已選取 1 筆")).toBeNull();
  });
});

function selectTab(name: string) {
  const tab = screen.getByRole("tab", { name });

  fireEvent.pointerDown(tab, { button: 0, ctrlKey: false });
  fireEvent.click(tab);
}

async function renderRefundPagePanel() {
  const { RefundPagePanel } = await import("./refund-page-panel");

  return render(
    <RefundPagePanel
      actor={{
        capabilities: [],
        displayName: "Finance",
        householdId: "household-demo",
        id: "member-fin",
        roles: ["finance_manager"],
      }}
      canEditReimbursementPayments
      data={refundPageData}
      onBatchRefund={vi.fn()}
    />,
  );
}

const refundPageData: RefundPageData = {
  month: "2026-06",
  memberId: "all",
  members: [
    { id: "all", name: "全部" },
    { id: "member-mei", name: "Mei" },
    { id: "member-kai", name: "Kai" },
  ],
  categories: [
    {
      id: "expense-grocery",
      type: "expense",
      name: "日用品",
      color: "gold",
      icon: "shopping-cart",
      sortOrder: 1,
      status: "active",
    },
    {
      id: "expense-internet",
      type: "expense",
      name: "網路費",
      color: "violet",
      icon: "wifi",
      sortOrder: 2,
      status: "active",
    },
  ],
  unpaidExpenses: [
    {
      id: "expense-grocery-june",
      type: "expense",
      name: "日用品代墊",
      amountCents: 642_000,
      occurredOn: "2026-06-09",
      categoryId: "expense-grocery",
      createdByMemberId: "member-mei",
      paymentSource: "member",
      payerMemberId: "member-mei",
      reimbursementStatus: "refundable",
      status: "active",
    },
    {
      id: "expense-supplies-june",
      type: "expense",
      name: "補充用品代墊",
      amountCents: 188_000,
      occurredOn: "2026-06-13",
      categoryId: "expense-grocery",
      createdByMemberId: "member-kai",
      paymentSource: "member",
      payerMemberId: "member-kai",
      reimbursementStatus: "refundable",
      status: "active",
    },
  ],
  refundRecords: [
    {
      id: "payment-mei",
      reimbursementBatchId: "batch-mei",
      amountCents: 128_000,
      paidOn: "2026-06-18",
      paidToMemberId: "member-mei",
      paidToMemberName: "Mei",
      method: "bank_transfer",
      methodLabel: "銀行轉帳",
      note: "末五碼 5521",
      linkedRecordNames: ["已退款網路費"],
      primaryLinkedRecordName: "已退款網路費",
      linkedRecords: [
        {
          id: "expense-reimbursed-internet",
          type: "expense",
          name: "已退款網路費",
          amountCents: 128_000,
          occurredOn: "2026-05-15",
          categoryId: "expense-internet",
          createdByMemberId: "member-mei",
          paymentSource: "member",
          payerMemberId: "member-mei",
          reimbursementStatus: "reimbursed",
          status: "active",
        },
      ],
    },
    {
      id: "payment-kai",
      reimbursementBatchId: "batch-kai",
      amountCents: 32_000,
      paidOn: "2026-06-20",
      paidToMemberId: "member-kai",
      paidToMemberName: "Kai",
      method: "cash",
      methodLabel: "現金",
      note: "停車費現金退款",
      linkedRecordNames: ["已退款停車費"],
      primaryLinkedRecordName: "已退款停車費",
      linkedRecords: [],
    },
  ],
};
