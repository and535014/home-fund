import { createHash } from "node:crypto";
import { isBlockingImportIssueCode } from "./ledger-import-issues";
import type { CreateLedgerRecordCommand, LedgerRecordType } from "./ledger-records";

export const LEDGER_IMPORT_HEADER = [
  "type",
  "date",
  "name",
  "amount",
  "member",
  "category",
  "note",
] as const;

export type LedgerImportRowType =
  | "income"
  | "fund_expense"
  | "member_expense";

export type LedgerImportMember = {
  id: string;
  displayName: string;
};

export type LedgerImportCategory = {
  id: string;
  type: LedgerRecordType;
  name: string;
  status: "active" | "archived";
};

export type LedgerImportExistingRecord = {
  type: "income" | "expense";
  name: string;
  amountCents: number;
  occurredOn: string;
  categoryId: string;
  sourceMemberId?: string | null;
  paymentSource?: "fund" | "member" | null;
  payerMemberId?: string | null;
  note?: string | null;
};

export type LedgerImportIssueCode =
  | "unsupported_type"
  | "missing_name"
  | "invalid_amount"
  | "invalid_date"
  | "member_not_found"
  | "member_ambiguous"
  | "category_not_found"
  | "category_ambiguous"
  | "category_type_mismatch"
  | "fund_member_invalid"
  | "duplicate_in_file"
  | "duplicate_existing";

export type LedgerImportIssue = {
  code: LedgerImportIssueCode;
  message: string;
};

export type LedgerImportPreviewRow = {
  clientRowId: string;
  csvRowNumber: number;
  raw: Record<(typeof LEDGER_IMPORT_HEADER)[number], string>;
  mappedCategoryId?: string;
  mappedMemberId?: string;
  command?: CreateLedgerRecordCommand;
  rowFingerprint?: string;
  status: "valid" | "needs_attention";
  issues: LedgerImportIssue[];
};

export type LedgerImportPreviewResult =
  | {
      ok: true;
      rows: LedgerImportPreviewRow[];
      summary: {
        duplicateCount: number;
        importableCount: number;
        needsAttentionCount: number;
        removedCount: number;
      };
    }
  | {
      ok: false;
      reason: "invalid_header" | "empty_file" | "parse_failed";
      message: string;
    };

export type PreviewLedgerImportCsvContext = {
  members: LedgerImportMember[];
  categories: LedgerImportCategory[];
  existingRecords?: LedgerImportExistingRecord[];
  overrides?: LedgerImportRowOverride[];
};

export type LedgerImportRowOverride = {
  csvRowNumber: number;
  memberId?: string;
  categoryId?: string;
};

type CsvCellMap = Record<(typeof LEDGER_IMPORT_HEADER)[number], string>;
type CsvParseResult =
  | {
      ok: true;
      rows: string[][];
    }
  | Extract<LedgerImportPreviewResult, { ok: false }>;

const approvedHeader = LEDGER_IMPORT_HEADER.join(",");

export function previewLedgerImportCsv(
  csv: string,
  context: PreviewLedgerImportCsvContext,
): LedgerImportPreviewResult {
  const parsed = parseCsv(csv);

  if (!parsed.ok) {
    return parsed;
  }

  const [header, ...records] = parsed.rows;

  if (!header || records.length === 0) {
    return {
      ok: false,
      reason: "empty_file",
      message: "CSV 檔案沒有可匯入的資料列。",
    };
  }

  const normalizedHeader = header.map((cell, index) =>
    index === 0 ? cell.replace(/^\uFEFF/u, "").trim() : cell.trim(),
  );

  if (normalizedHeader.join(",") !== approvedHeader) {
    return {
      ok: false,
      reason: "invalid_header",
      message: `CSV 欄位必須是 ${approvedHeader}。`,
    };
  }

  const rows = records
    .filter((record) => record.some((cell) => cell.trim() !== ""))
    .map((record, index) =>
      previewRow(toCellMap(record), index + 2, context),
    );
  markDuplicateRows(rows);

  const importableCount = rows.filter((row) => row.status === "valid").length;
  const duplicateCount = rows.filter(hasDuplicateIssue).length;
  const needsAttentionCount = rows.filter(
    (row) => row.status === "needs_attention",
  ).length;

  return {
    ok: true,
    rows,
    summary: {
      duplicateCount,
      importableCount,
      needsAttentionCount,
      removedCount: 0,
    },
  };
}

export function rowFingerprint(
  command: CreateLedgerRecordCommand,
  note?: string,
): string {
  const memberOrFund =
    command.type === "income"
      ? command.sourceMemberId
      : command.paymentSource === "fund"
        ? "家庭基金"
        : command.payerMemberId;
  const canonical = [
    command.type,
    command.type === "expense" ? command.paymentSource : "income",
    command.occurredOn,
    normalizeText(command.name),
    command.amountCents,
    command.categoryId,
    memberOrFund ?? "",
    normalizeText(note ?? command.note ?? ""),
  ].join("|");

  return createHash("sha256").update(canonical).digest("hex");
}

function previewRow(
  raw: CsvCellMap,
  csvRowNumber: number,
  context: PreviewLedgerImportCsvContext,
): LedgerImportPreviewRow {
  const issues: LedgerImportIssue[] = [];
  const type = normalizeText(raw.type);
  const name = normalizeText(raw.name);
  const amountCents = parseAmountCents(raw.amount);
  const occurredOn = normalizeText(raw.date);
  const note = normalizeText(raw.note);
  const requiredCategoryType = categoryTypeFor(type);
  const override = context.overrides?.find(
    (candidate) => candidate.csvRowNumber === csvRowNumber,
  );
  const memberMatch = matchMember(raw.member, type, context.members, override);
  const categoryMatch = requiredCategoryType
    ? matchCategory(raw.category, requiredCategoryType, context.categories)
    : { id: undefined, issues: [] };
  const overriddenCategoryMatch = applyCategoryOverride(
    categoryMatch,
    requiredCategoryType,
    context.categories,
    override,
  );

  if (!isLedgerImportRowType(type)) {
    issues.push({
      code: "unsupported_type",
      message: "匯入類型不支援。",
    });
  }

  if (!name) {
    issues.push({
      code: "missing_name",
      message: "內容不可空白。",
    });
  }

  if (amountCents === null) {
    issues.push({
      code: "invalid_amount",
      message: "金額必須大於 0。",
    });
  }

  if (!isIsoDate(occurredOn)) {
    issues.push({
      code: "invalid_date",
      message: "日期必須是 YYYY-MM-DD。",
    });
  }

  issues.push(...memberMatch.issues, ...overriddenCategoryMatch.issues);

  let command: CreateLedgerRecordCommand | undefined;

  if (
    issues.length === 0 &&
    amountCents !== null &&
    requiredCategoryType &&
    overriddenCategoryMatch.id
  ) {
    command = toCommand({
      type: type as LedgerImportRowType,
      name,
      amountCents,
      occurredOn,
      categoryId: overriddenCategoryMatch.id,
      memberId: memberMatch.id,
      note,
    });
  }

  const fingerprint = command ? rowFingerprint(command, note) : undefined;

  if (
    fingerprint &&
    context.existingRecords?.some(
      (record) => existingRecordFingerprint(record) === fingerprint,
    )
  ) {
    issues.push({
      code: "duplicate_existing",
      message: "這列可能和既有紀錄重複。",
    });
  }

  return {
    clientRowId: fingerprint
      ? `${csvRowNumber}-${fingerprint.slice(0, 12)}`
      : `${csvRowNumber}-invalid`,
    csvRowNumber,
    raw,
    mappedCategoryId: overriddenCategoryMatch.id,
    mappedMemberId: memberMatch.id,
    command,
    rowFingerprint: fingerprint,
    status: issues.some((issue) => isBlockingImportIssueCode(issue.code))
      ? "needs_attention"
      : "valid",
    issues,
  };
}

function markDuplicateRows(rows: LedgerImportPreviewRow[]) {
  const counts = new Map<string, number>();

  for (const row of rows) {
    if (row.rowFingerprint) {
      counts.set(row.rowFingerprint, (counts.get(row.rowFingerprint) ?? 0) + 1);
    }
  }

  for (const row of rows) {
    if (row.rowFingerprint && (counts.get(row.rowFingerprint) ?? 0) > 1) {
      row.issues.push({
        code: "duplicate_in_file",
        message: "這列和同一份 CSV 的其他列重複。",
      });
    }
  }
}

function hasDuplicateIssue(row: LedgerImportPreviewRow): boolean {
  return row.issues.some(
    (issue) =>
      issue.code === "duplicate_in_file" ||
      issue.code === "duplicate_existing",
  );
}

function toCommand(input: {
  type: LedgerImportRowType;
  name: string;
  amountCents: number;
  occurredOn: string;
  categoryId: string;
  memberId?: string;
  note?: string;
}): CreateLedgerRecordCommand {
  if (input.type === "income") {
    return {
      type: "income",
      name: input.name,
      amountCents: input.amountCents,
      occurredOn: input.occurredOn,
      categoryId: input.categoryId,
      sourceMemberId: input.memberId ?? "",
      ...(input.note ? { note: input.note } : {}),
    };
  }

  if (input.type === "fund_expense") {
    return {
      type: "expense",
      name: input.name,
      amountCents: input.amountCents,
      occurredOn: input.occurredOn,
      categoryId: input.categoryId,
      paymentSource: "fund",
      ...(input.note ? { note: input.note } : {}),
    };
  }

  return {
    type: "expense",
    name: input.name,
    amountCents: input.amountCents,
    occurredOn: input.occurredOn,
    categoryId: input.categoryId,
    paymentSource: "member",
    payerMemberId: input.memberId,
    ...(input.note ? { note: input.note } : {}),
  };
}

function matchMember(
  value: string,
  type: string,
  members: LedgerImportMember[],
  override?: LedgerImportRowOverride,
): { id?: string; issues: LedgerImportIssue[] } {
  if (override?.memberId && type !== "fund_expense") {
    const member = members.find((candidate) => candidate.id === override.memberId);

    return member
      ? { id: member.id, issues: [] }
      : {
          issues: [{
            code: "member_not_found",
            message: "找不到對應成員。",
          }],
        };
  }

  const name = normalizeText(value);

  if (type === "fund_expense") {
    if (!name || name === "家庭基金") {
      return { issues: [] };
    }

    return {
      issues: [{
        code: "fund_member_invalid",
        message: "基金支出的成員欄位必須空白或填家庭基金。",
      }],
    };
  }

  const matches = members.filter((member) => member.displayName.trim() === name);

  if (matches.length === 1) {
    return { id: matches[0].id, issues: [] };
  }

  return {
    issues: [{
      code: matches.length === 0 ? "member_not_found" : "member_ambiguous",
      message: matches.length === 0 ? "找不到對應成員。" : "成員名稱不唯一。",
    }],
  };
}

function applyCategoryOverride(
  categoryMatch: { id?: string; issues: LedgerImportIssue[] },
  type: LedgerRecordType | undefined,
  categories: LedgerImportCategory[],
  override?: LedgerImportRowOverride,
): { id?: string; issues: LedgerImportIssue[] } {
  if (!override?.categoryId) {
    return categoryMatch;
  }

  const category = categories.find(
    (candidate) => candidate.id === override.categoryId && candidate.status === "active",
  );

  if (!category) {
    return {
      issues: [{
        code: "category_not_found",
        message: "找不到對應分類。",
      }],
    };
  }

  if (category.type !== type) {
    return {
      issues: [{
        code: "category_type_mismatch",
        message: "分類類型與紀錄類型不一致。",
      }],
    };
  }

  return { id: category.id, issues: [] };
}

function matchCategory(
  value: string,
  type: LedgerRecordType,
  categories: LedgerImportCategory[],
): { id?: string; issues: LedgerImportIssue[] } {
  const name = normalizeText(value);
  const nameMatches = categories.filter(
    (category) => category.name.trim() === name && category.status === "active",
  );
  const typeMatches = nameMatches.filter((category) => category.type === type);

  if (typeMatches.length === 1) {
    return { id: typeMatches[0].id, issues: [] };
  }

  if (typeMatches.length > 1) {
    return {
      issues: [{
        code: "category_ambiguous",
        message: "分類名稱不唯一。",
      }],
    };
  }

  if (nameMatches.length > 0) {
    return {
      issues: [{
        code: "category_type_mismatch",
        message: "分類類型與紀錄類型不一致。",
      }],
    };
  }

  return {
    issues: [{
      code: "category_not_found",
      message: "找不到對應分類。",
    }],
  };
}

function existingRecordFingerprint(record: LedgerImportExistingRecord): string {
  const command: CreateLedgerRecordCommand =
    record.type === "income"
      ? {
          type: "income",
          name: record.name,
          amountCents: record.amountCents,
          occurredOn: record.occurredOn,
          categoryId: record.categoryId,
          sourceMemberId: record.sourceMemberId ?? "",
          ...(record.note ? { note: record.note } : {}),
        }
      : {
          type: "expense",
          name: record.name,
          amountCents: record.amountCents,
          occurredOn: record.occurredOn,
          categoryId: record.categoryId,
          paymentSource: record.paymentSource ?? "fund",
          ...(record.payerMemberId ? { payerMemberId: record.payerMemberId } : {}),
          ...(record.note ? { note: record.note } : {}),
        };

  return rowFingerprint(command, record.note ?? undefined);
}

function categoryTypeFor(type: string): LedgerRecordType | undefined {
  if (type === "income") {
    return "income";
  }

  if (type === "fund_expense" || type === "member_expense") {
    return "expense";
  }

  return undefined;
}

function isLedgerImportRowType(value: string): value is LedgerImportRowType {
  return value === "income" || value === "fund_expense" || value === "member_expense";
}

function parseAmountCents(value: string): number | null {
  const normalized = normalizeText(value);

  if (!/^\d+(\.\d{1,2})?$/u.test(normalized)) {
    return null;
  }

  const [dollars, cents = ""] = normalized.split(".");
  const amountCents = Number(dollars) * 100 + Number(cents.padEnd(2, "0"));

  return amountCents > 0 && Number.isSafeInteger(amountCents)
    ? amountCents
    : null;
}

function isIsoDate(value: string): boolean {
  const match = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/u.exec(value);

  if (!match?.groups) {
    return false;
  }

  const year = Number(match.groups.year);
  const month = Number(match.groups.month);
  const day = Number(match.groups.day);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function toCellMap(record: string[]): CsvCellMap {
  return LEDGER_IMPORT_HEADER.reduce((cells, header, index) => {
    cells[header] = normalizeText(record[index] ?? "");
    return cells;
  }, {} as CsvCellMap);
}

function parseCsv(csv: string): CsvParseResult {
  try {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = "";
    let quoted = false;

    for (let index = 0; index < csv.length; index += 1) {
      const char = csv[index];
      const next = csv[index + 1];

      if (char === "\"") {
        if (quoted && next === "\"") {
          cell += "\"";
          index += 1;
        } else {
          quoted = !quoted;
        }
        continue;
      }

      if (char === "," && !quoted) {
        row.push(cell);
        cell = "";
        continue;
      }

      if ((char === "\n" || char === "\r") && !quoted) {
        if (char === "\r" && next === "\n") {
          index += 1;
        }
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
        continue;
      }

      cell += char;
    }

    row.push(cell);
    rows.push(row);

    return { ok: true, rows };
  } catch {
    return {
      ok: false,
      reason: "parse_failed",
      message: "CSV 解析失敗，請確認檔案格式。",
    };
  }
}

function normalizeText(value: string): string {
  return value.trim();
}
