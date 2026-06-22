import { expect, test } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });
});

test("starts empty, searches records, and clears keyword results", async ({
  page,
}) => {
  await page.goto("/search");

  await expect(page.getByRole("heading", { name: "搜尋" })).toHaveCount(0);
  await expect(page.getByText("請輸入關鍵字或設定篩選條件。")).toBeVisible();
  await expect(page.getByRole("button", { name: /查看.*詳情/u })).toHaveCount(0);

  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("生活費");

  await expect(page.getByRole("button", { name: "查看六月生活費詳情" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看補充用品代墊詳情" })).toHaveCount(0);

  await page.getByRole("button", { name: "清除搜尋" }).click();

  await expect(page.getByRole("textbox", { name: "搜尋紀錄" })).toHaveValue("");
  await expect(page.getByText("請輸入關鍵字或設定篩選條件。")).toBeVisible();
  await expect(page.getByRole("button", { name: /查看.*詳情/u })).toHaveCount(0);

  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("899");

  await expect(page.getByRole("button", { name: "查看網路費詳情" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看六月生活費詳情" })).toHaveCount(0);
});

test("applies filter modal changes only after apply", async ({ page }) => {
  await page.goto("/search");

  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("費");
  await expect(page.getByRole("button", { name: "查看六月生活費詳情" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看網路費詳情" })).toBeVisible();

  await page.getByRole("button", { name: "開啟篩選" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "篩選與排序" })).toBeVisible();

  await dialog.getByLabel("依類型篩選").selectOption("expense");
  await dialog.getByLabel("依收支對象篩選").selectOption("fund");

  await page.keyboard.press("Escape");

  await expect(page.getByRole("button", { name: "查看六月生活費詳情" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看網路費詳情" })).toBeVisible();

  await page.getByRole("button", { name: "開啟篩選" }).click();
  await dialog.getByLabel("依類型篩選").selectOption("expense");
  await dialog.getByLabel("依收支對象篩選").selectOption("fund");
  await dialog.getByRole("button", { name: "套用" }).click();

  await expect(page.getByRole("button", { name: "查看網路費詳情" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看六月生活費詳情" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "開啟篩選，已設定 2 個條件" })).toBeVisible();
});

test("limits category and participant options by selected type", async ({
  page,
}) => {
  await page.goto("/search");

  await page.getByRole("button", { name: "開啟篩選" }).click();
  const dialog = page.getByRole("dialog");

  await dialog.getByLabel("依類型篩選").selectOption("income");

  await expect(dialog.getByLabel("依分類篩選").locator("option", {
    hasText: "生活費",
  })).toHaveCount(1);
  await expect(dialog.getByLabel("依分類篩選").locator("option", {
    hasText: "網路費",
  })).toHaveCount(0);
  await expect(dialog.getByLabel("依收支對象篩選").locator("option", {
    hasText: "基金",
  })).toHaveCount(0);

  await dialog.getByLabel("依類型篩選").selectOption("expense");

  await expect(dialog.getByLabel("依分類篩選").locator("option", {
    hasText: "網路費",
  })).toHaveCount(1);
  await expect(dialog.getByLabel("依收支對象篩選").locator("option", {
    hasText: "基金",
  })).toHaveCount(1);
});

test("filters by reimbursement status and keeps detail navigation working", async ({
  page,
}) => {
  await page.goto("/search");

  await page.getByRole("button", { name: "開啟篩選" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("依退款狀態篩選").selectOption("unrefunded");
  await dialog.getByRole("button", { name: "套用" }).click();

  await expect(page.getByRole("button", { name: "查看補充用品代墊詳情" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看網路費詳情" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "查看六月生活費詳情" })).toHaveCount(0);

  await page.getByRole("button", { name: "查看補充用品代墊詳情" }).click();
  await expect(page.getByRole("dialog").getByRole("heading", {
    name: "補充用品代墊",
  })).toBeVisible();
});

test("sorts filtered records by amount", async ({ page }) => {
  await page.goto("/search");

  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("代墊");
  await page.getByRole("button", { name: "開啟篩選" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("紀錄排序").selectOption("amount_desc");
  await dialog.getByRole("button", { name: "套用" }).click();

  await expect(page.getByRole("button", { name: /開啟篩選，已設定/u })).toBeVisible();
  await expect(page.getByRole("button", { name: /查看.*詳情/u })).toHaveText([
    /日用品代墊/u,
    /補充用品代墊/u,
  ]);
});

test("selects currently displayed rows and shows batch refund total", async ({
  page,
}) => {
  await page.goto("/search");

  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("代墊");
  await expect(page.getByRole("button", { name: "查看日用品代墊詳情" })).toBeVisible();
  await expect(page.getByRole("button", { name: "查看補充用品代墊詳情" })).toBeVisible();
  await expect(page.getByText("搜尋結果 2 筆")).toBeVisible();
  await expect(page.getByText("總額")).toBeVisible();
  await expect(page.getByText("$8,300")).toBeVisible();

  await page.getByRole("button", { name: "開啟選取模式" }).click();
  await expect(page.getByText("已選取 0 筆")).toBeVisible();

  await page.getByRole("button", { name: "全選目前顯示" }).click();

  await expect(page.getByText("已選取 2 筆")).toBeVisible();
  await expect(page.getByRole("button", { name: "已全選目前顯示" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "批次刪除 (0)" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "批次退款 (2)" })).toBeEnabled();

  await page.getByRole("button", { name: "批次退款 (2)" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "確認批次退款" })).toBeVisible();
  await expect(dialog).toContainText("退款總金額");
  await expect(dialog).toContainText("$8,300");

  await dialog.getByRole("button", { name: "確認退款" }).click();

  await expect(page.getByText("已完成批次退款")).toBeVisible();
});

test("shows batch delete count in parentheses for selected eligible records", async ({
  page,
}) => {
  await page.goto("/search");

  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("網路費");
  await expect(page.getByRole("button", { name: "查看網路費詳情" })).toBeVisible();

  await page.getByRole("button", { name: "開啟選取模式" }).click();
  await page.getByRole("button", { name: "全選目前顯示" }).click();

  await expect(page.getByRole("button", { name: "批次刪除 (1)" })).toBeEnabled();
});
