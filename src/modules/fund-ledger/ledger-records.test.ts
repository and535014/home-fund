import { describe, expect, it } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  createLedgerRecord,
  type LedgerCategory,
} from "./ledger-records";

const generalMember: AuthenticatedMember = {
  id: "member-mei",
  googleAccountLinked: true,
  roles: ["general_member"],
};

const financeManager: AuthenticatedMember = {
  id: "member-fin",
  googleAccountLinked: true,
  roles: ["finance_manager"],
};

const categories: LedgerCategory[] = [
  { id: "income-rent", type: "income", status: "active" },
  { id: "expense-grocery", type: "expense", status: "active" },
  { id: "expense-inactive", type: "expense", status: "archived" },
];

describe("createLedgerRecord", () => {
  it("creates an income record for the source member", () => {
    const result = createLedgerRecord(generalMember, {
      type: "income",
      name: "六月房租",
      amountCents: 120_000,
      occurredOn: "2026-06-05",
      categoryId: "income-rent",
      sourceMemberId: "member-mei",
      note: "六月房租",
    }, { categories, generateId: () => "record-1" });

    expect(result).toEqual({
      ok: true,
      record: {
        id: "record-1",
        type: "income",
        name: "六月房租",
        amountCents: 120_000,
        occurredOn: "2026-06-05",
        categoryId: "income-rent",
        createdByMemberId: "member-mei",
        sourceMemberId: "member-mei",
        note: "六月房租",
        reimbursementStatus: "not_applicable",
        status: "active",
      },
      events: ["Income recorded"],
    });
  });

  it("rejects a general member creating an income for another member", () => {
    const result = createLedgerRecord(generalMember, {
      type: "income",
      name: "六月房租",
      amountCents: 120_000,
      occurredOn: "2026-06-05",
      categoryId: "income-rent",
      sourceMemberId: "member-kai",
    }, { categories });

    expect(result).toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "cannot_create_record_for_other_member",
    });
  });

  it("creates a fund-paid expense that is not refundable", () => {
    const result = createLedgerRecord(generalMember, {
      type: "expense",
      name: "超市採買",
      amountCents: 6_500,
      occurredOn: "2026-06-08",
      categoryId: "expense-grocery",
      paymentSource: "fund",
    }, { categories, generateId: () => "record-2" });

    expect(result).toEqual({
      ok: true,
      record: {
        id: "record-2",
        type: "expense",
        name: "超市採買",
        amountCents: 6_500,
        occurredOn: "2026-06-08",
        categoryId: "expense-grocery",
        createdByMemberId: "member-mei",
        paymentSource: "fund",
        reimbursementStatus: "not_refundable",
        status: "active",
      },
      events: ["Expense recorded"],
    });
  });

  it("creates a member-paid expense as refundable and unreimbursed", () => {
    const result = createLedgerRecord(generalMember, {
      type: "expense",
      name: "日用品代墊",
      amountCents: 3_200,
      occurredOn: "2026-06-09",
      categoryId: "expense-grocery",
      paymentSource: "member",
      payerMemberId: "member-mei",
    }, { categories, generateId: () => "record-3" });

    expect(result).toEqual({
      ok: true,
      record: {
        id: "record-3",
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
      },
      events: ["Expense recorded", "Member-paid expense became refundable"],
    });
  });

  it("allows a finance manager to create a member-paid expense for another member", () => {
    const result = createLedgerRecord(financeManager, {
      type: "expense",
      name: "日用品代墊",
      amountCents: 3_200,
      occurredOn: "2026-06-09",
      categoryId: "expense-grocery",
      paymentSource: "member",
      payerMemberId: "member-mei",
    }, { categories, generateId: () => "record-4" });

    expect(result).toMatchObject({
      ok: true,
      record: {
        payerMemberId: "member-mei",
        reimbursementStatus: "refundable",
      },
    });
  });

  it("rejects missing or invalid categories before creating a record", () => {
    expect(createLedgerRecord(generalMember, {
      type: "expense",
      name: "分類錯誤",
      amountCents: 1_000,
      occurredOn: "2026-06-09",
      categoryId: "income-rent",
      paymentSource: "fund",
    }, { categories })).toEqual({
      ok: false,
      reason: "category_type_mismatch",
    });

    expect(createLedgerRecord(generalMember, {
      type: "expense",
      name: "封存分類",
      amountCents: 1_000,
      occurredOn: "2026-06-09",
      categoryId: "expense-inactive",
      paymentSource: "fund",
    }, { categories })).toEqual({
      ok: false,
      reason: "archived_category",
    });
  });

  it("rejects invalid amounts and impossible dates", () => {
    expect(createLedgerRecord(generalMember, {
      type: "income",
      name: "金額錯誤",
      amountCents: 0,
      occurredOn: "2026-06-09",
      categoryId: "income-rent",
      sourceMemberId: "member-mei",
    }, { categories })).toEqual({
      ok: false,
      reason: "invalid_amount",
    });

    expect(createLedgerRecord(generalMember, {
      type: "income",
      name: "日期錯誤",
      amountCents: 1_000,
      occurredOn: "2026-02-31",
      categoryId: "income-rent",
      sourceMemberId: "member-mei",
    }, { categories })).toEqual({
      ok: false,
      reason: "invalid_date",
    });
  });
});
