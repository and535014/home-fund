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
import { actionSuccess } from "./action-state";
import { RecordCreateContext, type RecordCreateContextValue } from "./record-create-context";
import { createLedgerRecordAction } from "./ledger-record-actions";
import { createRecurringEventAction } from "./recurring-event-actions";

vi.mock("./ledger-record-actions", () => ({
  createLedgerRecordAction: vi.fn(async () =>
    actionSuccess("紀錄已新增。", { recordId: "record-1" }),
  ),
}));

vi.mock("./recurring-event-actions", () => ({
  createRecurringEventAction: vi.fn(async () =>
    actionSuccess("週期事件已新增。", { recurringEventId: "event-1" }),
  ),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("RecordEntryPanel", () => {
  it("uses the ledger action for non-recurring records", async () => {
    await renderRecordEntryPanel();

    fillExpenseForm();
    fireEvent.submit(getRecordEntryForm());

    await waitFor(() => {
      expect(createLedgerRecordAction).toHaveBeenCalled();
    });
    expect(createRecurringEventAction).not.toHaveBeenCalled();
  });

  it("uses the recurring event action when recurrence is selected", async () => {
    await renderRecordEntryPanel();

    fillExpenseForm();
    fireEvent.change(screen.getByLabelText("重複"), {
      target: { value: "fixed_day" },
    });
    fireEvent.change(screen.getByLabelText("指定日期"), {
      target: { value: "15" },
    });
    expect(screen.getByLabelText("入帳模式")).toHaveValue("immediate");
    fireEvent.submit(getRecordEntryForm());

    await waitFor(() => {
      expect(createRecurringEventAction).toHaveBeenCalled();
    });
    expect(createLedgerRecordAction).not.toHaveBeenCalled();
  });
});

function fillExpenseForm() {
  fireEvent.click(screen.getByText("網路費"));
  fireEvent.change(screen.getByPlaceholderText("例如 1200"), {
    target: { value: "1299" },
  });
  fireEvent.change(screen.getByPlaceholderText("例如 晚餐食材"), {
    target: { value: "網路費" },
  });
  fireEvent.change(screen.getByLabelText("支付者"), {
    target: { value: "member-b" },
  });
}

function getRecordEntryForm(): HTMLFormElement {
  const region = screen.getByRole("region", { name: "新增紀錄表單" });
  const form = region.querySelector("form");

  if (!(form instanceof HTMLFormElement)) {
    throw new Error("Record entry form was not rendered.");
  }

  return form;
}

async function renderRecordEntryPanel() {
  const { RecordEntryPanel } = await import("./record-entry-panel");

  return render(
    <RecordCreateContext.Provider value={recordCreateContext}>
      <RecordEntryPanel />
    </RecordCreateContext.Provider>,
  );
}

const recordCreateContext: RecordCreateContextValue = {
  canCreateRecordsForOthers: true,
  categories: [
    {
      color: "blue",
      icon: "wifi",
      id: "expense-network",
      name: "網路費",
      sortOrder: 1,
      status: "active",
      type: "expense",
    },
  ],
  close: vi.fn(),
  isCreatePending: false,
  members: [
    {
      avatarUrl: undefined,
      capabilities: [],
      displayName: "成員 A",
      googleAccountEmail: "a@example.com",
      googleSubject: "google-a",
      householdId: "household-demo",
      id: "member-a",
      roles: ["admin"],
      status: "active",
    },
    {
      avatarUrl: undefined,
      capabilities: [],
      displayName: "成員 B",
      googleAccountEmail: "b@example.com",
      googleSubject: "google-b",
      householdId: "household-demo",
      id: "member-b",
      roles: ["general_member"],
      status: "active",
    },
  ],
  mode: "expense",
  onRecordCreated: vi.fn(),
  onRecurringEventCreated: vi.fn(),
  openExpense: vi.fn(),
  openIncome: vi.fn(),
  profile: {
    avatarUrl: undefined,
    capabilities: [],
    displayName: "成員 A",
    householdId: "household-demo",
    id: "member-a",
    roles: ["admin"],
  },
  setCreatePending: vi.fn(),
};
