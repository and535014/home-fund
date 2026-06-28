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
import { confirmRecurringOccurrenceAction } from "@/app/recurring-event-actions";
import { Dialog } from "@/components/ui/dialog";
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

function confirmRecurringOccurrenceFormValue(name: string) {
  const formData = vi.mocked(confirmRecurringOccurrenceAction).mock.calls[0]?.[1];

  if (!(formData instanceof FormData)) {
    throw new Error("confirmRecurringOccurrenceAction was not called with FormData.");
  }

  return formData.get(name);
}
