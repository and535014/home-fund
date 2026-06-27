import { describe, expect, it } from "vitest";
import {
  isPaymentErrorReason,
  messageForBatchRefundError,
  messageForPaymentError,
} from "./batch-refund-action-result";

describe("batch refund action result messages", () => {
  it("recognizes payment evidence validation errors", () => {
    expect(isPaymentErrorReason("missing_payment_date")).toBe(true);
    expect(isPaymentErrorReason("missing_payment_method")).toBe(true);
    expect(isPaymentErrorReason("cross_member_batch")).toBe(false);
  });

  it("maps payment evidence errors to Traditional Chinese messages", () => {
    expect(messageForPaymentError("missing_payment_date")).toBe(
      "請填寫付款日期。",
    );
    expect(messageForPaymentError("missing_payment_method")).toBe(
      "請選擇付款方式。",
    );
  });

  it("maps batch refund errors to existing user-facing messages", () => {
    expect(messageForBatchRefundError("permission_denied")).toBe(
      "目前帳號沒有批次退款權限。",
    );
    expect(messageForBatchRefundError("cross_member_batch")).toBe(
      "請一次退款同一位代墊成員的紀錄。",
    );
    expect(messageForBatchRefundError("no_eligible_records")).toBe(
      "沒有符合退款條件的紀錄。",
    );
  });
});
