import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  prepareLedgerImportConfirmationInDatabase,
  previewLedgerImportInDatabase,
} from "./ledger-import-command";

const actor: AuthenticatedMember = {
  id: "member-admin",
  googleAccountLinked: true,
  roles: ["admin"],
};

const csv = [
  "type,date,name,amount,member,category,note",
  "income,2026-06-05,生活費,36000,阿明,生活收入,",
  "fund_expense,2026-06-08,家庭採買,1280,家庭基金,日用品,",
  "member_expense,2026-06-12,晚餐,760,小美,餐飲,",
].join("\n");

function createPrismaMock() {
  const members = [
    { id: "member-aming", displayName: "阿明" },
    { id: "member-mei", displayName: "小美" },
  ];
  const categories = [
    {
      id: "income-living",
      type: "income" as const,
      name: "生活收入",
      status: "active" as const,
    },
    {
      id: "expense-grocery",
      type: "expense" as const,
      name: "日用品",
      status: "active" as const,
    },
    {
      id: "expense-food",
      type: "expense" as const,
      name: "餐飲",
      status: "active" as const,
    },
  ];
  return {
    member: { findMany: vi.fn(async () => members) },
    category: { findMany: vi.fn(async () => categories) },
    ledgerRecord: { findMany: vi.fn(async () => []) },
  };
}

describe("previewLedgerImportInDatabase", () => {
  it("previews rows without any financial write surface", async () => {
    const prisma = createPrismaMock();

    await expect(previewLedgerImportInDatabase(actor, { csv }, {
      householdId: "household-demo",
      prisma,
    })).resolves.toMatchObject({
      ok: true,
      summary: {
        importableCount: 3,
        needsAttentionCount: 0,
      },
    });

    expect(prisma.member.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { householdId: "household-demo" },
    }));
  });

  it("repreviews mapping overrides without changing parser locality", async () => {
    const prisma = createPrismaMock();
    const csvWithMissingMapping = [
      "type,date,name,amount,member,category,note",
      "member_expense,2026-06-12,晚餐,760,不存在,不存在,",
    ].join("\n");

    await expect(previewLedgerImportInDatabase(actor, {
      csv: csvWithMissingMapping,
      overrides: [{
        categoryId: "expense-food",
        csvRowNumber: 2,
        memberId: "member-mei",
      }],
    }, {
      householdId: "household-demo",
      prisma,
    })).resolves.toMatchObject({
      ok: true,
      summary: {
        importableCount: 1,
        needsAttentionCount: 0,
      },
    });
  });
});

describe("prepareLedgerImportConfirmationInDatabase", () => {
  it("partitions active, source-rejected, and skipped rows with stable row identities", async () => {
    const prisma = createPrismaMock();
    const mixedCsv = [
      "type,date,name,amount,member,category,note",
      "fund_expense,2026-06-08,家庭採買,1280,家庭基金,日用品,",
      "member_expense,2026-06-12,無法對照,760,不存在,餐飲,",
      "member_expense,2026-06-13,略過晚餐,300,小美,餐飲,",
    ].join("\n");

    await expect(prepareLedgerImportConfirmationInDatabase(actor, {
      csv: mixedCsv,
      removedCsvRowNumbers: [4],
    }, {
      householdId: "household-demo",
      prisma,
    })).resolves.toMatchObject({
      rows: [{
        rowIdentity: "csv-row:2",
        csvRowNumber: 2,
        draft: { name: "家庭採買" },
      }],
      sourceRejectedRows: [{
        rowIdentity: "csv-row:3",
        csvRowNumber: 3,
        reason: "member_not_found",
      }],
      skippedRows: [{
        rowIdentity: "csv-row:4",
        csvRowNumber: 4,
      }],
    });
  });

  it("keeps duplicate fingerprints confirmable", async () => {
    const prisma = createPrismaMock();
    const duplicateCsv = [
      "type,date,name,amount,member,category,note",
      "member_expense,2026-06-12,晚餐,760,小美,餐飲,",
      "member_expense,2026-06-12,晚餐,760,小美,餐飲,",
    ].join("\n");

    const result = await prepareLedgerImportConfirmationInDatabase(actor, {
      csv: duplicateCsv,
    }, {
      householdId: "household-demo",
      prisma,
    });

    expect("ok" in result ? [] : result.rows.map((row) => row.rowIdentity)).toEqual([
      "csv-row:2",
      "csv-row:3",
    ]);
    expect("ok" in result ? [] : result.sourceRejectedRows).toEqual([]);
  });

  it("returns all-invalid and all-skipped rows for terminal auditing", async () => {
    const prisma = createPrismaMock();
    const invalidCsv = [
      "type,date,name,amount,member,category,note",
      "member_expense,2026-06-12,錯誤列,0,不存在,餐飲,",
    ].join("\n");

    const invalid = await prepareLedgerImportConfirmationInDatabase(actor, {
      csv: invalidCsv,
    }, {
      householdId: "household-demo",
      prisma,
    });
    const skipped = await prepareLedgerImportConfirmationInDatabase(actor, {
      csv,
      removedCsvRowNumbers: [2, 3, 4],
    }, {
      householdId: "household-demo",
      prisma,
    });

    expect("ok" in invalid ? [] : invalid.rows).toEqual([]);
    expect("ok" in invalid ? [] : invalid.sourceRejectedRows).toHaveLength(1);
    expect("ok" in skipped ? [] : skipped.rows).toEqual([]);
    expect("ok" in skipped ? [] : skipped.skippedRows).toHaveLength(3);
  });
});
