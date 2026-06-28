import { describe, expect, it } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  createRecurringEvent,
  recurringEventToLedgerCommand,
  resolveRecurringTargetDate,
  type RecurringCategory,
} from "./recurring-event";

const admin: AuthenticatedMember = {
  id: "member-admin",
  googleAccountLinked: true,
  roles: ["admin"],
};

const financeManager: AuthenticatedMember = {
  id: "member-finance",
  googleAccountLinked: true,
  roles: ["finance_manager"],
};

const generalMember: AuthenticatedMember = {
  id: "member-a",
  googleAccountLinked: true,
  roles: ["general_member"],
};

const categories: RecurringCategory[] = [
  { id: "income-rent", status: "active", type: "income" },
  { id: "expense-network", status: "active", type: "expense" },
  { id: "expense-archived", status: "archived", type: "expense" },
];

describe("resolveRecurringTargetDate", () => {
  it("resolves fixed-day schedules for days 1-28", () => {
    expect(resolveRecurringTargetDate({
      anchor: "fixed_day",
      dayOfMonth: 15,
    }, "2026-07")).toBe("2026-07-15");
  });

  it("rejects fixed-day schedules outside the MVP range", () => {
    expect(resolveRecurringTargetDate({
      anchor: "fixed_day",
      dayOfMonth: 29,
    }, "2026-07")).toEqual({
      ok: false,
      reason: "invalid_schedule_day",
    });
  });

  it("resolves month-end schedules to each target month end", () => {
    expect(resolveRecurringTargetDate({ anchor: "month_end" }, "2026-01")).toBe(
      "2026-01-31",
    );
    expect(resolveRecurringTargetDate({ anchor: "month_end" }, "2026-02")).toBe(
      "2026-02-28",
    );
    expect(resolveRecurringTargetDate({ anchor: "month_end" }, "2028-02")).toBe(
      "2028-02-29",
    );
    expect(resolveRecurringTargetDate({ anchor: "month_end" }, "2026-11")).toBe(
      "2026-11-30",
    );
  });
});

describe("createRecurringEvent", () => {
  it("creates a reminder income event for an admin", () => {
    const result = createRecurringEvent(admin, {
      amountCents: 1_800_000,
      categoryId: "income-rent",
      name: "成員 A 房租收入",
      postingMode: "reminder",
      schedule: {
        anchor: "fixed_day",
        dayOfMonth: 1,
      },
      sourceMemberId: "member-a",
      type: "income",
    }, {
      categories,
      generateId: () => "recurring-rent",
    });

    expect(result).toEqual({
      ok: true,
      event: {
        active: true,
        amountCents: 1_800_000,
        categoryId: "income-rent",
        createdByMemberId: "member-admin",
        id: "recurring-rent",
        name: "成員 A 房租收入",
        postingMode: "reminder",
        schedule: {
          anchor: "fixed_day",
          dayOfMonth: 1,
        },
        sourceMemberId: "member-a",
        type: "income",
      },
      events: ["Recurring event created"],
    });
  });

  it("creates an immediate member-paid expense event for a finance manager", () => {
    const result = createRecurringEvent(financeManager, {
      amountCents: 129_900,
      categoryId: "expense-network",
      name: "網路費",
      payerMemberId: "member-b",
      paymentSource: "member",
      postingMode: "immediate",
      schedule: {
        anchor: "fixed_day",
        dayOfMonth: 15,
      },
      type: "expense",
    }, {
      categories,
      generateId: () => "recurring-network",
    });

    expect(result).toMatchObject({
      ok: true,
      event: {
        id: "recurring-network",
        payerMemberId: "member-b",
        paymentSource: "member",
        postingMode: "immediate",
        type: "expense",
      },
    });
  });

  it("rejects general members managing recurring events", () => {
    expect(createRecurringEvent(generalMember, {
      amountCents: 1_800_000,
      categoryId: "income-rent",
      name: "成員 A 房租收入",
      postingMode: "reminder",
      schedule: {
        anchor: "fixed_day",
        dayOfMonth: 1,
      },
      sourceMemberId: "member-a",
      type: "income",
    }, { categories })).toEqual({
      ok: false,
      authorizationReason: "finance_manager_required",
      reason: "permission_denied",
    });
  });

  it("validates schedule, category, amount, and payment-source shape", () => {
    expect(createRecurringEvent(admin, {
      amountCents: 1_000,
      categoryId: "income-rent",
      name: "錯誤分類",
      paymentSource: "fund",
      postingMode: "reminder",
      schedule: {
        anchor: "fixed_day",
        dayOfMonth: 1,
      },
      type: "expense",
    }, { categories })).toEqual({
      ok: false,
      reason: "category_type_mismatch",
    });

    expect(createRecurringEvent(admin, {
      amountCents: 1_000,
      categoryId: "expense-archived",
      name: "封存分類",
      paymentSource: "fund",
      postingMode: "reminder",
      schedule: {
        anchor: "month_end",
      },
      type: "expense",
    }, { categories })).toEqual({
      ok: false,
      reason: "archived_category",
    });

    expect(createRecurringEvent(admin, {
      amountCents: 0,
      categoryId: "income-rent",
      name: "金額錯誤",
      postingMode: "reminder",
      schedule: {
        anchor: "fixed_day",
        dayOfMonth: 1,
      },
      sourceMemberId: "member-a",
      type: "income",
    }, { categories })).toEqual({
      ok: false,
      reason: "invalid_amount",
    });

    expect(createRecurringEvent(admin, {
      amountCents: 1_000,
      categoryId: "expense-network",
      name: "缺少代墊者",
      paymentSource: "member",
      postingMode: "reminder",
      schedule: {
        anchor: "fixed_day",
        dayOfMonth: 29,
      },
      type: "expense",
    }, { categories })).toEqual({
      ok: false,
      reason: "invalid_schedule_day",
    });
  });
});

describe("recurringEventToLedgerCommand", () => {
  it("converts income and member-paid expense events into ordinary ledger commands", () => {
    const rent = createRecurringEvent(admin, {
      amountCents: 1_800_000,
      categoryId: "income-rent",
      name: "成員 A 房租收入",
      postingMode: "reminder",
      schedule: { anchor: "fixed_day", dayOfMonth: 1 },
      sourceMemberId: "member-a",
      type: "income",
    }, {
      categories,
      generateId: () => "rent",
    });
    const network = createRecurringEvent(admin, {
      amountCents: 129_900,
      categoryId: "expense-network",
      name: "網路費",
      payerMemberId: "member-b",
      paymentSource: "member",
      postingMode: "immediate",
      schedule: { anchor: "fixed_day", dayOfMonth: 15 },
      type: "expense",
    }, {
      categories,
      generateId: () => "network",
    });

    expect(rent.ok && recurringEventToLedgerCommand(rent.event, "2026-07")).toEqual({
      amountCents: 1_800_000,
      categoryId: "income-rent",
      name: "成員 A 房租收入",
      occurredOn: "2026-07-01",
      sourceMemberId: "member-a",
      type: "income",
    });
    expect(network.ok && recurringEventToLedgerCommand(network.event, "2026-07")).toEqual({
      amountCents: 129_900,
      categoryId: "expense-network",
      name: "網路費",
      occurredOn: "2026-07-15",
      payerMemberId: "member-b",
      paymentSource: "member",
      type: "expense",
    });
  });
});
