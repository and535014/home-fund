import { describe, expect, it } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  deleteLedgerRecord,
  updateLedgerRecord,
} from "./ledger-record-corrections";
import type { ExpenseLedgerRecord, LedgerCategory } from "./ledger-records";

const categories: LedgerCategory[] = [
  { id: "expense-grocery", type: "expense", status: "active" },
  { id: "expense-internet", type: "expense", status: "active" },
  { id: "income-rent", type: "income", status: "active" },
];

const owner: AuthenticatedMember = {
  id: "member-mei",
  googleAccountLinked: true,
  roles: ["general_member"],
};

const otherMember: AuthenticatedMember = {
  id: "member-kai",
  googleAccountLinked: true,
  roles: ["general_member"],
};

const financeManager: AuthenticatedMember = {
  id: "member-fin",
  googleAccountLinked: true,
  roles: ["finance_manager"],
};

const admin: AuthenticatedMember = {
  id: "member-admin",
  googleAccountLinked: true,
  roles: ["admin"],
};

const memberPaidExpense: ExpenseLedgerRecord = {
  id: "expense-1",
  type: "expense",
  name: "日用品代墊",
  amountCents: 3_200,
  occurredOn: "2026-06-09",
  categoryId: "expense-grocery",
  createdByMemberId: "member-mei",
  paymentSource: "member",
  payerMemberId: "member-mei",
  reimbursementStatus: "refundable",
  status: "active",
};

const reimbursedExpense: ExpenseLedgerRecord = {
  ...memberPaidExpense,
  id: "expense-reimbursed",
  reimbursementStatus: "reimbursed",
};

const voidedExpense: ExpenseLedgerRecord = {
  ...memberPaidExpense,
  id: "expense-voided",
  status: "voided",
};

const commonUpdate = {
  name: "修正後紀錄",
  amountCents: 3_500,
  occurredOn: "2026-06-10",
  note: "補正",
};

const correctionContext = {
  categories,
  householdMemberIds: new Set(["member-mei", "member-kai", "member-fin"]),
};

describe("ledger record corrections", () => {
  it("allows a record owner to edit their own record", () => {
    expect(updateLedgerRecord(owner, memberPaidExpense, {
      type: "expense",
      name: memberPaidExpense.name,
      amountCents: 3_500,
      occurredOn: "2026-06-10",
      categoryId: "expense-internet",
      paymentSource: "member",
      payerMemberId: "member-mei",
      note: "補正金額",
    }, correctionContext)).toEqual({
      ok: true,
      record: {
        ...memberPaidExpense,
        amountCents: 3_500,
        occurredOn: "2026-06-10",
        categoryId: "expense-internet",
        note: "補正金額",
      },
      events: ["Ledger record corrected"],
    });
  });

  it("allows a finance manager to edit another member's record", () => {
    expect(updateLedgerRecord(financeManager, memberPaidExpense, {
      type: "expense",
      name: memberPaidExpense.name,
      amountCents: 3_300,
      occurredOn: memberPaidExpense.occurredOn,
      categoryId: memberPaidExpense.categoryId,
      paymentSource: "member",
      payerMemberId: "member-mei",
    }, correctionContext)).toMatchObject({
      ok: true,
      record: {
        amountCents: 3_300,
        createdByMemberId: "member-mei",
      },
    });
  });

  it("rejects a general member editing another member's record", () => {
    expect(updateLedgerRecord(otherMember, memberPaidExpense, {
      type: "expense",
      name: memberPaidExpense.name,
      amountCents: 3_300,
      occurredOn: memberPaidExpense.occurredOn,
      categoryId: memberPaidExpense.categoryId,
      paymentSource: "member",
      payerMemberId: "member-mei",
    }, correctionContext)).toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "cannot_edit_other_member_record",
    });
  });

  it("re-derives reimbursement status when expense payment source changes", () => {
    expect(updateLedgerRecord(owner, memberPaidExpense, {
      type: "expense",
      name: memberPaidExpense.name,
      amountCents: memberPaidExpense.amountCents,
      occurredOn: memberPaidExpense.occurredOn,
      categoryId: memberPaidExpense.categoryId,
      paymentSource: "fund",
    }, correctionContext)).toEqual({
      ok: true,
      record: {
        id: "expense-1",
        type: "expense",
        name: "日用品代墊",
        amountCents: 3_200,
        occurredOn: "2026-06-09",
        categoryId: "expense-grocery",
        createdByMemberId: "member-mei",
        paymentSource: "fund",
        reimbursementStatus: "not_refundable",
        status: "active",
      },
      events: ["Ledger record corrected"],
    });
  });

  it("allows owners and admins to delete records", () => {
    expect(deleteLedgerRecord(owner, memberPaidExpense)).toEqual({
      ok: true,
      record: {
        ...memberPaidExpense,
        status: "voided",
      },
      events: ["Ledger record voided"],
    });

    expect(deleteLedgerRecord(admin, memberPaidExpense)).toEqual({
      ok: true,
      record: {
        ...memberPaidExpense,
        status: "voided",
      },
      events: ["Ledger record voided"],
    });
  });

  it("rejects finance manager deletion of another member's record in the MVP permission set", () => {
    expect(deleteLedgerRecord(financeManager, memberPaidExpense)).toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "finance_manager_cannot_delete_other_member_record",
    });
  });

  it("blocks edits and deletes for voided records", () => {
    expect(updateLedgerRecord(owner, voidedExpense, {
      ...commonUpdate,
      type: "expense",
      categoryId: "expense-internet",
      paymentSource: "fund",
    }, correctionContext)).toEqual({
      ok: false,
      reason: "record_voided",
    });

    expect(deleteLedgerRecord(owner, voidedExpense)).toEqual({
      ok: false,
      reason: "record_voided",
    });
  });

  it("blocks edits and deletes for reimbursed member-paid expenses", () => {
    expect(updateLedgerRecord(owner, reimbursedExpense, {
      ...commonUpdate,
      type: "expense",
      categoryId: "expense-internet",
      paymentSource: "fund",
    }, correctionContext)).toEqual({
      ok: false,
      reason: "reimbursed_expense_blocked",
    });

    expect(deleteLedgerRecord(owner, reimbursedExpense)).toEqual({
      ok: false,
      reason: "reimbursed_expense_blocked",
    });
  });

  it("converts refundable expense to income and clears expense-only fields", () => {
    expect(updateLedgerRecord(owner, memberPaidExpense, {
      ...commonUpdate,
      type: "income",
      categoryId: "income-rent",
      sourceMemberId: "member-kai",
    }, correctionContext)).toEqual({
      ok: true,
      record: {
        id: "expense-1",
        type: "income",
        name: "修正後紀錄",
        amountCents: 3_500,
        occurredOn: "2026-06-10",
        categoryId: "income-rent",
        createdByMemberId: "member-mei",
        sourceMemberId: "member-kai",
        note: "補正",
        reimbursementStatus: "not_applicable",
        status: "active",
      },
      events: ["Ledger record corrected"],
    });
  });

  it.each([
    ["fund", undefined, "not_refundable"],
    ["member", "member-kai", "refundable"],
  ] as const)("converts income to %s-paid expense", (paymentSource, payerMemberId, reimbursementStatus) => {
    const income = {
      ...memberPaidExpense,
      id: "income-1",
      type: "income" as const,
      categoryId: "income-rent",
      sourceMemberId: "member-mei",
      reimbursementStatus: "not_applicable" as const,
    };
    const command = paymentSource === "fund"
      ? {
          ...commonUpdate,
          type: "expense" as const,
          categoryId: "expense-internet",
          paymentSource: "fund" as const,
        }
      : {
          ...commonUpdate,
          type: "expense" as const,
          categoryId: "expense-internet",
          paymentSource: "member" as const,
          payerMemberId,
        };

    const result = updateLedgerRecord(owner, income, command, correctionContext);

    expect(result).toMatchObject({
      ok: true,
      record: {
        type: "expense",
        paymentSource,
        reimbursementStatus,
      },
    });

    if (result.ok) {
      if (paymentSource === "fund") {
        expect(result.record).not.toHaveProperty("payerMemberId");
      } else {
        expect(result.record).toHaveProperty("payerMemberId", payerMemberId);
      }
    }
  });

  it("validates the category against the target type", () => {
    expect(updateLedgerRecord(owner, memberPaidExpense, {
      ...commonUpdate,
      type: "income",
      categoryId: "expense-grocery",
      sourceMemberId: "member-mei",
    }, correctionContext)).toEqual({
      ok: false,
      reason: "category_type_mismatch",
    });
  });

  it("blocks a reimbursed expense before applying a forged income target", () => {
    expect(updateLedgerRecord(owner, reimbursedExpense, {
      ...commonUpdate,
      type: "income",
      categoryId: "income-rent",
      sourceMemberId: "member-mei",
    }, correctionContext)).toEqual({
      ok: false,
      reason: "reimbursed_expense_blocked",
    });
  });

  it("rejects target members outside the active household", () => {
    expect(updateLedgerRecord(owner, memberPaidExpense, {
      ...commonUpdate,
      type: "income",
      categoryId: "income-rent",
      sourceMemberId: "member-other-household",
    }, {
      categories,
      householdMemberIds: new Set(["member-mei", "member-kai"]),
    })).toEqual({
      ok: false,
      reason: "income_source_outside_household",
    });
  });

  it("preserves recurring trace while changing the financial type", () => {
    const recurringExpense = {
      ...memberPaidExpense,
      recurringEventLabel: "每月 10 號，馬上入帳",
    };

    expect(updateLedgerRecord(owner, recurringExpense, {
      ...commonUpdate,
      type: "income",
      categoryId: "income-rent",
      sourceMemberId: "member-mei",
    }, correctionContext)).toMatchObject({
      ok: true,
      record: {
        type: "income",
        recurringEventLabel: "每月 10 號，馬上入帳",
      },
    });
  });
});
