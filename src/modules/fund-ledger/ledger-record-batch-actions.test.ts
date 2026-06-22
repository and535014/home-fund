import { describe, expect, it } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import { batchDeleteLedgerRecords } from "./ledger-record-batch-actions";
import type { ExpenseLedgerRecord, IncomeLedgerRecord } from "./ledger-records";

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

const admin: AuthenticatedMember = {
  id: "member-admin",
  googleAccountLinked: true,
  roles: ["admin"],
};

const expense: ExpenseLedgerRecord = {
  id: "expense-refundable",
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

const income: IncomeLedgerRecord = {
  id: "income-rent",
  type: "income",
  name: "房租",
  amountCents: 80_000,
  occurredOn: "2026-06-01",
  categoryId: "income-rent",
  createdByMemberId: "member-kai",
  sourceMemberId: "member-kai",
  reimbursementStatus: "not_applicable",
  status: "active",
};

describe("batchDeleteLedgerRecords", () => {
  it("voids eligible records and skips ineligible selected ids", () => {
    const result = batchDeleteLedgerRecords(admin, [expense, {
      ...expense,
      id: "expense-reimbursed",
      reimbursementStatus: "reimbursed",
    }, {
      ...expense,
      id: "expense-voided",
      status: "voided",
    }, income], {
      selectedRecordIds: [
        "expense-refundable",
        "expense-reimbursed",
        "expense-voided",
        "income-rent",
        "missing-record",
      ],
    });

    expect(result).toEqual({
      ok: true,
      processedRecords: [
        { ...expense, status: "voided" },
        { ...income, status: "voided" },
      ],
      skippedRecords: [
        { recordId: "expense-reimbursed", reason: "reimbursed_expense_blocked" },
        { recordId: "expense-voided", reason: "record_voided" },
        { recordId: "missing-record", reason: "record_not_found" },
      ],
      events: ["Ledger records batch voided"],
    });
  });

  it("skips records the actor cannot delete without failing the whole batch", () => {
    const result = batchDeleteLedgerRecords(otherMember, [expense, income], {
      selectedRecordIds: ["expense-refundable", "income-rent"],
    });

    expect(result).toEqual({
      ok: true,
      processedRecords: [{ ...income, status: "voided" }],
      skippedRecords: [
        {
          recordId: "expense-refundable",
          reason: "permission_denied",
          authorizationReason: "cannot_delete_other_member_record",
        },
      ],
      events: ["Ledger records batch voided"],
    });
  });

  it("rejects an empty selection", () => {
    expect(batchDeleteLedgerRecords(owner, [expense], {
      selectedRecordIds: [],
    })).toEqual({
      ok: false,
      reason: "empty_selection",
    });
  });
});
