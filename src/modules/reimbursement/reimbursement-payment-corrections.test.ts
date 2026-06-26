import { describe, expect, it } from "vitest";
import { correctReimbursementPaymentEvidence } from "./reimbursement-payment-corrections";

describe("correctReimbursementPaymentEvidence", () => {
  it("accepts date, method, and note for a refund record correction", () => {
    expect(
      correctReimbursementPaymentEvidence({
        method: "cash",
        paidOn: "2026-06-27",
        note: " 現金補登 ",
      }),
    ).toEqual({
      ok: true,
      payment: {
        method: "cash",
        paidOn: "2026-06-27",
        note: "現金補登",
      },
    });
  });

  it("normalizes a blank note to null", () => {
    expect(
      correctReimbursementPaymentEvidence({
        method: "bank_transfer",
        paidOn: "2026-06-27",
        note: "   ",
      }),
    ).toEqual({
      ok: true,
      payment: {
        method: "bank_transfer",
        paidOn: "2026-06-27",
        note: null,
      },
    });
  });

  it("rejects unsupported payment methods", () => {
    expect(
      correctReimbursementPaymentEvidence({
        method: "line_pay",
        paidOn: "2026-06-27",
      }),
    ).toEqual({
      ok: false,
      reason: "invalid_payment_method",
    });
  });

  it("rejects invalid payment dates", () => {
    expect(
      correctReimbursementPaymentEvidence({
        method: "cash",
        paidOn: "2026-02-30",
      }),
    ).toEqual({
      ok: false,
      reason: "invalid_payment_date",
    });
  });
});
