import { describe, expect, it } from "vitest";
import {
  parseCreateLedgerRecordForm,
  parseReimburseLedgerRecordForm,
  parseUpdateLedgerRecordForm,
  parseVoidLedgerRecordForm,
} from "./ledger-record-form";

describe("parseCreateLedgerRecordForm", () => {
  it("parses an income form into a ledger record command", () => {
    const formData = new FormData();
    formData.set("recordType", "income");
    formData.set("name", "六月房租");
    formData.set("amountTwd", "12000");
    formData.set("occurredOn", "2026-06-05");
    formData.set("categoryId", "income-rent");
    formData.set("sourceMemberId", "member-mei");
    formData.set("note", "六月房租");

    expect(parseCreateLedgerRecordForm(formData)).toEqual({
      ok: true,
      command: {
        type: "income",
        name: "六月房租",
        amountCents: 1_200_000,
        occurredOn: "2026-06-05",
        categoryId: "income-rent",
        sourceMemberId: "member-mei",
        note: "六月房租",
      },
    });
  });

  it("parses a fund-paid expense without a payer", () => {
    const formData = new FormData();
    formData.set("recordType", "expense");
    formData.set("name", "網路費");
    formData.set("paymentSource", "fund");
    formData.set("amountTwd", "899.5");
    formData.set("occurredOn", "2026-06-09");
    formData.set("categoryId", "expense-internet");

    expect(parseCreateLedgerRecordForm(formData)).toEqual({
      ok: true,
      command: {
        type: "expense",
        name: "網路費",
        amountCents: 89_950,
        occurredOn: "2026-06-09",
        categoryId: "expense-internet",
        paymentSource: "fund",
      },
    });
  });

  it("requires a payer for member-paid expenses", () => {
    const formData = new FormData();
    formData.set("recordType", "expense");
    formData.set("name", "日用品");
    formData.set("paymentSource", "member");
    formData.set("amountTwd", "180");
    formData.set("occurredOn", "2026-06-10");
    formData.set("categoryId", "expense-grocery");

    expect(parseCreateLedgerRecordForm(formData)).toEqual({
      ok: false,
      reason: "missing_payer_member",
    });
  });

  it("rejects invalid amounts before writing", () => {
    const formData = new FormData();
    formData.set("recordType", "income");
    formData.set("name", "六月房租");
    formData.set("amountTwd", "12.345");
    formData.set("occurredOn", "2026-06-05");
    formData.set("categoryId", "income-rent");
    formData.set("sourceMemberId", "member-mei");

    expect(parseCreateLedgerRecordForm(formData)).toEqual({
      ok: false,
      reason: "invalid_amount",
    });
  });
});

describe("parseUpdateLedgerRecordForm", () => {
  it("parses an expense edit form into a ledger correction command", () => {
    const formData = new FormData();
    formData.set("recordId", "expense-1");
    formData.set("recordType", "expense");
    formData.set("name", "日用品補正");
    formData.set("paymentSource", "member");
    formData.set("amountTwd", "350");
    formData.set("occurredOn", "2026-06-10");
    formData.set("categoryId", "expense-grocery");
    formData.set("payerMemberId", "member-mei");
    formData.set("note", "補正");

    expect(parseUpdateLedgerRecordForm(formData)).toEqual({
      ok: true,
      command: {
        recordId: "expense-1",
        name: "日用品補正",
        amountCents: 35_000,
        occurredOn: "2026-06-10",
        categoryId: "expense-grocery",
        paymentSource: "member",
        payerMemberId: "member-mei",
        note: "補正",
      },
    });
  });

  it("requires a record id before editing", () => {
    const formData = new FormData();
    formData.set("recordType", "income");
    formData.set("name", "六月房租");
    formData.set("amountTwd", "12000");
    formData.set("occurredOn", "2026-06-05");
    formData.set("categoryId", "income-rent");
    formData.set("sourceMemberId", "member-mei");

    expect(parseUpdateLedgerRecordForm(formData)).toEqual({
      ok: false,
      reason: "missing_record_id",
    });
  });
});

describe("parseVoidLedgerRecordForm", () => {
  it("parses a delete form into a void command", () => {
    const formData = new FormData();
    formData.set("recordId", "expense-1");

    expect(parseVoidLedgerRecordForm(formData)).toEqual({
      ok: true,
      command: {
        recordId: "expense-1",
      },
    });
  });
});

describe("parseReimburseLedgerRecordForm", () => {
  it("parses a refund form into a reimbursement command", () => {
    const formData = new FormData();
    formData.set("recordId", "expense-1");
    formData.set("reimbursementMethod", "bank_transfer");
    formData.set("reimbursementPaidOn", "2026-06-24");
    formData.set("reimbursementReference", "末五碼 12345");

    expect(parseReimburseLedgerRecordForm(formData)).toEqual({
      ok: true,
      command: {
        selectedExpenseIds: ["expense-1"],
        payment: {
          method: "bank_transfer",
          paidOn: "2026-06-24",
          note: "末五碼 12345",
        },
      },
    });
  });

  it("requires a record id before refunding", () => {
    const formData = new FormData();

    expect(parseReimburseLedgerRecordForm(formData)).toEqual({
      ok: false,
      reason: "missing_record_id",
    });
  });

  it("requires valid payment evidence before refunding", () => {
    const missingMethod = new FormData();
    missingMethod.set("recordId", "expense-1");
    missingMethod.set("reimbursementPaidOn", "2026-06-24");

    expect(parseReimburseLedgerRecordForm(missingMethod)).toEqual({
      ok: false,
      reason: "missing_payment_method",
    });

    const invalidMethod = new FormData();
    invalidMethod.set("recordId", "expense-1");
    invalidMethod.set("reimbursementMethod", "line_pay");
    invalidMethod.set("reimbursementPaidOn", "2026-06-24");

    expect(parseReimburseLedgerRecordForm(invalidMethod)).toEqual({
      ok: false,
      reason: "invalid_payment_method",
    });

    const invalidDate = new FormData();
    invalidDate.set("recordId", "expense-1");
    invalidDate.set("reimbursementMethod", "cash");
    invalidDate.set("reimbursementPaidOn", "2026-06-24T12:30");

    expect(parseReimburseLedgerRecordForm(invalidDate)).toEqual({
      ok: false,
      reason: "invalid_payment_date",
    });
  });
});
