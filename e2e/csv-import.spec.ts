import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

test.describe.configure({ mode: "serial" });

test("authorized users can open CSV import and general members cannot", async ({
  page,
}) => {
  await signInAsFinanceManager(page);
  await page.goto("/settings/import");

  await expect(page.getByRole("heading", { name: "CSV 匯入" })).toBeVisible();
  await expect(page.getByRole("link", { name: "CSV 匯入" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "匯入收支紀錄" }),
  ).toBeVisible();

  await signInAsGeneralMember(page);
  await page.goto("/settings/account");
  await expect(page.getByRole("link", { name: "CSV 匯入" })).toHaveCount(0);

  await page.goto("/settings/import");
  await expect(page).toHaveURL(/\/$/u);
  await expect(page.getByRole("heading", { name: "總覽" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "匯入收支紀錄" }),
  ).toHaveCount(0);
});

test("downloads the ledger CSV template", async ({ page }) => {
  await signInAsFinanceManager(page);
  await page.goto("/settings/import");

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "下載範本" }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe(
    "home-fund-ledger-import-template.csv",
  );
  const stream = await download.createReadStream();
  const content = await readStreamText(stream);

  expect(content.split("\n")[0]).toBe(
    "type,date,name,amount,member,category,note",
  );
  expect(content).not.toContain("payment_source");
});

test("previews, corrects, imports, and resets CSV ledger records", async ({
  page,
}) => {
  await signInAsFinanceManager(page);
  await page.goto("/settings/import");

  const fileName = "ledger-import-e2e.csv";

  await uploadCsv(page, fileName, [
    "type,date,name,amount,member,category,note",
    "income,2026-06-25,E2E CSV 收入,3210,Lin,生活費,",
    "fund_expense,2026-06-25,E2E CSV 基金支出,765,家庭基金,日用品,",
    "member_expense,2026-06-25,E2E CSV 待修正代墊,888,不存在,不存在,",
  ]);

  await expectUploadedFile(page, fileName);
  await expect(page.getByRole("button", { name: "下載範本" })).toHaveCount(0);
  await expect(page.getByRole("cell", { exact: true, name: "2" })).toBeVisible();
  await expect(page.getByRole("cell", { exact: true, name: "3" })).toBeVisible();
  await expect(page.getByRole("cell", { exact: true, name: "4" })).toBeVisible();
  await expectSummaryCount(page, "需處理", 1);
  await expect(page.getByRole("button", { exact: true, name: "匯入" })).toBeEnabled();

  await expect(page.getByLabel("第 4 列成員對照")).toHaveValue("");
  await expect(page.getByLabel("第 4 列分類對照")).toHaveValue("");
  await page.getByLabel("第 4 列成員對照").selectOption({ label: "未綁定測試成員" });
  await page.getByLabel("第 4 列分類對照").selectOption({ label: "餐飲" });
  await expectSummaryCount(page, "需處理", 0);

  await page.getByRole("button", { name: "移除第 3 列" }).click();
  await expectSummaryCount(page, "已移除", 1);
  await expect(page.getByRole("button", { name: "加回第 3 列" })).toBeVisible();
  await page.getByRole("button", { name: "加回第 3 列" }).click();
  await expectSummaryCount(page, "已移除", 0);

  await page.getByRole("button", { exact: true, name: "匯入" }).click();

  await expect(page.getByText("最終成功")).toBeVisible();
  await expect(page.getByText("成功 3 筆，失敗 0 筆，略過 0 筆")).toBeVisible();
  await expect(
    page.getByRole("button", { name: "匯入收支紀錄" }),
  ).toBeVisible();

  await page.goto("/?month=2026-06");
  await expect(page.getByText("E2E CSV 收入")).toBeVisible();
  await expect(page.getByText("E2E CSV 基金支出")).toBeVisible();
  await expect(page.getByText("E2E CSV 待修正代墊")).toBeVisible();
});

test("shows duplicate warnings without blocking import", async ({ page }) => {
  await signInAsFinanceManager(page);
  await page.goto("/settings/import");

  const fileName = "ledger-import-duplicate-e2e.csv";

  await uploadCsv(page, fileName, [
    "type,date,name,amount,member,category,note",
    "income,2026-06-10,六月生活費,80000,Kai,生活費,六月生活費",
  ]);

  await expectUploadedFile(page, fileName);
  await expectSummaryCount(page, "疑似重複", 1);
  await expectSummaryCount(page, "需處理", 0);
  await expect(page.getByText("可匯入")).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "匯入" })).toBeEnabled();
});

test("keeps the mobile CSV preview controls usable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signInAsFinanceManager(page);
  await page.goto("/settings/import");

  const fileName = "ledger-import-mobile-long-name-e2e.csv";

  await uploadCsv(page, fileName, [
    "type,date,name,amount,member,category,note",
    "income,2026-06-25,E2E 手機版非常長的收入項目名稱,1234,Lin,生活費,",
    "member_expense,2026-06-25,E2E 手機版非常長的成員支出項目名稱,5678,Mei,日用品,",
  ]);

  await expectUploadedFile(page, fileName);
  await expect(page.getByRole("button", { name: "移除匯入檔案" })).toBeVisible();
  await expect(page.getByLabel("第 2 列成員對照")).toBeVisible();
  await expect(page.getByLabel("第 2 列分類對照")).toBeVisible();
  await expect(page.getByLabel("第 3 列成員對照")).toBeVisible();
  await expect(page.getByLabel("第 3 列分類對照")).toBeVisible();
  await expect(page.getByRole("button", { exact: true, name: "匯入" })).toBeVisible();
});

async function uploadCsv(page: Page, fileName: string, lines: string[]) {
  const label = page.locator('label:has-text("匯入收支紀錄")');
  const input = label.locator('input[type="file"]');

  await expect(label).toBeVisible();
  await input.setInputFiles({
    name: fileName,
    mimeType: "text/csv",
    buffer: Buffer.from(`${lines.join("\n")}\n`, "utf8"),
  });
  await input.evaluate((element) => {
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

async function expectUploadedFile(page: Page, fileName: string) {
  await expect(page.getByText(fileName)).toBeVisible({ timeout: 15_000 });
}

async function expectSummaryCount(page: Page, label: string, count: number) {
  await expect(
    page.getByRole("cell", {
      name: new RegExp(`${label}\\s*${count} 列`, "u"),
    }),
  ).toBeVisible();
}

async function readStreamText(
  stream: NodeJS.ReadableStream | null,
): Promise<string> {
  if (!stream) {
    return "";
  }

  const chunks: Buffer[] = [];

  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  return Buffer.concat(chunks).toString("utf8");
}

async function signInAsFinanceManager(page: Page) {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });
}

async function signInAsGeneralMember(page: Page) {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-general",
  });
}
