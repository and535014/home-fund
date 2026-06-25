"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  confirmCsvImportAction,
  previewCsvImportAction,
  repreviewCsvImportAction,
} from "@/app/csv-import-actions";
import {
  buildLedgerImportTemplateCsv,
  LEDGER_IMPORT_TEMPLATE_FILE_NAME,
} from "@/app/csv-import-template";
import { Button } from "@/components/ui/button";
import {
  CsvImportEmptyState,
  CsvImportErrorMessage,
  CsvImportPreviewTable,
  SelectedImportFileItem,
  hasBlockingIssue,
  hasDuplicateWarning,
  type CategoryOption,
  type MemberOption,
} from "./csv-import-preview-ui";
import type {
  LedgerImportPreviewRow,
  LedgerImportRowOverride,
} from "@/modules/fund-ledger/ledger-import";

type CsvImportPanelProps = {
  categories: CategoryOption[];
  members: MemberOption[];
};

type PreviewState = {
  fileName: string;
  previewToken: string;
  rows: LedgerImportPreviewRow[];
};

export function CsvImportPanel({ categories, members }: CsvImportPanelProps) {
  const [preview, setPreview] = useState<PreviewState | null>(null);
  const [removedCsvRows, setRemovedCsvRows] = useState<number[]>([]);
  const [overrides, setOverrides] = useState<LedgerImportRowOverride[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const overridesRef = useRef<LedgerImportRowOverride[]>([]);
  const repreviewRequestIdRef = useRef(0);

  const rows = preview?.rows ?? [];
  const activeRows = rows.filter(
    (row) => !removedCsvRows.includes(row.csvRowNumber),
  );
  const activeDuplicateCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const row of activeRows) {
      if (row.rowFingerprint) {
        counts.set(row.rowFingerprint, (counts.get(row.rowFingerprint) ?? 0) + 1);
      }
    }

    return counts;
  }, [activeRows]);
  const needsAttentionCount = activeRows.filter((row) =>
    hasBlockingIssue(row),
  ).length;
  const duplicateCount = activeRows.filter((row) =>
    hasDuplicateWarning(row, activeDuplicateCounts),
  ).length;
  const importableCount = activeRows.length - needsAttentionCount;
  const canImport =
    Boolean(preview) && importableCount > 0 && !isPending;

  function resetImportState() {
    setPreview(null);
    setRemovedCsvRows([]);
    setOverrides([]);
    overridesRef.current = [];
    repreviewRequestIdRef.current += 1;
    setErrorMessage(null);
  }

  function handleFileSelected(file: File | undefined) {
    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.set("file", file);
    setErrorMessage(null);

    startTransition(async () => {
      const result = await previewCsvImportAction(formData);

      if (!result.ok) {
        setErrorMessage(result.message ?? "CSV 預覽失敗。");
        return;
      }

      setPreview({
        fileName: result.fileName,
        previewToken: result.previewToken,
        rows: result.rows,
      });
      setRemovedCsvRows([]);
      setOverrides([]);
      overridesRef.current = [];
      repreviewRequestIdRef.current += 1;
    });
  }

  function setRowRemoved(csvRowNumber: number, removed: boolean) {
    setRemovedCsvRows((currentRows) =>
      removed
        ? Array.from(new Set([...currentRows, csvRowNumber]))
        : currentRows.filter((rowNumber) => rowNumber !== csvRowNumber),
    );
  }

  function updateOverride(
    csvRowNumber: number,
    field: "memberId" | "categoryId",
    value: string,
  ) {
    if (!preview) {
      return;
    }

    const nextOverrides = upsertOverride(
      overridesRef.current,
      csvRowNumber,
      field,
      value,
    );

    overridesRef.current = nextOverrides;
    setOverrides(nextOverrides);
    refreshPreviewRows(preview.previewToken, nextOverrides);
  }

  function mappedMemberId(row: LedgerImportPreviewRow): string {
    return overrideFor(row.csvRowNumber)?.memberId ?? row.mappedMemberId ?? "";
  }

  function mappedCategoryId(row: LedgerImportPreviewRow): string {
    return overrideFor(row.csvRowNumber)?.categoryId ?? row.mappedCategoryId ?? "";
  }

  function overrideFor(csvRowNumber: number) {
    return overrides.find((override) => override.csvRowNumber === csvRowNumber);
  }

  function handleImport() {
    if (!preview) {
      return;
    }

    const formData = new FormData();
    formData.set("fileName", preview.fileName);
    formData.set("previewToken", preview.previewToken);
    formData.set("removedCsvRowNumbers", JSON.stringify(removedCsvRows));
    formData.set("overrides", JSON.stringify(overrides));
    setErrorMessage(null);

    startTransition(async () => {
      const result = await confirmCsvImportAction(formData);

      if (!result.ok) {
        setErrorMessage("匯入前驗證已更新，請重新確認預覽結果。");

        if ("rows" in result && result.rows) {
          setPreview({
            ...preview,
            rows: result.rows,
          });
        }
        return;
      }

      toast.success("最終成功", {
        description: `成功 ${result.importedCount} 筆，失敗 ${result.failedCount} 筆，略過 ${result.skippedCount} 筆`,
        id: "csv-import-success",
      });
      resetImportState();
    });
  }

  function refreshPreviewRows(
    previewToken: string,
    nextOverrides: LedgerImportRowOverride[],
  ) {
    const requestId = repreviewRequestIdRef.current + 1;
    const formData = new FormData();

    repreviewRequestIdRef.current = requestId;
    formData.set("previewToken", previewToken);
    formData.set("overrides", JSON.stringify(nextOverrides));
    setErrorMessage(null);

    startTransition(async () => {
      const result = await repreviewCsvImportAction(formData);

      if (requestId !== repreviewRequestIdRef.current) {
        return;
      }

      if (!result.ok) {
        setErrorMessage(previewErrorMessage(result));
        return;
      }

      setPreview((currentPreview) =>
        currentPreview?.previewToken === previewToken
          ? {
              ...currentPreview,
              rows: result.rows,
            }
          : currentPreview,
      );
    });
  }

  function downloadTemplate() {
    const blob = new Blob([buildLedgerImportTemplateCsv()], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = LEDGER_IMPORT_TEMPLATE_FILE_NAME;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  if (!preview) {
    return (
      <CsvImportEmptyState
        errorMessage={errorMessage}
        isPending={isPending}
        onDownloadTemplate={downloadTemplate}
        onFileSelected={handleFileSelected}
      />
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <SelectedImportFileItem
        fileName={preview.fileName}
        onFileSelected={handleFileSelected}
        onRemove={resetImportState}
      />

      <CsvImportErrorMessage message={errorMessage} />

      <CsvImportPreviewTable
        categories={categories}
        mappedCategoryId={mappedCategoryId}
        mappedMemberId={mappedMemberId}
        members={members}
        onRowMappingChange={updateOverride}
        onRowRemovedChange={setRowRemoved}
        removedCsvRows={removedCsvRows}
        rows={rows}
        summary={{
          duplicateCount,
          importableCount,
          needsAttentionCount,
          removedCount: removedCsvRows.length,
        }}
      />

      <div className="flex justify-end">
        <Button disabled={!canImport} onClick={handleImport} type="button">
          匯入
        </Button>
      </div>
    </div>
  );
}

function previewErrorMessage(result: {
  message?: string;
  ok: false;
}): string {
  return result.message ?? "CSV 預覽失敗。";
}

function upsertOverride(
  currentOverrides: LedgerImportRowOverride[],
  csvRowNumber: number,
  field: "memberId" | "categoryId",
  value: string,
): LedgerImportRowOverride[] {
  const existing = currentOverrides.find(
    (override) => override.csvRowNumber === csvRowNumber,
  );
  const next = {
    ...(existing ?? { csvRowNumber }),
    [field]: value,
  };

  return [
    ...currentOverrides.filter(
      (override) => override.csvRowNumber !== csvRowNumber,
    ),
    next,
  ];
}
