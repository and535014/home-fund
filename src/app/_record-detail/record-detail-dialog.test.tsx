// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { actionSuccess } from "@/app/action-state";
import { updateLedgerRecordAction } from "@/app/ledger-record-actions";
import { confirmRecurringOccurrenceAction } from "@/app/recurring-event-actions";
import { Dialog } from "@/components/ui/dialog";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import { toast } from "sonner";
import { RecordDetailDialog } from "./record-detail-dialog";

vi.mock("@/app/ledger-record-actions", () => ({
  reimburseLedgerRecordAction: vi.fn(),
  updateLedgerRecordAction: vi.fn(),
  voidLedgerRecordAction: vi.fn(),
}));

vi.mock("@/app/recurring-event-actions", () => ({
  confirmRecurringOccurrenceAction: vi.fn(async () =>
    actionSuccess("週期事件已入帳。", {
      occurrenceId: "occurrence-rent-2026-07",
      recordId: "record-rent-2026-07",
    }),
  ),
}));

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RecordDetailDialog", () => {
  it("clears category and member fields when crossing income and expense", () => {
    renderEditableRecord(incomeRecord);
    fireEvent.click(screen.getByRole("button", { name: "編輯" }));

    expect(screen.getByRole("tab", { name: "收入" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("radio", { name: "房租" })).toBeChecked();

    selectEntryKind("成員支出");
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
    expect(screen.getByLabelText("支付者")).toHaveValue("");

    selectEntryKind("收入");
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
    expect(screen.getByLabelText("支付者")).toHaveValue("");
  });

  it("keeps an expense category but clears the payer when payment source changes", () => {
    renderEditableRecord(memberPaidExpenseRecord);
    fireEvent.click(screen.getByRole("button", { name: "編輯" }));
    expect(screen.getByRole("radio", { name: "日用品" })).toBeChecked();

    selectEntryKind("基金支出");
    expect(screen.getByRole("radio", { name: "日用品" })).toBeChecked();
    selectEntryKind("成員支出");
    expect(screen.getByRole("radio", { name: "日用品" })).toBeChecked();
    expect(screen.getByLabelText("支付者")).toHaveValue("");
  });

  it("keeps the switched form state after the server rejects submission", async () => {
    vi.mocked(updateLedgerRecordAction).mockResolvedValueOnce({
      status: "error",
      message: "分類類型與紀錄類型不一致。",
      code: "category_type_mismatch",
      fieldErrors: { categoryId: ["分類類型與紀錄類型不一致。"] },
    });
    renderEditableRecord(incomeRecord);
    fireEvent.click(screen.getByRole("button", { name: "編輯" }));
    selectEntryKind("成員支出");
    fireEvent.click(screen.getByRole("radio", { name: "日用品" }));
    fireEvent.change(screen.getByLabelText("支付者"), {
      target: { value: "member-b" },
    });
    const editForm = screen
      .getByRole("region", { name: "編輯紀錄表單" })
      .querySelector("form")!;
    fireEvent.change(editForm.elements.namedItem("name") as HTMLInputElement, {
      target: { value: "錯誤後仍保留" },
    });
    fireEvent.change(
      editForm.elements.namedItem("amountTwd") as HTMLInputElement,
      {
        target: { value: "4321" },
      },
    );
    fireEvent.change(
      editForm.elements.namedItem("occurredOn") as HTMLInputElement,
      {
        target: { value: "2026-06-22" },
      },
    );
    fireEvent.change(editForm.elements.namedItem("note") as HTMLInputElement, {
      target: { value: "不要被 reset" },
    });
    fireEvent.submit(editForm);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "分類類型與紀錄類型不一致。",
    );
    expect(screen.getByRole("tab", { name: "成員支出" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("radio", { name: "日用品" })).toBeChecked();
    expect(screen.getByLabelText("支付者")).toHaveValue("member-b");
    expect(editForm.elements.namedItem("name") as HTMLInputElement).toHaveValue(
      "錯誤後仍保留",
    );
    expect(
      editForm.elements.namedItem("amountTwd") as HTMLInputElement,
    ).toHaveValue(4321);
    expect(
      editForm.elements.namedItem("occurredOn") as HTMLInputElement,
    ).toHaveValue("2026-06-22");
    expect(editForm.elements.namedItem("note") as HTMLInputElement).toHaveValue(
      "不要被 reset",
    );
  });

  it("confirms a persisted pending recurring occurrence", async () => {
    const onConfirmRecurringPosting = vi.fn();

    render(
      <Dialog open>
        <RecordDetailDialog
          actor={{
            avatarUrl: undefined,
            capabilities: [],
            displayName: "成員 A",
            householdId: "household-demo",
            id: "member-a",
            roles: ["admin"],
          }}
          categories={[]}
          categoryName="房租收入"
          memberNames={{ "member-a": "成員 A" }}
          onConfirmRecurringPosting={onConfirmRecurringPosting}
          onMutationSuccess={vi.fn()}
          onPendingChange={vi.fn()}
          onRefresh={vi.fn()}
          record={{
            amountCents: 1_800_000,
            categoryId: "income-rent",
            createdByMemberId: "member-a",
            id: "recurring-occurrence:occurrence-rent-2026-07",
            name: "成員 A 房租收入",
            occurredOn: "2026-07-01",
            reimbursementStatus: "not_applicable",
            sourceMemberId: "member-a",
            status: "active",
            type: "income",
          }}
          recurringEventLabel="每月 1 號，提醒入帳"
          recurringOccurrenceId="occurrence-rent-2026-07"
          recurringPostingPending
        />
      </Dialog>,
    );

    expect(screen.getByText("週期事件：「每月 1 號，提醒入帳」")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "確認入帳" }));

    await waitFor(() => {
      expect(confirmRecurringOccurrenceAction).toHaveBeenCalled();
    });
    expect(confirmRecurringOccurrenceFormValue("occurrenceId")).toBe(
      "occurrence-rent-2026-07",
    );
    expect(toast.success).toHaveBeenCalledWith("週期事件已入帳。");
    expect(onConfirmRecurringPosting).toHaveBeenCalled();
  });
});

function renderEditableRecord(record: LedgerRecord) {
  return render(
    <Dialog open>
      <RecordDetailDialog
        actor={{
          avatarUrl: undefined,
          capabilities: [],
          displayName: "成員 A",
          householdId: "household-demo",
          id: "member-a",
          roles: ["admin"],
        }}
        categories={categories}
        categoryName={record.type === "income" ? "房租" : "日用品"}
        memberNames={{ "member-a": "成員 A", "member-b": "成員 B" }}
        onMutationSuccess={vi.fn()}
        onPendingChange={vi.fn()}
        onRefresh={vi.fn()}
        record={record}
      />
    </Dialog>,
  );
}

function selectEntryKind(name: "成員支出" | "收入" | "基金支出") {
  fireEvent.mouseDown(screen.getByRole("tab", { name }), {
    button: 0,
    ctrlKey: false,
  });
}

const categories: Category[] = [
  {
    color: "gold",
    icon: "home",
    id: "income-rent",
    name: "房租",
    sortOrder: 1,
    status: "active",
    type: "income",
  },
  {
    color: "blue",
    icon: "shopping-cart",
    id: "expense-household",
    name: "日用品",
    sortOrder: 1,
    status: "active",
    type: "expense",
  },
];

const incomeRecord: LedgerRecord = {
  amountCents: 180_000,
  categoryId: "income-rent",
  createdByMemberId: "member-a",
  id: "income-record",
  name: "房租收入",
  note: "原始備註",
  occurredOn: "2026-06-01",
  reimbursementStatus: "not_applicable",
  sourceMemberId: "member-a",
  status: "active",
  type: "income",
};

const memberPaidExpenseRecord: LedgerRecord = {
  amountCents: 12_000,
  categoryId: "expense-household",
  createdByMemberId: "member-a",
  id: "expense-record",
  name: "採買日用品",
  occurredOn: "2026-06-02",
  payerMemberId: "member-a",
  paymentSource: "member",
  reimbursementStatus: "refundable",
  status: "active",
  type: "expense",
};

function confirmRecurringOccurrenceFormValue(name: string) {
  const formData = vi.mocked(confirmRecurringOccurrenceAction).mock.calls[0]?.[1];

  if (!(formData instanceof FormData)) {
    throw new Error("confirmRecurringOccurrenceAction was not called with FormData.");
  }

  return formData.get(name);
}
