export const LEDGER_IMPORT_TEMPLATE_HEADER = [
  "type",
  "date",
  "name",
  "amount",
  "member",
  "category",
  "note",
] as const;

export const LEDGER_IMPORT_TEMPLATE_FILE_NAME =
  "home-fund-ledger-import-template.csv";

export const LEDGER_IMPORT_TEMPLATE_ROWS = [
  LEDGER_IMPORT_TEMPLATE_HEADER.join(","),
  "income,2026-06-05,生活費,36000,阿明,生活收入,",
  "fund_expense,2026-06-08,家庭採買,1280,家庭基金,日用品,",
  "member_expense,2026-06-12,晚餐,760,小美,餐飲,",
] as const;

export function buildLedgerImportTemplateCsv(): string {
  return `${LEDGER_IMPORT_TEMPLATE_ROWS.join("\n")}\n`;
}
