"use client";

import {
  Download,
  FileText,
  FileUp,
  RotateCcw,
  Trash2,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
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
import { cn } from "@/lib/utils";

type ImportRow = {
  amount: string;
  category: string;
  date: string;
  detail: string;
  issue?: string;
  member: string;
  removed: boolean;
  rowNumber: number;
  status: "valid" | "invalid";
  type: string;
};

const memberOptions = ["阿明", "小美", "媽媽", "爸爸"];
const categoryOptions = ["生活收入", "日用品", "餐飲", "交通", "其他"];

const templateFileName = "home-fund-ledger-import-template.csv";
const importFileName = "ledger-2026-06.csv";
const templateCsv = [
  "type,date,name,amount,member,category,note",
  "income,2026-06-05,生活費,36000,阿明,生活收入,",
  "fund_expense,2026-06-08,家庭採買,1280,家庭基金,日用品,",
  "member_expense,2026-06-12,晚餐,760,小美,餐飲,",
];

const seedRows: ImportRow[] = [
  {
    amount: "$36,000",
    category: "生活收入",
    date: "2026-06-05",
    detail: "生活費",
    member: "阿明",
    removed: false,
    rowNumber: 2,
    status: "valid",
    type: "收入",
  },
  {
    amount: "$1,280",
    category: "日用品",
    date: "2026-06-08",
    detail: "家庭採買",
    member: "家庭基金",
    removed: false,
    rowNumber: 3,
    status: "valid",
    type: "基金支出",
  },
  {
    amount: "$760",
    category: "餐飲",
    date: "2026-06-12",
    detail: "晚餐",
    member: "小美",
    removed: false,
    rowNumber: 4,
    status: "valid",
    type: "成員支出",
  },
];

export function CsvImportPrototype() {
  const [fileName, setFileName] = useState<string | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);

  const activeRows = rows.filter((row) => !row.removed);
  const removedRows = rows.filter((row) => row.removed);
  const invalidCount = activeRows.filter((row) => row.status === "invalid").length;
  const canImport = previewVisible && activeRows.length > 0 && invalidCount === 0;

  const summary = useMemo(
    () => [
      { label: "匯入列", value: `${activeRows.length} 列` },
      { label: "已移除", value: `${removedRows.length} 列` },
      { label: "需處理", value: `${invalidCount} 列` },
    ],
    [activeRows.length, invalidCount, removedRows.length],
  );

  function resetImportState() {
    setFileName(null);
    setRows([]);
    setPreviewVisible(false);
  }

  function handleFileSelected(file: File | undefined) {
    setFileName(file?.name ?? importFileName);
    setRows(seedRows.map((row) => ({ ...row })));
    setPreviewVisible(true);
  }

  function updateRow(
    rowNumber: number,
    field: "member" | "category",
    value: string,
  ) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.rowNumber === rowNumber ? { ...row, [field]: value } : row,
      ),
    );
  }

  function setRowRemoved(rowNumber: number, removed: boolean) {
    setRows((currentRows) =>
      currentRows.map((row) =>
        row.rowNumber === rowNumber ? { ...row, removed } : row,
      ),
    );
  }

  function handleImport() {
    toast.success("匯入完成", {
      description: `收支紀錄 ${activeRows.length} 列`,
      id: "csv-import-prototype-success",
    });
    resetImportState();
  }

  function downloadTemplate() {
    const csv = `${templateCsv.join("\n")}\n`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = templateFileName;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex min-h-[28rem] flex-col gap-4">
      {!previewVisible ? (
        <div className="grid min-h-[22rem] place-items-center rounded-card border border-dashed border-border bg-card px-4 text-card-foreground">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="min-w-44" size="lg">
              <label>
                <FileUp aria-hidden="true" />
                匯入收支紀錄
                <Input
                  accept=".csv,text/csv"
                  className="sr-only"
                  onChange={(event) =>
                    handleFileSelected(event.target.files?.[0])
                  }
                  type="file"
                />
              </label>
            </Button>
            <Button
              className="min-w-44"
              onClick={downloadTemplate}
              size="lg"
              variant="outline"
            >
              <Download aria-hidden="true" />
              下載範本
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
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
                  size="icon-sm"
                  variant="destructive"
                  onClick={() => resetImportState()}
                >
                  <Trash2 aria-hidden="true" />
                </Button>
                <Button asChild size="icon-sm" variant="secondary">
                  <label aria-label="更換匯入檔案">
                    <Upload aria-hidden="true" />
                    <Input
                      accept=".csv,text/csv"
                      className="sr-only"
                      onChange={(event) =>
                        handleFileSelected(event.target.files?.[0])
                      }
                      type="file"
                    />
                  </label>
                </Button>
              </ItemActions>
            </Item>
          </section>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>CSV 列</TableHead>
                <TableHead>類型</TableHead>
                <TableHead>日期</TableHead>
                <TableHead>內容</TableHead>
                <TableHead>金額</TableHead>
                <TableHead className="min-w-36">成員對照</TableHead>
                <TableHead className="min-w-36">分類對照</TableHead>
                <TableHead>狀態</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  className={cn(row.removed && "bg-muted text-muted-foreground")}
                  key={row.rowNumber}
                >
                  <TableCell>{row.rowNumber}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell className="min-w-[12rem] whitespace-normal">
                    <div
                      className={cn(
                        "text-body-strong",
                        row.removed ? "text-muted-foreground" : "text-foreground",
                      )}
                    >
                      {row.detail}
                    </div>
                    {row.issue && !row.removed ? (
                      <div className="mt-1 text-caption text-warning">
                        {row.issue}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>{row.amount}</TableCell>
                  <TableCell className="min-w-36">
                    <NativeSelect
                      aria-label={`第 ${row.rowNumber} 列成員對照`}
                      disabled={row.removed}
                      onChange={(event) =>
                        updateRow(row.rowNumber, "member", event.target.value)
                      }
                      value={row.member}
                    >
                      {memberOptions.map((member) => (
                        <option key={member} value={member}>
                          {member}
                        </option>
                      ))}
                    </NativeSelect>
                  </TableCell>
                  <TableCell className="min-w-36">
                    <NativeSelect
                      aria-label={`第 ${row.rowNumber} 列分類對照`}
                      disabled={row.removed}
                      onChange={(event) =>
                        updateRow(
                          row.rowNumber,
                          "category",
                          event.target.value,
                        )
                      }
                      value={row.category}
                    >
                      {categoryOptions.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </NativeSelect>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        row.removed
                          ? "outline"
                          : row.status === "valid"
                            ? "default"
                            : "outline"
                      }
                      className={
                        row.status === "invalid" && !row.removed
                          ? "border-warning text-warning"
                          : undefined
                      }
                    >
                      {row.removed
                        ? "已移除"
                        : row.status === "valid"
                          ? "可匯入"
                          : "需處理"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {row.removed ? (
                      <Button
                        aria-label={`加回第 ${row.rowNumber} 列`}
                        size="icon-sm"
                        variant="secondary"
                        onClick={() => setRowRemoved(row.rowNumber, false)}
                      >
                        <RotateCcw aria-hidden="true" />
                      </Button>
                    ) : (
                      <Button
                        aria-label={`移除第 ${row.rowNumber} 列`}
                        size="icon-sm"
                        variant="destructive"
                        onClick={() => setRowRemoved(row.rowNumber, true)}
                      >
                        <Trash2 aria-hidden="true" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={9}>
                  <div className="flex flex-wrap gap-x-6 gap-y-2">
                    {summary.map((item) => (
                      <span className="text-label" key={item.label}>
                        <span className="text-muted-foreground">
                          {item.label}
                        </span>
                        <span className="ml-2 text-foreground">
                          {item.value}
                        </span>
                      </span>
                    ))}
                  </div>
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>

          <div className="flex justify-end">
            <Button disabled={!canImport} onClick={handleImport}>
              匯入
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
