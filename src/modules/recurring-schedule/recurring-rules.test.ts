import { describe, expect, it } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  confirmRecurringOccurrence,
  createRecurringRule,
  processRecurringOccurrence,
  type RecurringOccurrence,
  type RecurringRule,
} from "./recurring-rules";

const admin: AuthenticatedMember = {
  id: "member-admin",
  googleAccountLinked: true,
  roles: ["admin"],
};

const recurringManager: AuthenticatedMember = {
  id: "member-manager",
  googleAccountLinked: true,
  roles: ["general_member"],
  capabilities: ["manage_recurring"],
};

const generalMember: AuthenticatedMember = {
  id: "member-mei",
  googleAccountLinked: true,
  roles: ["general_member"],
};

const kaiMember: AuthenticatedMember = {
  id: "member-kai",
  googleAccountLinked: true,
  roles: ["general_member"],
};

const categories = [
  { id: "income-living", type: "income" as const, status: "active" as const },
  { id: "expense-internet", type: "expense" as const, status: "active" as const },
];

const immediateInternetRule: RecurringRule = {
  id: "rule-internet",
  type: "expense",
  amountCents: 899,
  categoryId: "expense-internet",
  paymentSource: "fund",
  postingMode: "immediate",
  dayOfMonth: 5,
  active: true,
};

const reminderLivingRule: RecurringRule = {
  id: "rule-living",
  type: "income",
  amountCents: 20_000,
  categoryId: "income-living",
  sourceMemberId: "member-mei",
  postingMode: "reminder",
  dayOfMonth: 10,
  active: true,
};

describe("recurring rules", () => {
  it("allows admins and recurring managers to create recurring rules", () => {
    expect(createRecurringRule(admin, {
      type: "expense",
      amountCents: 899,
      categoryId: "expense-internet",
      paymentSource: "fund",
      postingMode: "immediate",
      dayOfMonth: 5,
    }, {
      categories,
      generateId: () => "rule-new",
    })).toEqual({
      ok: true,
      rule: {
        id: "rule-new",
        type: "expense",
        amountCents: 899,
        categoryId: "expense-internet",
        paymentSource: "fund",
        postingMode: "immediate",
        dayOfMonth: 5,
        active: true,
      },
      events: ["Recurring rule created"],
    });

    expect(createRecurringRule(recurringManager, {
      type: "income",
      amountCents: 20_000,
      categoryId: "income-living",
      sourceMemberId: "member-manager",
      postingMode: "reminder",
      dayOfMonth: 10,
    }, {
      categories,
      generateId: () => "rule-manager",
    })).toMatchObject({ ok: true });
  });

  it("rejects recurring rule management without permission", () => {
    expect(createRecurringRule(generalMember, {
      type: "expense",
      amountCents: 899,
      categoryId: "expense-internet",
      paymentSource: "fund",
      postingMode: "immediate",
      dayOfMonth: 5,
    }, { categories })).toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "recurring_manager_required",
    });
  });

  it("posts immediate recurring items into the ledger for the target month", () => {
    const result = processRecurringOccurrence(admin, immediateInternetRule, {
      month: "2026-06",
      categories,
      existingOccurrences: [],
      generateOccurrenceId: () => "occurrence-internet-june",
      generateLedgerRecordId: () => "ledger-internet-june",
    });

    expect(result).toEqual({
      ok: true,
      occurrence: {
        id: "occurrence-internet-june",
        recurringRuleId: "rule-internet",
        month: "2026-06",
        status: "posted",
        ledgerRecordId: "ledger-internet-june",
      },
      ledgerRecord: {
        id: "ledger-internet-june",
        type: "expense",
        name: "週期支出",
        amountCents: 899,
        occurredOn: "2026-06-05",
        categoryId: "expense-internet",
        createdByMemberId: "member-admin",
        paymentSource: "fund",
        reimbursementStatus: "not_refundable",
      },
      events: ["Immediate recurring item posted"],
    });
  });

  it("creates reminder occurrences without ledger records", () => {
    const result = processRecurringOccurrence(generalMember, reminderLivingRule, {
      month: "2026-06",
      categories,
      existingOccurrences: [],
      generateOccurrenceId: () => "occurrence-living-june",
    });

    expect(result).toEqual({
      ok: true,
      occurrence: {
        id: "occurrence-living-june",
        recurringRuleId: "rule-living",
        month: "2026-06",
        status: "pending",
      },
      events: ["Recurring reminder created"],
    });
  });

  it("confirms pending reminders into ledger records once", () => {
    const pendingOccurrence: RecurringOccurrence = {
      id: "occurrence-living-june",
      recurringRuleId: "rule-living",
      month: "2026-06",
      status: "pending",
    };

    expect(confirmRecurringOccurrence(generalMember, pendingOccurrence, reminderLivingRule, {
      categories,
      generateLedgerRecordId: () => "ledger-living-june",
    })).toEqual({
      ok: true,
      occurrence: {
        ...pendingOccurrence,
        status: "posted",
        ledgerRecordId: "ledger-living-june",
      },
      ledgerRecord: {
        id: "ledger-living-june",
        type: "income",
        name: "週期收入",
        amountCents: 20_000,
        occurredOn: "2026-06-10",
        categoryId: "income-living",
        createdByMemberId: "member-mei",
        sourceMemberId: "member-mei",
        reimbursementStatus: "not_applicable",
      },
      events: ["Recurring reminder confirmed"],
    });

    expect(confirmRecurringOccurrence(generalMember, {
      ...pendingOccurrence,
      status: "posted",
      ledgerRecordId: "ledger-living-june",
    }, reminderLivingRule, { categories })).toEqual({
      ok: false,
      reason: "occurrence_already_posted",
    });
  });

  it("rejects reminder confirmation when the actor cannot create the resulting record", () => {
    const pendingOccurrence: RecurringOccurrence = {
      id: "occurrence-living-june",
      recurringRuleId: "rule-living",
      month: "2026-06",
      status: "pending",
    };
    const kaiLivingRule: RecurringRule = {
      ...reminderLivingRule,
      sourceMemberId: "member-kai",
      note: "Kai 每月生活費提醒",
    };

    expect(confirmRecurringOccurrence(generalMember, pendingOccurrence, kaiLivingRule, {
      categories,
      generateLedgerRecordId: () => "ledger-living-june",
    })).toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "cannot_create_record_for_other_member",
    });
  });

  it("uses the recurring rule note as the created ledger record name", () => {
    const pendingOccurrence: RecurringOccurrence = {
      id: "occurrence-living-june",
      recurringRuleId: "rule-living",
      month: "2026-06",
      status: "pending",
    };

    expect(confirmRecurringOccurrence(kaiMember, pendingOccurrence, {
      ...reminderLivingRule,
      sourceMemberId: "member-kai",
      note: "Kai 每月生活費提醒",
    }, {
      categories,
      generateLedgerRecordId: () => "ledger-living-june",
    })).toMatchObject({
      ok: true,
      ledgerRecord: {
        id: "ledger-living-june",
        name: "Kai 每月生活費提醒",
        sourceMemberId: "member-kai",
      },
    });
  });

  it("prevents duplicate occurrences for the same rule and month", () => {
    expect(processRecurringOccurrence(admin, immediateInternetRule, {
      month: "2026-06",
      categories,
      existingOccurrences: [{
        id: "occurrence-existing",
        recurringRuleId: "rule-internet",
        month: "2026-06",
        status: "posted",
        ledgerRecordId: "ledger-existing",
      }],
    })).toEqual({
      ok: false,
      reason: "duplicate_occurrence",
    });
  });
});
