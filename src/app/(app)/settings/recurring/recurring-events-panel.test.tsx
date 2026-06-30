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
import { deleteRecurringEventAction } from "@/app/recurring-event-actions";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";

vi.mock("@/app/recurring-event-actions", () => ({
  deleteRecurringEventAction: vi.fn(async () =>
    actionSuccess("週期事件已刪除。", { recurringEventId: "event-network" }),
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

describe("RecurringEventsPanel", () => {
  it("renders persisted recurring events without prototype fallback rows", async () => {
    const { RecurringEventsPanel } = await import("./recurring-rules-prototype");

    renderRecurringEventsPanel(RecurringEventsPanel);

    expect(screen.getAllByText("網路費")).toHaveLength(2);
    expect(screen.queryByText("成員 A 房租收入")).not.toBeInTheDocument();
  });

  it("deletes a recurring event after confirmation", async () => {
    const { RecurringEventsPanel } = await import("./recurring-rules-prototype");

    renderRecurringEventsPanel(RecurringEventsPanel);

    fireEvent.click(screen.getAllByRole("button", { name: "刪除 網路費" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "確認刪除" }));

    await waitFor(() => {
      expect(deleteRecurringEventAction).toHaveBeenCalled();
    });
    expect(formDataValueFromDeleteCall("recurringEventId")).toBe("event-network");
    await waitFor(() => {
      expect(screen.queryAllByText("網路費")).toHaveLength(0);
    });
    expect(toast.success).toHaveBeenCalledWith("週期事件已刪除。");
  });
});

function formDataValueFromDeleteCall(name: string) {
  const formData = vi.mocked(deleteRecurringEventAction).mock.calls[0]?.[1];

  if (!(formData instanceof FormData)) {
    throw new Error("deleteRecurringEventAction was not called with FormData.");
  }

  return formData.get(name);
}

function renderRecurringEventsPanel(
  RecurringEventsPanel: typeof import("./recurring-rules-prototype").RecurringEventsPanel,
) {
  return render(
    <TooltipProvider>
      <RecurringEventsPanel
        categories={categories}
        events={[
          {
            amountCents: 129_900,
            categoryId: "expense-network",
            id: "event-network",
            name: "網路費",
            nextOccurrenceLabel: "2026/08/15",
            postingMode: "immediate",
            schedule: { anchor: "fixed_day", dayOfMonth: 15 },
            type: "expense",
          },
        ]}
      />
    </TooltipProvider>,
  );
}

const categories = [
  {
    color: "blue" as const,
    icon: "wifi" as const,
    id: "expense-network",
    name: "網路費",
    sortOrder: 1,
    status: "active" as const,
    type: "expense" as const,
  },
];
