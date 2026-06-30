import { describe, expect, it } from "vitest";
import {
  parseConfirmRecurringOccurrenceForm,
  parseCreateRecurringEventForm,
  parseDeleteRecurringEventForm,
} from "./recurring-event-form";

describe("parseCreateRecurringEventForm", () => {
  it("parses a fixed-day reminder income recurring event", () => {
    const formData = new FormData();
    formData.set("recordType", "income");
    formData.set("name", "成員 A 房租收入");
    formData.set("amountTwd", "18000");
    formData.set("categoryId", "income-rent");
    formData.set("sourceMemberId", "member-a");
    formData.set("recurrenceSchedule", "fixed_day");
    formData.set("recurrenceDay", "1");
    formData.set("postingMode", "reminder");

    expect(parseCreateRecurringEventForm(formData)).toEqual({
      ok: true,
      command: {
        amountCents: 1_800_000,
        categoryId: "income-rent",
        name: "成員 A 房租收入",
        postingMode: "reminder",
        schedule: { anchor: "fixed_day", dayOfMonth: 1 },
        sourceMemberId: "member-a",
        type: "income",
      },
    });
  });

  it("parses a month-end immediate member-paid expense recurring event", () => {
    const formData = new FormData();
    formData.set("recordType", "expense");
    formData.set("name", "網路費");
    formData.set("amountTwd", "1299");
    formData.set("categoryId", "expense-network");
    formData.set("paymentSource", "member");
    formData.set("payerMemberId", "member-b");
    formData.set("recurrenceSchedule", "month_end");
    formData.set("postingMode", "immediate");
    formData.set("note", "每月底網路費");

    expect(parseCreateRecurringEventForm(formData)).toEqual({
      ok: true,
      command: {
        amountCents: 129_900,
        categoryId: "expense-network",
        name: "網路費",
        note: "每月底網路費",
        payerMemberId: "member-b",
        paymentSource: "member",
        postingMode: "immediate",
        schedule: { anchor: "month_end" },
        type: "expense",
      },
    });
  });

  it("rejects non-recurring forms and fixed days outside 1-28", () => {
    const nonRecurring = new FormData();
    nonRecurring.set("recordType", "income");
    nonRecurring.set("name", "六月房租");
    nonRecurring.set("amountTwd", "18000");
    nonRecurring.set("categoryId", "income-rent");
    nonRecurring.set("sourceMemberId", "member-a");
    nonRecurring.set("recurrenceSchedule", "none");
    nonRecurring.set("postingMode", "reminder");

    expect(parseCreateRecurringEventForm(nonRecurring)).toEqual({
      ok: false,
      reason: "invalid_recurrence_schedule",
    });

    const invalidDay = new FormData();
    invalidDay.set("recordType", "income");
    invalidDay.set("name", "六月房租");
    invalidDay.set("amountTwd", "18000");
    invalidDay.set("categoryId", "income-rent");
    invalidDay.set("sourceMemberId", "member-a");
    invalidDay.set("recurrenceSchedule", "fixed_day");
    invalidDay.set("recurrenceDay", "29");
    invalidDay.set("postingMode", "reminder");

    expect(parseCreateRecurringEventForm(invalidDay)).toEqual({
      ok: false,
      reason: "invalid_schedule_day",
    });
  });
});

describe("parseDeleteRecurringEventForm", () => {
  it("parses the recurring event id", () => {
    const formData = new FormData();
    formData.set("recurringEventId", "event-rent");

    expect(parseDeleteRecurringEventForm(formData)).toEqual({
      ok: true,
      command: { recurringEventId: "event-rent" },
    });
  });

  it("requires a recurring event id", () => {
    expect(parseDeleteRecurringEventForm(new FormData())).toEqual({
      ok: false,
      reason: "missing_recurring_event_id",
    });
  });
});

describe("parseConfirmRecurringOccurrenceForm", () => {
  it("parses the occurrence id", () => {
    const formData = new FormData();
    formData.set("occurrenceId", "occ-rent-2026-07");

    expect(parseConfirmRecurringOccurrenceForm(formData)).toEqual({
      ok: true,
      command: { occurrenceId: "occ-rent-2026-07" },
    });
  });

  it("requires an occurrence id", () => {
    expect(parseConfirmRecurringOccurrenceForm(new FormData())).toEqual({
      ok: false,
      reason: "missing_occurrence_id",
    });
  });
});
