import { describe, expect, it, vi, beforeEach } from "vitest";
import { initialActionState } from "./action-state";
import {
  confirmRecurringOccurrenceAction,
  createRecurringEventAction,
  deleteRecurringEventAction,
} from "./recurring-event-actions";
import {
  createRecurringEventInDatabase,
  deleteRecurringEventInDatabase,
} from "@/modules/recurring/recurring-event-command";
import { postRecurringOccurrence } from "@/modules/fund-ledger/ledger-record-creation";
import { requireMutationAccess } from "./server-action-adapter";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("./server-action-adapter", async () => {
  return {
    actionSuccessWithRevalidation: vi.fn((message, data, paths) => ({
      data,
      message,
      ok: true,
      revalidated: paths,
      status: "success",
    })),
    requireMutationAccess: vi.fn(),
  };
});

vi.mock("@/db/prisma", () => ({
  getPrismaClient: vi.fn(() => ({ prisma: true })),
}));

vi.mock("@/modules/recurring/recurring-event-command", () => ({
  createRecurringEventInDatabase: vi.fn(),
  deleteRecurringEventInDatabase: vi.fn(),
}));

vi.mock("@/modules/fund-ledger/ledger-record-creation", () => ({
  postRecurringOccurrence: vi.fn(),
}));

const member = {
  id: "member-admin",
  googleAccountLinked: true,
  householdId: "household-demo",
  roles: ["admin" as const],
};
const profile = {
  capabilities: [],
  displayName: "管理者",
  householdId: "household-demo",
  id: "member-admin",
  roles: ["admin" as const],
};

beforeEach(() => {
  vi.mocked(requireMutationAccess).mockResolvedValue({
    access: {
      events: ["Household member access resolved"],
      member,
      ok: true,
      profile,
    },
    accessHints: {} as never,
    profile,
  });
  vi.mocked(createRecurringEventInDatabase).mockReset();
  vi.mocked(deleteRecurringEventInDatabase).mockReset();
  vi.mocked(postRecurringOccurrence).mockReset();
});

describe("createRecurringEventAction", () => {
  it("returns ActionState success and revalidates affected pages", async () => {
    vi.mocked(createRecurringEventInDatabase).mockResolvedValue({
      ok: true,
      currentOccurrenceStatus: "pending",
      event: {
        active: true,
        amountCents: 1_800_000,
        categoryId: "income-rent",
        createdByMemberId: "member-admin",
        id: "event-rent",
        name: "成員 A 房租收入",
        postingMode: "reminder",
        schedule: { anchor: "fixed_day", dayOfMonth: 1 },
        sourceMemberId: "member-a",
        type: "income",
      },
      events: ["Recurring event created"],
    });
    const formData = new FormData();
    formData.set("recordType", "income");
    formData.set("name", "成員 A 房租收入");
    formData.set("amountTwd", "18000");
    formData.set("categoryId", "income-rent");
    formData.set("sourceMemberId", "member-a");
    formData.set("recurrenceSchedule", "fixed_day");
    formData.set("recurrenceDay", "1");
    formData.set("postingMode", "reminder");

    await expect(
      createRecurringEventAction(initialActionState(), formData),
    ).resolves.toMatchObject({
      data: { recurringEventId: "event-rent" },
      message: "週期事件已新增。",
      ok: true,
      revalidated: ["/", "/search", "/settings/recurring"],
      status: "success",
    });
    expect(requireMutationAccess).toHaveBeenCalledWith({
      type: "manage_recurring_events",
    });
  });

  it("maps parse failures to typed field errors", async () => {
    const formData = new FormData();

    await expect(
      createRecurringEventAction(initialActionState(), formData),
    ).resolves.toMatchObject({
      code: "missing_name",
      fieldErrors: { name: ["請輸入週期事件名稱。"] },
      ok: false,
      status: "error",
    });
    expect(createRecurringEventInDatabase).not.toHaveBeenCalled();
  });

  it("keeps an atomically created event successful when immediate posting is unavailable", async () => {
    vi.mocked(createRecurringEventInDatabase).mockResolvedValue({
      ok: true,
      currentOccurrenceStatus: "unavailable",
      event: {
        active: true,
        amountCents: 1_800_000,
        categoryId: "income-rent",
        createdByMemberId: "member-admin",
        id: "event-rent",
        name: "成員 A 房租收入",
        postingMode: "immediate",
        schedule: { anchor: "fixed_day", dayOfMonth: 1 },
        sourceMemberId: "member-a",
        type: "income",
      },
      events: ["Recurring event created"],
    });
    const formData = new FormData();
    formData.set("recordType", "income");
    formData.set("name", "成員 A 房租收入");
    formData.set("amountTwd", "18000");
    formData.set("categoryId", "income-rent");
    formData.set("sourceMemberId", "member-a");
    formData.set("recurrenceSchedule", "fixed_day");
    formData.set("recurrenceDay", "1");
    formData.set("postingMode", "immediate");

    await expect(
      createRecurringEventAction(initialActionState(), formData),
    ).resolves.toMatchObject({
      data: { recurringEventId: "event-rent" },
      message: "週期事件已建立，本月入帳將重試",
      ok: true,
      status: "success",
    });
    expect(createRecurringEventInDatabase).toHaveBeenCalledTimes(1);
  });
});

describe("deleteRecurringEventAction", () => {
  it("deletes through the domain command", async () => {
    vi.mocked(deleteRecurringEventInDatabase).mockResolvedValue({
      ok: true,
      recurringEventId: "event-rent",
      skippedPendingOccurrenceCount: 1,
    });
    const formData = new FormData();
    formData.set("recurringEventId", "event-rent");

    await expect(
      deleteRecurringEventAction(initialActionState(), formData),
    ).resolves.toMatchObject({
      data: { recurringEventId: "event-rent" },
      message: "週期事件已刪除。",
      ok: true,
      revalidated: ["/", "/search", "/settings/recurring"],
      status: "success",
    });
  });
});

describe("confirmRecurringOccurrenceAction", () => {
  it("confirms through the domain command", async () => {
    vi.mocked(postRecurringOccurrence).mockResolvedValue({
      status: "posted",
      occurrenceId: "occ-rent-2026-07",
      recordId: "record-rent-2026-07",
    });
    const formData = new FormData();
    formData.set("occurrenceId", "occ-rent-2026-07");

    await expect(
      confirmRecurringOccurrenceAction(initialActionState(), formData),
    ).resolves.toMatchObject({
      data: {
        occurrenceId: "occ-rent-2026-07",
        recordId: "record-rent-2026-07",
      },
      message: "週期事件已入帳。",
      ok: true,
      revalidated: ["/", "/search", "/refunds"],
      status: "success",
    });
    expect(postRecurringOccurrence).toHaveBeenCalledTimes(1);
    expect(postRecurringOccurrence).toHaveBeenCalledWith(
      { kind: "member", member },
      { occurrenceId: "occ-rent-2026-07" },
    );
  });

  it("returns an existing record for an already posted occurrence without another write", async () => {
    vi.mocked(postRecurringOccurrence).mockResolvedValue({
      status: "already_posted",
      occurrenceId: "occ-rent-2026-07",
      recordId: "record-rent-2026-07",
    });
    const formData = new FormData();
    formData.set("occurrenceId", "occ-rent-2026-07");

    await expect(
      confirmRecurringOccurrenceAction(initialActionState(), formData),
    ).resolves.toMatchObject({
      data: {
        occurrenceId: "occ-rent-2026-07",
        recordId: "record-rent-2026-07",
      },
      ok: true,
      status: "success",
    });
    expect(postRecurringOccurrence).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["archived_category", "這個分類已封存，週期事件無法入帳。"],
    ["disabled_member", "週期事件的收入來源或代墊成員已停用。"],
  ] as const)("maps blocked %s to its domain message", async (reason, message) => {
    vi.mocked(postRecurringOccurrence).mockResolvedValue({
      status: "blocked",
      occurrenceId: "occ-rent-2026-07",
      reason,
    });
    const formData = new FormData();
    formData.set("occurrenceId", "occ-rent-2026-07");

    await expect(
      confirmRecurringOccurrenceAction(initialActionState(), formData),
    ).resolves.toMatchObject({
      code: reason,
      message,
      ok: false,
      status: "error",
    });
    expect(postRecurringOccurrence).toHaveBeenCalledTimes(1);
  });

  it("maps unavailable posting to a retryable presentation error", async () => {
    vi.mocked(postRecurringOccurrence).mockResolvedValue({
      status: "unavailable",
      occurrenceId: "occ-rent-2026-07",
    });
    const formData = new FormData();
    formData.set("occurrenceId", "occ-rent-2026-07");

    await expect(
      confirmRecurringOccurrenceAction(initialActionState(), formData),
    ).resolves.toMatchObject({
      code: "unavailable",
      message: "入帳服務暫時無法使用，請稍後再試。",
      ok: false,
      status: "error",
    });
    expect(postRecurringOccurrence).toHaveBeenCalledTimes(1);
  });
});
