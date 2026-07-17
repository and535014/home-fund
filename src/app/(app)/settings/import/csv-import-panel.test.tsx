// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  confirmCsvImportAction,
  previewCsvImportAction,
} from "@/app/csv-import-actions";
import type { LedgerImportPreviewRow } from "@/modules/fund-ledger/ledger-import";
import { toast } from "sonner";

vi.mock("@/app/csv-import-actions", () => ({
  confirmCsvImportAction: vi.fn(),
  previewCsvImportAction: vi.fn(),
  repreviewCsvImportAction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

beforeEach(() => {
  vi.mocked(confirmCsvImportAction).mockResolvedValue({
    ok: true,
    batchId: "batch-audit-only",
    rows: [],
    skippedRows: [],
    importedCount: 0,
    alreadyImportedCount: 0,
    failedCount: 0,
    skippedCount: 0,
  });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("CsvImportPanel audited confirmation", () => {
  it("allows an all-invalid preview to be confirmed for failed-row audit", async () => {
    vi.mocked(previewCsvImportAction).mockResolvedValue(previewSuccess([
      previewRow({
        csvRowNumber: 2,
        issues: [{ code: "member_not_found", message: "找不到對應成員。" }],
        status: "needs_attention",
      }),
    ]));

    await renderPanel();
    uploadCsv("all-invalid.csv");

    const importButton = await screen.findByRole("button", {
      name: /^匯入$/u,
    });
    expect(importButton).toBeEnabled();
    fireEvent.click(importButton);

    await waitFor(() => expect(confirmCsvImportAction).toHaveBeenCalledOnce());
    expect(confirmFormData().get("removedCsvRowNumbers")).toBe("[]");
    expect(toast.success).toHaveBeenCalledWith(
      "最終成功",
      expect.objectContaining({
        description: "成功 0 筆，失敗 0 筆，略過 0 筆",
      }),
    );
  });

  it("allows all preview rows to be removed and confirmed for skipped-row audit", async () => {
    vi.mocked(previewCsvImportAction).mockResolvedValue(previewSuccess([
      previewRow({ csvRowNumber: 2 }),
    ]));

    await renderPanel();
    uploadCsv("all-skipped.csv");

    fireEvent.click(await screen.findByRole("button", { name: "移除第 2 列" }));
    const importButton = screen.getByRole("button", { name: /^匯入$/u });
    expect(importButton).toBeEnabled();
    fireEvent.click(importButton);

    await waitFor(() => expect(confirmCsvImportAction).toHaveBeenCalledOnce());
    expect(confirmFormData().get("removedCsvRowNumbers")).toBe("[2]");
  });
});

async function renderPanel() {
  const { CsvImportPanel } = await import("./csv-import-panel");

  return render(
    <CsvImportPanel
      categories={[{ id: "expense-grocery", name: "日用品", type: "expense" }]}
      members={[{ id: "member-lin", displayName: "Lin" }]}
    />,
  );
}

function uploadCsv(fileName: string) {
  const input = document.querySelector('input[type="file"]');
  if (!(input instanceof HTMLInputElement)) {
    throw new Error("CSV file input was not rendered.");
  }

  fireEvent.change(input, {
    target: {
      files: [new File(["csv"], fileName, { type: "text/csv" })],
    },
  });
}

function confirmFormData(): FormData {
  const formData = vi.mocked(confirmCsvImportAction).mock.calls[0]?.[0];
  if (!(formData instanceof FormData)) {
    throw new Error("confirmCsvImportAction was not called with FormData.");
  }
  return formData;
}

function previewSuccess(rows: LedgerImportPreviewRow[]) {
  return {
    ok: true as const,
    fileName: "ledger.csv",
    previewToken: "signed-preview-token",
    rows,
    summary: {
      duplicateCount: 0,
      importableCount: rows.filter((row) => row.status === "valid").length,
      needsAttentionCount: rows.filter((row) => row.status === "needs_attention").length,
      removedCount: 0,
    },
  };
}

function previewRow({
  csvRowNumber,
  issues = [],
  status = "valid",
}: {
  csvRowNumber: number;
  issues?: LedgerImportPreviewRow["issues"];
  status?: LedgerImportPreviewRow["status"];
}): LedgerImportPreviewRow {
  return {
    clientRowId: `row-${csvRowNumber}`,
    csvRowNumber,
    raw: {
      type: "fund_expense",
      date: "2026-07-17",
      name: "家庭採買",
      amount: "100",
      member: "家庭基金",
      category: "日用品",
      note: "",
    },
    mappedCategoryId: "expense-grocery",
    command: status === "valid"
      ? {
          type: "expense",
          name: "家庭採買",
          amountCents: 10_000,
          occurredOn: "2026-07-17",
          categoryId: "expense-grocery",
          paymentSource: "fund",
        }
      : undefined,
    rowFingerprint: status === "valid" ? `fingerprint-${csvRowNumber}` : undefined,
    status,
    issues,
  };
}
