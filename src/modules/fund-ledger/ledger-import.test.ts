import { describe, expect, it } from "vitest";
import {
  LEDGER_IMPORT_HEADER,
  previewLedgerImportCsv,
} from "./ledger-import";

const members = [
  { id: "member-aming", displayName: "阿明" },
  { id: "member-mei", displayName: "小美" },
];

const categories = [
  { id: "income-living", type: "income" as const, name: "生活收入", status: "active" as const },
  { id: "expense-grocery", type: "expense" as const, name: "日用品", status: "active" as const },
  { id: "expense-food", type: "expense" as const, name: "餐飲", status: "active" as const },
];

describe("previewLedgerImportCsv", () => {
  it("exports the approved ledger import header", () => {
    expect(LEDGER_IMPORT_HEADER.join(",")).toBe(
      "type,date,name,amount,member,category,note",
    );
  });

  it("previews income, fund expense, and member expense rows", () => {
    const result = previewLedgerImportCsv(
      [
        "type,date,name,amount,member,category,note",
        "income,2026-06-05,生活費,36000,阿明,生活收入,",
        "fund_expense,2026-06-08,家庭採買,1280,家庭基金,日用品,",
        "member_expense,2026-06-12,晚餐,760,小美,餐飲,聚餐",
      ].join("\n"),
      { members, categories },
    );

    expect(result).toMatchObject({
      ok: true,
      summary: {
        importableCount: 3,
        needsAttentionCount: 0,
      },
    });

    expect(result.ok && result.rows.map((row) => ({
      csvRowNumber: row.csvRowNumber,
      status: row.status,
      memberId: row.mappedMemberId,
      categoryId: row.mappedCategoryId,
      command: row.command,
    }))).toEqual([
      {
        csvRowNumber: 2,
        status: "valid",
        memberId: "member-aming",
        categoryId: "income-living",
        command: {
          type: "income",
          name: "生活費",
          amountCents: 3_600_000,
          occurredOn: "2026-06-05",
          categoryId: "income-living",
          sourceMemberId: "member-aming",
        },
      },
      {
        csvRowNumber: 3,
        status: "valid",
        memberId: undefined,
        categoryId: "expense-grocery",
        command: {
          type: "expense",
          name: "家庭採買",
          amountCents: 128_000,
          occurredOn: "2026-06-08",
          categoryId: "expense-grocery",
          paymentSource: "fund",
        },
      },
      {
        csvRowNumber: 4,
        status: "valid",
        memberId: "member-mei",
        categoryId: "expense-food",
        command: {
          type: "expense",
          name: "晚餐",
          amountCents: 76_000,
          occurredOn: "2026-06-12",
          categoryId: "expense-food",
          paymentSource: "member",
          payerMemberId: "member-mei",
          note: "聚餐",
        },
      },
    ]);
  });

  it("rejects headers with unsupported columns", () => {
    const result = previewLedgerImportCsv(
      [
        "type,date,name,amount,member,category,payment_source,note",
        "income,2026-06-05,生活費,36000,阿明,生活收入,fund,",
      ].join("\n"),
      { members, categories },
    );

    expect(result).toEqual({
      ok: false,
      reason: "invalid_header",
      message: "CSV 欄位必須是 type,date,name,amount,member,category,note。",
    });
  });

  it("marks invalid and unsupported rows as needing attention", () => {
    const result = previewLedgerImportCsv(
      [
        "type,date,name,amount,member,category,note",
        "reimbursement_payment,2026-06-05,退款,1000,小美,餐飲,",
        "member_expense,2026-02-31,晚餐,0,不存在,餐飲,",
      ].join("\n"),
      { members, categories },
    );

    expect(result.ok && result.summary.needsAttentionCount).toBe(2);
    expect(result.ok && result.rows.map((row) => row.issues.map((issue) => issue.code))).toEqual([
      ["unsupported_type"],
      ["invalid_amount", "invalid_date", "member_not_found"],
    ]);
  });

  it("counts duplicate rows without marking them as needing attention", () => {
    const csv = [
      "type,date,name,amount,member,category,note",
      "member_expense,2026-06-12,晚餐,760,小美,餐飲,",
      "member_expense,2026-06-12,晚餐,760,小美,餐飲,",
    ].join("\n");

    const result = previewLedgerImportCsv(csv, { members, categories });

    expect(result.ok && result.summary).toMatchObject({
      duplicateCount: 2,
      importableCount: 2,
      needsAttentionCount: 0,
    });
    expect(result.ok && result.rows.every((row) => row.status === "valid")).toBe(true);
    expect(result.ok && result.rows.every((row) =>
      row.issues.some((issue) => issue.code === "duplicate_in_file"),
    )).toBe(true);
  });

  it("revalidates member and category overrides", () => {
    const csv = [
      "type,date,name,amount,member,category,note",
      "member_expense,2026-06-12,晚餐,760,不存在,不存在,",
    ].join("\n");

    const initialResult = previewLedgerImportCsv(csv, { members, categories });
    const overrideResult = previewLedgerImportCsv(csv, {
      members,
      categories,
      overrides: [{
        categoryId: "expense-food",
        csvRowNumber: 2,
        memberId: "member-mei",
      }],
    });

    expect(initialResult.ok && initialResult.summary.needsAttentionCount).toBe(1);
    expect(overrideResult.ok && overrideResult.summary).toMatchObject({
      importableCount: 1,
      needsAttentionCount: 0,
    });
    expect(overrideResult.ok && overrideResult.rows[0]).toMatchObject({
      mappedCategoryId: "expense-food",
      mappedMemberId: "member-mei",
      status: "valid",
    });
  });
});
