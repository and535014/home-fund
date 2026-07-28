import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  confirmCsvImportAction,
  previewCsvImportAction,
  repreviewCsvImportAction,
} from "./csv-import-actions";
import {
  prepareLedgerImportConfirmationInDatabase,
  previewLedgerImportInDatabase,
} from "@/modules/fund-ledger/ledger-import-command";
import { confirmCsvRows } from "@/modules/fund-ledger/ledger-record-creation";
import { requireMutationAccess } from "./server-action-adapter";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("./server-action-adapter", () => ({
  requireMutationAccess: vi.fn(),
  revalidateActionPaths: vi.fn(),
}));

vi.mock("@/db/prisma", () => ({
  getPrismaClient: vi.fn(() => ({ prisma: true })),
}));

vi.mock("@/modules/fund-ledger/ledger-import-command", () => ({
  prepareLedgerImportConfirmationInDatabase: vi.fn(),
  previewLedgerImportInDatabase: vi.fn(),
}));

vi.mock("@/modules/fund-ledger/ledger-record-creation", () => ({
  confirmCsvRows: vi.fn(),
}));

const member = {
  id: "member-finance",
  googleAccountLinked: true,
  householdId: "household-demo",
  roles: ["finance_manager" as const],
};

const csv = [
  "type,date,name,amount,member,category,note",
  "fund_expense,2026-07-17,家庭採買,100,家庭基金,日用品,",
].join("\n");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireMutationAccess).mockResolvedValue({
    access: {
      events: ["Household member access resolved"],
      member,
      ok: true,
      profile: {
        capabilities: [],
        displayName: "Finance",
        householdId: member.householdId,
        id: member.id,
        roles: member.roles,
      },
    },
    accessHints: {} as never,
    profile: {
      capabilities: [],
      displayName: "Finance",
      householdId: member.householdId,
      id: member.id,
      roles: member.roles,
    },
  });
  vi.mocked(previewLedgerImportInDatabase).mockResolvedValue({
    ok: true,
    rows: [],
    summary: {
      duplicateCount: 0,
      importableCount: 0,
      needsAttentionCount: 0,
      removedCount: 0,
    },
  });
});

describe("CSV import preview identity", () => {
  it("keeps one signed batch identity through re-preview and confirm", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "11111111-1111-4111-8111-111111111111",
    );
    vi.mocked(prepareLedgerImportConfirmationInDatabase).mockResolvedValue({
      rows: [],
      sourceRejectedRows: [],
      skippedRows: [{
        rowIdentity: "csv-row:2",
        csvRowNumber: 2,
        rowFingerprint: "fingerprint-2",
      }],
    });
    vi.mocked(confirmCsvRows).mockResolvedValue({
      ok: true,
      batchId: "batch-1",
      rows: [],
      skippedRows: [{
        rowIdentity: "csv-row:2",
        csvRowNumber: 2,
        status: "skipped",
      }],
    });

    const preview = await previewCsvImportAction(previewForm());
    expect(preview.ok).toBe(true);
    if (!preview.ok) {
      return;
    }

    const payload = decodePreviewToken(preview.previewToken);
    expect(payload).toMatchObject({
      batchIdentity: "11111111-1111-4111-8111-111111111111",
      csv,
    });

    const repreview = await repreviewCsvImportAction(confirmForm(preview.previewToken));
    expect(repreview.ok).toBe(true);

    await confirmCsvImportAction(confirmForm(preview.previewToken));
    expect(confirmCsvRows).toHaveBeenCalledWith(
      { kind: "member", member },
      expect.objectContaining({
        batchIdentity: payload.batchIdentity,
      }),
    );
  });
});

describe("confirmCsvImportAction", () => {
  it("delegates once and maps mixed created, source-rejected, and skipped rows", async () => {
    const token = await previewToken();
    vi.mocked(prepareLedgerImportConfirmationInDatabase).mockResolvedValue({
      rows: [
        {
          rowIdentity: "csv-row:2",
          csvRowNumber: 2,
          rowFingerprint: "fingerprint-2",
          draft: {
            type: "expense",
            name: "家庭採買",
            amountCents: 10_000,
            occurredOn: "2026-07-17",
            categoryId: "expense-grocery",
            paymentSource: "fund",
          },
        },
        {
          rowIdentity: "csv-row:5",
          csvRowNumber: 5,
          rowFingerprint: "fingerprint-5",
          draft: {
            type: "expense",
            name: "已匯入列",
            amountCents: 20_000,
            occurredOn: "2026-07-17",
            categoryId: "expense-grocery",
            paymentSource: "fund",
          },
        },
      ],
      sourceRejectedRows: [{
        rowIdentity: "csv-row:3",
        csvRowNumber: 3,
        rowFingerprint: "invalid-3",
        reason: "member_not_found",
      }],
      skippedRows: [{
        rowIdentity: "csv-row:4",
        csvRowNumber: 4,
        rowFingerprint: "fingerprint-4",
      }],
    });
    vi.mocked(confirmCsvRows).mockResolvedValue({
      ok: true,
      batchId: "batch-mixed",
      rows: [
        {
          rowIdentity: "csv-row:2",
          csvRowNumber: 2,
          status: "created",
          recordId: "record-2",
        },
        {
          rowIdentity: "csv-row:3",
          csvRowNumber: 3,
          status: "rejected",
          reason: "member_not_found",
          retryable: false,
        },
        {
          rowIdentity: "csv-row:5",
          csvRowNumber: 5,
          status: "already_imported",
          recordId: "record-5",
        },
      ],
      skippedRows: [{
        rowIdentity: "csv-row:4",
        csvRowNumber: 4,
        status: "skipped",
      }],
    });

    const result = await confirmCsvImportAction(confirmForm(token));

    expect(confirmCsvRows).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      ok: true,
      batchId: "batch-mixed",
      importedCount: 2,
      alreadyImportedCount: 1,
      failedCount: 1,
      skippedCount: 1,
    });
  });

  it.each([
    {
      label: "all source-invalid",
      prepared: {
        rows: [],
        sourceRejectedRows: [{
          rowIdentity: "csv-row:2",
          csvRowNumber: 2,
          rowFingerprint: "invalid-2",
          reason: "invalid_amount" as const,
        }],
        skippedRows: [],
      },
      confirmed: {
        ok: true as const,
        batchId: "batch-invalid",
        rows: [{
          rowIdentity: "csv-row:2",
          csvRowNumber: 2,
          status: "rejected" as const,
          reason: "invalid_amount" as const,
          retryable: false,
        }],
        skippedRows: [],
      },
      counts: { importedCount: 0, failedCount: 1, skippedCount: 0 },
    },
    {
      label: "all skipped",
      prepared: {
        rows: [],
        sourceRejectedRows: [],
        skippedRows: [{
          rowIdentity: "csv-row:2",
          csvRowNumber: 2,
          rowFingerprint: "fingerprint-2",
        }],
      },
      confirmed: {
        ok: true as const,
        batchId: "batch-skipped",
        rows: [],
        skippedRows: [{
          rowIdentity: "csv-row:2",
          csvRowNumber: 2,
          status: "skipped" as const,
        }],
      },
      counts: { importedCount: 0, failedCount: 0, skippedCount: 1 },
    },
  ])("returns audited success for $label input", async ({ prepared, confirmed, counts }) => {
    const token = await previewToken();
    vi.mocked(prepareLedgerImportConfirmationInDatabase).mockResolvedValue(prepared);
    vi.mocked(confirmCsvRows).mockResolvedValue(confirmed);

    const result = await confirmCsvImportAction(confirmForm(token));

    expect(confirmCsvRows).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      ok: true,
      alreadyImportedCount: 0,
      ...counts,
    });
  });
});

async function previewToken(): Promise<string> {
  const result = await previewCsvImportAction(previewForm());
  if (!result.ok) {
    throw new Error("Expected preview success");
  }
  return result.previewToken;
}

function previewForm(): FormData {
  const formData = new FormData();
  formData.set("file", new File([csv], "ledger.csv", { type: "text/csv" }));
  return formData;
}

function confirmForm(token: string): FormData {
  const formData = new FormData();
  formData.set("fileName", "ledger.csv");
  formData.set("previewToken", token);
  formData.set("removedCsvRowNumbers", "[]");
  formData.set("overrides", "[]");
  return formData;
}

function decodePreviewToken(token: string): Record<string, unknown> {
  const [payload] = token.split(".");
  return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Record<
    string,
    unknown
  >;
}
