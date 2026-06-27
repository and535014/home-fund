import { describe, expect, it } from "vitest";
import {
  canEditReimbursementPayments,
  recordActionAccess,
} from "./record-detail-actions";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdAccessProfile } from "@/modules/identity-access/session-access";

const memberPaidExpense: LedgerRecord = {
  id: "expense-1",
  type: "expense",
  name: "晚餐代墊",
  amountCents: 120000,
  occurredOn: "2026-06-10",
  categoryId: "category-food",
  createdByMemberId: "member-lin",
  paymentSource: "member",
  payerMemberId: "member-lin",
  reimbursementStatus: "refundable",
  status: "active",
};

describe("recordActionAccess", () => {
  it("allows finance managers to edit and refund active refundable member-paid expenses", () => {
    expect(
      recordActionAccess(actor("member-wu", ["finance_manager"]), memberPaidExpense),
    ).toEqual({
      canDelete: false,
      canEdit: true,
      canRefund: true,
    });
  });

  it("allows record owners to edit and delete but not refund without reimbursement permission", () => {
    expect(recordActionAccess(actor("member-lin", []), memberPaidExpense)).toEqual({
      canDelete: true,
      canEdit: true,
      canRefund: false,
    });
  });

  it("blocks editing and deleting reimbursed expenses but keeps the reason available", () => {
    expect(
      recordActionAccess(actor("member-lin", ["admin"]), {
        ...memberPaidExpense,
        reimbursementStatus: "reimbursed",
      }),
    ).toEqual({
      blockedReason: "這筆代墊支出已退款，無法編輯或刪除。",
      canDelete: false,
      canEdit: false,
      canRefund: false,
    });
  });
});

describe("canEditReimbursementPayments", () => {
  it("allows admins and finance managers to edit refund payment evidence", () => {
    expect(canEditReimbursementPayments(actor("admin", ["admin"]))).toBe(true);
    expect(
      canEditReimbursementPayments(actor("finance", ["finance_manager"])),
    ).toBe(true);
  });

  it("blocks general members from editing refund payment evidence", () => {
    expect(
      canEditReimbursementPayments(actor("general", ["general_member"])),
    ).toBe(false);
  });
});

function actor(
  id: string,
  roles: HouseholdAccessProfile["roles"],
): HouseholdAccessProfile {
  return {
    id,
    householdId: "household-1",
    displayName: id,
    roles,
    capabilities: [],
  };
}
