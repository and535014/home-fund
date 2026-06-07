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
};

describe("ledger record corrections", () => {
  it("allows a record owner to edit their own record", () => {
    expect(updateLedgerRecord(owner, memberPaidExpense, {
      amountCents: 3_500,
      occurredOn: "2026-06-10",
      categoryId: "expense-internet",
      note: "補正金額",
    }, { categories })).toEqual({
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
      amountCents: 3_300,
    }, { categories })).toMatchObject({
      ok: true,
      record: {
        amountCents: 3_300,
        createdByMemberId: "member-mei",
      },
    });
  });

  it("rejects a general member editing another member's record", () => {
    expect(updateLedgerRecord(otherMember, memberPaidExpense, {
      amountCents: 3_300,
    }, { categories })).toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "cannot_edit_other_member_record",
    });
  });

  it("re-derives reimbursement status when expense payment source changes", () => {
    expect(updateLedgerRecord(owner, memberPaidExpense, {
      paymentSource: "fund",
      payerMemberId: undefined,
    }, { categories })).toEqual({
      ok: true,
      record: {
        ...memberPaidExpense,
        paymentSource: "fund",
        payerMemberId: undefined,
        reimbursementStatus: "not_refundable",
      },
      events: ["Ledger record corrected"],
    });
  });

  it("allows owners and admins to delete records", () => {
    expect(deleteLedgerRecord(owner, memberPaidExpense)).toEqual({
      ok: true,
      deletedRecordId: "expense-1",
      events: ["Ledger record deleted"],
    });

    expect(deleteLedgerRecord(admin, memberPaidExpense)).toEqual({
      ok: true,
      deletedRecordId: "expense-1",
      events: ["Ledger record deleted"],
    });
  });

  it("rejects finance manager deletion of another member's record in the MVP permission set", () => {
    expect(deleteLedgerRecord(financeManager, memberPaidExpense)).toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "finance_manager_cannot_delete_other_member_record",
    });
  });
});
