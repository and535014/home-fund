"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Download,
  FileText,
  FileUp,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAmountFromMajor } from "@/lib/format";
import { cn } from "@/lib/utils";
import { hasBlockingImportIssue } from "@/modules/fund-ledger/ledger-import-issues";
import type { LedgerImportPreviewRow } from "@/modules/fund-ledger/ledger-import";

export type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
};

export type MemberOption = {
  id: string;
  displayName: string;
};

type ImportSummary = {
  duplicateCount: number;
  importableCount: number;
  needsAttentionCount: number;
  removedCount: number;
};

type SortKey = "csvRowNumber" | "type" | "date" | "amount" | "status";
type SortDirection = "asc" | "desc";

type PreviewTableSort = {
  direction: SortDirection;
  key: SortKey;
} | null;

export function CsvImportEmptyState({
  errorMessage,
  isPending,
  onDownloadTemplate,
  onFileSelected,
}: {
  errorMessage: string | null;
  isPending: boolean;
  onDownloadTemplate: () => void;
  onFileSelected: (file: File | undefined) => void;
}) {
  return (
    <div className="flex min-h-112 flex-col gap-4">
      <div className="grid min-h-88 place-items-center rounded-card border border-dashed border-border bg-card px-4 text-card-foreground">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild className="min-w-44" disabled={isPending} size="lg">
            <label>
              <FileUp aria-hidden="true" />
              匯入收支紀錄
              <Input
                accept=".csv,text/csv"
                className="sr-only"
                disabled={isPending}
                onChange={(event) => onFileSelected(event.target.files?.[0])}
                type="file"
              />
            </label>
          </Button>
          <Button
            className="min-w-44"
            onClick={onDownloadTemplate}
            size="lg"
            type="button"
            variant="outline"
          >
            <Download aria-hidden="true" />
            下載範本
          </Button>
        </div>
      </div>
      <CsvImportErrorMessage message={errorMessage} />
    </div>
  );
}

export function SelectedImportFileItem({
  fileName,
  isPending = false,
  onFileSelected,
  onRemove,
}: {
  fileName: string;
  isPending?: boolean;
  onFileSelected: (file: File | undefined) => void;
  onRemove: () => void;
}) {
  return (
    <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Item className="w-full sm:w-fit sm:max-w-full" size="sm" variant="outline">
        <ItemMedia>
          <FileText aria-hidden="true" className="size-5 text-primary" />
        </ItemMedia>
        <ItemContent className="min-w-0">
          <ItemTitle className="max-w-full">
            <span className="truncate">{fileName}</span>
          </ItemTitle>
        </ItemContent>
        <ItemActions>
          <Button
            aria-label="移除匯入檔案"
            disabled={isPending}
            onClick={onRemove}
            size="icon-sm"
            type="button"
            variant="destructive"
          >
            <Trash2 aria-hidden="true" />
          </Button>
          <Button asChild size="icon-sm" variant="secondary">
            <label aria-label="更換匯入檔案">
              <Upload aria-hidden="true" />
              <Input
                accept=".csv,text/csv"
                className="sr-only"
                disabled={isPending}
                onChange={(event) => onFileSelected(event.target.files?.[0])}
                type="file"
              />
            </label>
          </Button>
        </ItemActions>
      </Item>
    </section>
  );
}

export function CsvImportErrorMessage({ message }: { message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <p className="text-body text-warning" role="alert">
      {message}
    </p>
  );
}

export function CsvImportPreviewTable({
  categories,
  isPending = false,
  mappedCategoryId,
  mappedMemberId,
  members,
  onRowMappingChange,
  onRowRemovedChange,
  removedCsvRows,
  rows,
  summary,
}: {
  categories: CategoryOption[];
  isPending?: boolean;
  mappedCategoryId: (row: LedgerImportPreviewRow) => string;
  mappedMemberId: (row: LedgerImportPreviewRow) => string;
  members: MemberOption[];
  onRowMappingChange: (
    csvRowNumber: number,
    field: "memberId" | "categoryId",
    value: string,
  ) => void;
  onRowRemovedChange: (csvRowNumber: number, removed: boolean) => void;
  removedCsvRows: number[];
  rows: LedgerImportPreviewRow[];
  summary: ImportSummary;
}) {
  const [sort, setSort] = useState<PreviewTableSort>(null);
  const removedRowSet = useMemo(
    () => new Set(removedCsvRows),
    [removedCsvRows],
  );
  const sortedRows = useMemo(() => {
    if (!sort) {
      return rows;
    }

    return [...rows].sort((left, right) => {
      const comparison = comparePreviewRows(left, right, sort.key, removedRowSet);

      if (comparison !== 0) {
        return sort.direction === "asc" ? comparison : -comparison;
      }

      return left.csvRowNumber - right.csvRowNumber;
    });
  }, [removedRowSet, rows, sort]);
  const toggleSort = (key: SortKey) => {
    setSort((currentSort) => {
      if (currentSort?.key !== key) {
        return { key, direction: "asc" };
      }

      return {
        key,
        direction: currentSort.direction === "asc" ? "desc" : "asc",
      };
    });
  };

  return (
    <Table containerClassName="min-h-0 flex-1 overflow-auto">
      <TableHeader className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background">
        <TableRow>
          <SortableTableHead
            disabled={isPending}
            label="CSV 列"
            onSort={() => toggleSort("csvRowNumber")}
            sort={sort?.key === "csvRowNumber" ? sort : null}
          />
          <SortableTableHead
            disabled={isPending}
            label="類型"
            onSort={() => toggleSort("type")}
            sort={sort?.key === "type" ? sort : null}
          />
          <SortableTableHead
            disabled={isPending}
            label="日期"
            onSort={() => toggleSort("date")}
            sort={sort?.key === "date" ? sort : null}
          />
          <TableHead>內容</TableHead>
          <SortableTableHead
            disabled={isPending}
            label="金額"
            onSort={() => toggleSort("amount")}
            sort={sort?.key === "amount" ? sort : null}
          />
          <TableHead className="min-w-36">成員對照</TableHead>
          <TableHead className="min-w-36">分類對照</TableHead>
          <SortableTableHead
            disabled={isPending}
            label="狀態"
            onSort={() => toggleSort("status")}
            sort={sort?.key === "status" ? sort : null}
          />
          <TableHead>操作</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedRows.map((row) => {
          const removed = removedRowSet.has(row.csvRowNumber);
          const rowNeedsAttention =
            !removed && hasBlockingIssue(row);
          const categoryType = row.raw.type === "income" ? "income" : "expense";

          return (
            <TableRow
              className={cn(removed && "bg-muted text-muted-foreground")}
              key={row.clientRowId}
            >
              <TableCell>{row.csvRowNumber}</TableCell>
              <TableCell>{typeLabel(row.raw.type)}</TableCell>
              <TableCell>{row.raw.date}</TableCell>
              <TableCell className="min-w-48 whitespace-normal">
                <div
                  className={cn(
                    "text-body-strong",
                    removed ? "text-muted-foreground" : "text-foreground",
                  )}
                >
                  {row.raw.name}
                </div>
                {rowNeedsAttention ? (
                  <div className="mt-1 text-caption text-warning">
                    {row.issues.map((issue) => issue.message).join(" ")}
                  </div>
                ) : null}
              </TableCell>
              <TableCell>{formatCsvAmount(row.raw.amount)}</TableCell>
              <TableCell className="min-w-36">
                <NativeSelect
                  aria-label={`第 ${row.csvRowNumber} 列成員對照`}
                  disabled={isPending || removed || row.raw.type === "fund_expense"}
                  onChange={(event) =>
                    onRowMappingChange(
                      row.csvRowNumber,
                      "memberId",
                      event.target.value,
                    )
                  }
                  value={
                    row.raw.type === "fund_expense"
                      ? "家庭基金"
                      : mappedMemberId(row)
                  }
                >
                  {row.raw.type === "fund_expense" ? (
                    <option value="家庭基金">家庭基金</option>
                  ) : (
                    <>
                      <option disabled value="">未選擇</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.displayName}
                        </option>
                      ))}
                    </>
                  )}
                </NativeSelect>
              </TableCell>
              <TableCell className="min-w-36">
                <NativeSelect
                  aria-label={`第 ${row.csvRowNumber} 列分類對照`}
                  disabled={isPending || removed}
                  onChange={(event) =>
                    onRowMappingChange(
                      row.csvRowNumber,
                      "categoryId",
                      event.target.value,
                    )
                  }
                  value={mappedCategoryId(row)}
                >
                  <option disabled value="">未選擇</option>
                  {categories
                    .filter((category) => category.type === categoryType)
                    .map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                </NativeSelect>
              </TableCell>
              <TableCell>
                <Badge
                  className={
                    rowNeedsAttention ? "border-warning text-warning" : undefined
                  }
                  variant={removed ? "outline" : rowNeedsAttention ? "outline" : "default"}
                >
                  {removed ? "已移除" : rowNeedsAttention ? "需處理" : "可匯入"}
                </Badge>
              </TableCell>
              <TableCell>
                {removed ? (
                  <Button
                    aria-label={`加回第 ${row.csvRowNumber} 列`}
                    disabled={isPending}
                    onClick={() => onRowRemovedChange(row.csvRowNumber, false)}
                    size="icon-sm"
                    type="button"
                    variant="secondary"
                  >
                    <RotateCcw aria-hidden="true" />
                  </Button>
                ) : (
                  <Button
                    aria-label={`移除第 ${row.csvRowNumber} 列`}
                    disabled={isPending}
                    onClick={() => onRowRemovedChange(row.csvRowNumber, true)}
                    size="icon-sm"
                    type="button"
                    variant="destructive"
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
      <CsvImportTableFooter summary={summary} />
    </Table>
  );
}

function SortableTableHead({
  disabled = false,
  label,
  onSort,
  sort,
}: {
  disabled?: boolean;
  label: string;
  onSort: () => void;
  sort: PreviewTableSort;
}) {
  const SortIcon =
    sort?.direction === "asc"
      ? ArrowUp
      : sort?.direction === "desc"
        ? ArrowDown
        : ArrowUpDown;
  const directionLabel =
    sort?.direction === "asc"
      ? "遞增"
      : sort?.direction === "desc"
        ? "遞減"
        : "";

  return (
    <TableHead>
      <div className="flex items-center gap-1">
        <span>{label}</span>
        <Button
          aria-label={`依${label}${directionLabel ? `切換${directionLabel}排序` : "排序"}`}
          className="text-muted-foreground hover:text-foreground"
          disabled={disabled}
          onClick={onSort}
          size="icon-xs"
          type="button"
          variant="ghost"
        >
          <SortIcon aria-hidden="true" />
        </Button>
      </div>
    </TableHead>
  );
}

function comparePreviewRows(
  left: LedgerImportPreviewRow,
  right: LedgerImportPreviewRow,
  key: SortKey,
  removedRows: Set<number>,
): number {
  switch (key) {
    case "csvRowNumber":
      return left.csvRowNumber - right.csvRowNumber;
    case "type":
      return typeLabel(left.raw.type).localeCompare(typeLabel(right.raw.type), "zh-Hant");
    case "date":
      return left.raw.date.localeCompare(right.raw.date);
    case "amount":
      return compareNumericStrings(left.raw.amount, right.raw.amount);
    case "status":
      return (
        rowStatusRank(left, removedRows) - rowStatusRank(right, removedRows)
      );
  }
}

function compareNumericStrings(left: string, right: string): number {
  const leftNumber = Number(left);
  const rightNumber = Number(right);

  if (Number.isFinite(leftNumber) && Number.isFinite(rightNumber)) {
    return leftNumber - rightNumber;
  }

  if (Number.isFinite(leftNumber)) {
    return -1;
  }

  if (Number.isFinite(rightNumber)) {
    return 1;
  }

  return left.localeCompare(right);
}

function rowStatusRank(
  row: LedgerImportPreviewRow,
  removedRows: Set<number>,
): number {
  if (removedRows.has(row.csvRowNumber)) {
    return 2;
  }

  if (hasBlockingIssue(row)) {
    return 0;
  }

  return 1;
}

export function hasBlockingIssue(row: LedgerImportPreviewRow): boolean {
  return hasBlockingImportIssue(row);
}

export function hasDuplicateWarning(
  row: LedgerImportPreviewRow,
  activeDuplicateCounts: Map<string, number>,
): boolean {
  return row.issues.some((issue) => {
    if (issue.code === "duplicate_existing") {
      return true;
    }

    if (issue.code === "duplicate_in_file" && row.rowFingerprint) {
      return (activeDuplicateCounts.get(row.rowFingerprint) ?? 0) > 1;
    }

    return false;
  });
}

function CsvImportTableFooter({ summary }: { summary: ImportSummary }) {
  return (
    <TableFooter className="[&_td]:sticky [&_td]:bottom-0 [&_td]:z-10 [&_td]:bg-card">
      <TableRow>
        <TableCell colSpan={9}>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <span className="text-label">
              <span className="text-muted-foreground">匯入列</span>
              <span className="ml-2 text-foreground">
                {summary.importableCount} 列
              </span>
            </span>
            <span className="text-label">
              <span className="text-muted-foreground">已移除</span>
              <span className="ml-2 text-foreground">
                {summary.removedCount} 列
              </span>
            </span>
            <span className="text-label">
              <span className="text-muted-foreground">需處理</span>
              <span className="ml-2 text-foreground">
                {summary.needsAttentionCount} 列
              </span>
            </span>
            <span className="text-label">
              <span className="text-muted-foreground">疑似重複</span>
              <span className="ml-2 text-foreground">
                {summary.duplicateCount} 列
              </span>
            </span>
          </div>
        </TableCell>
      </TableRow>
    </TableFooter>
  );
}

function typeLabel(type: string): string {
  const labels: Record<string, string> = {
    income: "收入",
    fund_expense: "基金支出",
    member_expense: "成員支出",
  };

  return labels[type] ?? type;
}

function formatCsvAmount(amount: string): string {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount)) {
    return amount;
  }

  return formatAmountFromMajor(numericAmount);
}
