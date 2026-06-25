import type { LedgerImportIssueCode } from "./ledger-import";

export type LedgerImportIssueLike = {
  code: LedgerImportIssueCode;
};

export function hasBlockingImportIssue(row: {
  issues: LedgerImportIssueLike[];
}): boolean {
  return row.issues.some((issue) => isBlockingImportIssueCode(issue.code));
}

export function isBlockingImportIssueCode(code: LedgerImportIssueCode): boolean {
  return code !== "duplicate_in_file" && code !== "duplicate_existing";
}
