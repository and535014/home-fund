import { describe, expect, it } from "vitest";
import { parseCreateLedgerRecordForm } from "./ledger-record-form";

describe("parseCreateLedgerRecordForm", () => {
  it("parses an income form into a ledger record command", () => {
    const formData = new FormData();
    formData.set("month", "2026-06");
    formData.set("recordType", "income");
    formData.set("amountTwd", "12000");
    formData.set("occurredOn", "2026-06-05");
    formData.set("categoryId", "income-rent");
    formData.set("sourceMemberId", "member-mei");
    formData.set("note", "六月房租");

    expect(parseCreateLedgerRecordForm(formData)).toEqual({
      ok: true,
      month: "2026-06",
      command: {
        type: "income",
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
    formData.set("month", "2026-06");
    formData.set("recordType", "expense");
    formData.set("paymentSource", "fund");
    formData.set("amountTwd", "899.5");
    formData.set("occurredOn", "2026-06-09");
    formData.set("categoryId", "expense-internet");

    expect(parseCreateLedgerRecordForm(formData)).toEqual({
      ok: true,
      month: "2026-06",
      command: {
        type: "expense",
        amountCents: 89_950,
        occurredOn: "2026-06-09",
        categoryId: "expense-internet",
        paymentSource: "fund",
      },
    });
  });

  it("requires a payer for member-paid expenses", () => {
    const formData = new FormData();
    formData.set("month", "2026-06");
    formData.set("recordType", "expense");
    formData.set("paymentSource", "member");
    formData.set("amountTwd", "180");
    formData.set("occurredOn", "2026-06-10");
    formData.set("categoryId", "expense-grocery");

    expect(parseCreateLedgerRecordForm(formData)).toEqual({
      ok: false,
      reason: "missing_payer_member",
      month: "2026-06",
    });
  });

  it("rejects invalid amounts before writing", () => {
    const formData = new FormData();
    formData.set("month", "2026-06");
    formData.set("recordType", "income");
    formData.set("amountTwd", "12.345");
    formData.set("occurredOn", "2026-06-05");
    formData.set("categoryId", "income-rent");
    formData.set("sourceMemberId", "member-mei");

    expect(parseCreateLedgerRecordForm(formData)).toEqual({
      ok: false,
      reason: "invalid_amount",
      month: "2026-06",
    });
  });
});
