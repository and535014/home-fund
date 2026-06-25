import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  confirmLedgerImportInDatabase,
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
    { id: "income-living", type: "income" as const, name: "生活收入", status: "active" as const },
    { id: "expense-grocery", type: "expense" as const, name: "日用品", status: "active" as const },
    { id: "expense-food", type: "expense" as const, name: "餐飲", status: "active" as const },
  ];
  const ledgerCreate = vi.fn(async ({ data }) => data);
  const importBatchCreate = vi.fn(async ({ data }) => data);
  const importRowCreateMany = vi.fn(async ({ data }) => ({ count: data.length }));
  const prisma = {
    member: {
      findMany: vi.fn(async () => members),
    },
    category: {
      findMany: vi.fn(async () => categories),
    },
    ledgerRecord: {
      findMany: vi.fn(async () => []),
      create: ledgerCreate,
    },
    ledgerImportBatch: {
      create: importBatchCreate,
    },
    ledgerImportRow: {
      createMany: importRowCreateMany,
    },
    $transaction: vi.fn(async (callback) => callback(prisma)),
  };

  return {
    prisma,
    ledgerCreate,
    importBatchCreate,
    importRowCreateMany,
  };
}

describe("previewLedgerImportInDatabase", () => {
  it("previews rows without writing ledger or audit records", async () => {
    const { prisma, ledgerCreate, importBatchCreate } = createPrismaMock();

    await expect(previewLedgerImportInDatabase(actor, {
      csv,
    }, {
      prisma,
    })).resolves.toMatchObject({
      ok: true,
      summary: {
        importableCount: 3,
        needsAttentionCount: 0,
      },
    });

    expect(ledgerCreate).not.toHaveBeenCalled();
    expect(importBatchCreate).not.toHaveBeenCalled();
    expect(prisma.member.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        householdId: "household-demo",
        status: {
          in: ["active", "invited"],
        },
      },
    }));
  });

  it("repreviews rows with mapping overrides without writing records", async () => {
    const { prisma, ledgerCreate, importBatchCreate } = createPrismaMock();
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
      prisma,
    })).resolves.toMatchObject({
      ok: true,
      summary: {
        importableCount: 1,
        needsAttentionCount: 0,
      },
    });

    expect(ledgerCreate).not.toHaveBeenCalled();
    expect(importBatchCreate).not.toHaveBeenCalled();
  });
});

describe("confirmLedgerImportInDatabase", () => {
  it("atomically creates ledger records and audit rows", async () => {
    const {
      prisma,
      ledgerCreate,
      importBatchCreate,
      importRowCreateMany,
    } = createPrismaMock();

    await expect(confirmLedgerImportInDatabase(actor, {
      csv,
      fileName: "ledger.csv",
      removedCsvRowNumbers: [],
    }, {
      prisma,
      generateBatchId: () => "import-batch-1",
      generateRecordId: (index) => `record-${index + 1}`,
      generateImportRowId: (index) => `import-row-${index + 1}`,
    })).resolves.toEqual({
      ok: true,
      batchId: "import-batch-1",
      failedCount: 0,
      importedCount: 3,
      skippedCount: 0,
    });

    expect(ledgerCreate).toHaveBeenCalledTimes(3);
    expect(ledgerCreate).toHaveBeenNthCalledWith(3, {
      data: expect.objectContaining({
        id: "record-3",
        type: "expense",
        paymentSource: "member",
        payerMemberId: "member-mei",
        reimbursementStatus: "refundable",
      }),
    });
    expect(importBatchCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: "import-batch-1",
        fileName: "ledger.csv",
        status: "imported",
        failedRowCount: 0,
        importedRowCount: 3,
        skippedRowCount: 0,
        createdByMemberId: "member-admin",
      }),
    });
    expect(importRowCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          id: "import-row-3",
          csvRowNumber: 4,
          status: "imported",
          ledgerRecordId: "record-3",
        }),
      ]),
    });
  });

  it("commits duplicate rows when the user leaves them active", async () => {
    const { prisma, ledgerCreate, importBatchCreate } = createPrismaMock();
    const duplicateCsv = [
      "type,date,name,amount,member,category,note",
      "member_expense,2026-06-12,晚餐,760,小美,餐飲,",
      "member_expense,2026-06-12,晚餐,760,小美,餐飲,",
    ].join("\n");

    await expect(confirmLedgerImportInDatabase(actor, {
      csv: duplicateCsv,
      fileName: "ledger.csv",
      removedCsvRowNumbers: [],
    }, {
      prisma,
      generateBatchId: () => "import-batch-1",
      generateRecordId: (index) => `record-${index + 1}`,
      generateImportRowId: (index) => `import-row-${index + 1}`,
    })).resolves.toMatchObject({
      ok: true,
      failedCount: 0,
      importedCount: 2,
      skippedCount: 0,
    });

    expect(ledgerCreate).toHaveBeenCalledTimes(2);
    expect(importBatchCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        importedRowCount: 2,
        failedRowCount: 0,
        skippedRowCount: 0,
      }),
    });
  });

  it("commits valid rows when duplicate rows are removed", async () => {
    const {
      prisma,
      ledgerCreate,
      importRowCreateMany,
    } = createPrismaMock();
    const duplicateCsv = [
      "type,date,name,amount,member,category,note",
      "member_expense,2026-06-12,晚餐,760,小美,餐飲,",
      "member_expense,2026-06-12,晚餐,760,小美,餐飲,",
    ].join("\n");

    await expect(confirmLedgerImportInDatabase(actor, {
      csv: duplicateCsv,
      fileName: "ledger.csv",
      removedCsvRowNumbers: [3],
    }, {
      prisma,
      generateBatchId: () => "import-batch-1",
      generateRecordId: () => "record-1",
      generateImportRowId: (index) => `import-row-${index + 1}`,
    })).resolves.toMatchObject({
      ok: true,
      failedCount: 0,
      importedCount: 1,
      skippedCount: 1,
    });

    expect(ledgerCreate).toHaveBeenCalledTimes(1);
    expect(importRowCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          csvRowNumber: 3,
          status: "skipped",
          ledgerRecordId: null,
        }),
      ]),
    });
  });

  it("reports final failed row counts from server-side confirmation", async () => {
    const {
      prisma,
      ledgerCreate,
      importBatchCreate,
      importRowCreateMany,
    } = createPrismaMock();
    const mixedCsv = [
      "type,date,name,amount,member,category,note",
      "member_expense,2026-06-12,晚餐,760,小美,餐飲,",
      "member_expense,2026-06-13,宵夜,300,不存在,餐飲,",
    ].join("\n");

    await expect(confirmLedgerImportInDatabase(actor, {
      csv: mixedCsv,
      fileName: "ledger.csv",
      removedCsvRowNumbers: [],
    }, {
      prisma,
      generateBatchId: () => "import-batch-1",
      generateRecordId: () => "record-1",
      generateImportRowId: () => "import-row-1",
    })).resolves.toMatchObject({
      ok: true,
      failedCount: 1,
      importedCount: 1,
      skippedCount: 0,
    });

    expect(ledgerCreate).toHaveBeenCalledTimes(1);
    expect(importBatchCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        importedRowCount: 1,
        failedRowCount: 1,
        skippedRowCount: 0,
      }),
    });
    expect(importRowCreateMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          csvRowNumber: 2,
          status: "imported",
          ledgerRecordId: "record-1",
        }),
        expect.objectContaining({
          csvRowNumber: 3,
          status: "failed",
          ledgerRecordId: null,
        }),
      ]),
    });
  });

  it("audits failed rows when no active rows can be imported", async () => {
    const {
      prisma,
      ledgerCreate,
      importBatchCreate,
      importRowCreateMany,
    } = createPrismaMock();
    const failedCsv = [
      "type,date,name,amount,member,category,note",
      "member_expense,2026-06-13,宵夜,300,不存在,餐飲,",
    ].join("\n");

    await expect(confirmLedgerImportInDatabase(actor, {
      csv: failedCsv,
      fileName: "ledger.csv",
      removedCsvRowNumbers: [],
    }, {
      prisma,
      generateBatchId: () => "import-batch-1",
      generateImportRowId: () => "import-row-1",
    })).resolves.toMatchObject({
      ok: true,
      failedCount: 1,
      importedCount: 0,
      skippedCount: 0,
    });

    expect(ledgerCreate).not.toHaveBeenCalled();
    expect(importBatchCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        failedRowCount: 1,
        importedRowCount: 0,
        skippedRowCount: 0,
      }),
    });
    expect(importRowCreateMany).toHaveBeenCalledWith({
      data: [
        expect.objectContaining({
          csvRowNumber: 2,
          status: "failed",
          ledgerRecordId: null,
        }),
      ],
    });
  });
});
