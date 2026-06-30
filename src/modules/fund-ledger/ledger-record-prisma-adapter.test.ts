import { describe, expect, it } from "vitest";
import {
  mapPrismaExpenseLedgerRecordToExpenseLedgerRecord,
  mapPrismaLedgerRecordToLedgerRecord,
} from "./ledger-record-prisma-adapter";

describe("ledger record Prisma adapter", () => {
  it("maps income records with source member ids", () => {
    expect(mapPrismaLedgerRecordToLedgerRecord({
      id: "income-rent-june",
      type: "income",
      name: "六月房租",
      amountCents: 120_000_00,
      occurredOn: new Date("2026-06-05T00:00:00.000Z"),
      categoryId: "income-rent",
      createdByMemberId: "member-mei",
      sourceMemberId: "member-mei",
      paymentSource: null,
      payerMemberId: null,
      reimbursementStatus: "not_applicable",
      status: "active",
      note: null,
    })).toEqual({
      id: "income-rent-june",
      type: "income",
      name: "六月房租",
      amountCents: 120_000_00,
      occurredOn: "2026-06-05",
      categoryId: "income-rent",
      createdByMemberId: "member-mei",
      sourceMemberId: "member-mei",
      reimbursementStatus: "not_applicable",
      status: "active",
    });
  });

  it("normalizes legacy expense reimbursement status", () => {
    expect(mapPrismaExpenseLedgerRecordToExpenseLedgerRecord({
      id: "expense-fund-june",
      type: "expense",
      name: "日用品",
      amountCents: 3_000,
      occurredOn: new Date("2026-06-09T00:00:00.000Z"),
      categoryId: "expense-grocery",
      createdByMemberId: "member-mei",
      paymentSource: null,
      payerMemberId: null,
      reimbursementStatus: "not_applicable",
      status: "active",
      note: null,
    })).toEqual({
      id: "expense-fund-june",
      type: "expense",
      name: "日用品",
      amountCents: 3_000,
      occurredOn: "2026-06-09",
      categoryId: "expense-grocery",
      createdByMemberId: "member-mei",
      paymentSource: "fund",
      reimbursementStatus: "not_refundable",
      status: "active",
    });
  });

  it("maps recurring occurrence trace labels", () => {
    expect(mapPrismaLedgerRecordToLedgerRecord({
      id: "income-rent-june",
      type: "income",
      name: "六月房租",
      amountCents: 120_000_00,
      occurredOn: new Date("2026-06-05T00:00:00.000Z"),
      categoryId: "income-rent",
      createdByMemberId: "member-mei",
      sourceMemberId: "member-mei",
      paymentSource: null,
      payerMemberId: null,
      reimbursementStatus: "not_applicable",
      status: "active",
      note: null,
      recurringOccurrence: {
        recurringRule: {
          dayOfMonth: 5,
          postingMode: "reminder",
          scheduleAnchor: "fixed_day",
        },
      },
    })).toMatchObject({
      id: "income-rent-june",
      recurringEventLabel: "每月 5 號，提醒入帳",
    });
  });
});
