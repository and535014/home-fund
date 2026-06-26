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
  await dialog.getByLabel("排序").selectOption("amount_desc");
  await dialog.getByRole("button", { name: "套用" }).click();

  await expect(page.getByRole("button", { name: /開啟篩選，已設定/u })).toBeVisible();
  await expect(page.getByRole("button", { name: /查看.*詳情/u })).toHaveText([
    /日用品代墊/u,
    /補充用品代墊/u,
  ]);
});

test("searches reimbursement payment records separately from ledger records", async ({
  page,
}) => {
  await page.goto("/search");

  await expect(page.getByRole("tab", { name: "收支紀錄" })).toBeVisible();
  await expect(page.getByRole("tab", { name: "退款紀錄" })).toBeVisible();
  await expect(page.getByRole("textbox", { name: "搜尋紀錄" })).toHaveAttribute(
    "placeholder",
    "搜尋收支紀錄",
  );

  await page.getByRole("tab", { name: "退款紀錄" }).click();

  await expect(page.getByRole("textbox", { name: "搜尋紀錄" })).toHaveAttribute(
    "placeholder",
    "搜尋退款紀錄",
  );
  await expect(page.getByRole("button", { name: "開啟選取模式" })).toHaveCount(0);
  await expect(page.getByText("請輸入關鍵字或設定篩選條件。")).toBeVisible();
  await expect(page.getByRole("button", { name: /退款紀錄詳情/u })).toHaveCount(0);

  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("退款紀錄");

  await expect(page.getByRole("button", {
    name: "查看付給 Mei 退款紀錄詳情",
  })).toBeVisible();
  await expect(page.getByRole("button", {
    name: "查看付給 Kai 退款紀錄詳情",
  })).toBeVisible();
  await expect(page.getByRole("button", {
    name: "查看已退款網路費詳情",
  })).toHaveCount(0);
  await expect(page.getByText("搜尋結果 2 筆")).toBeVisible();
  await expect(page.getByText("$1,600")).toBeVisible();
});

test("filters reimbursement payments and opens detail with related records", async ({
  page,
}) => {
  await page.goto("/search");

  await page.getByRole("tab", { name: "退款紀錄" }).click();
  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("退款紀錄");
  await page.getByRole("button", { name: "開啟篩選" }).click();

  const filterDialog = page.getByRole("dialog");
  await expect(filterDialog.getByRole("heading", { name: "篩選與排序" })).toBeVisible();
  await expect(filterDialog.getByLabel("依收款成員篩選")).toBeVisible();
  await expect(filterDialog.getByLabel("付款開始日期")).toBeVisible();
  await expect(filterDialog.getByLabel("付款結束日期")).toBeVisible();
  await expect(filterDialog.getByText("付款方式")).toHaveCount(0);

  await filterDialog.getByLabel("依收款成員篩選").selectOption("member-mei");
  await filterDialog.getByRole("button", { name: "套用" }).click();

  const meiPayment = page.getByRole("button", {
    name: "查看付給 Mei 退款紀錄詳情",
  });
  await expect(meiPayment).toBeVisible();
  await expect(page.getByRole("button", {
    name: "查看付給 Kai 退款紀錄詳情",
  })).toHaveCount(0);

  await meiPayment.click();
  let dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "退款紀錄" })).toBeVisible();
  await expect(dialog).toContainText("$1,280");
  await expect(dialog).toContainText("Mei");
  await expect(dialog).toContainText("2026/06/18");
  await expect(dialog).toContainText("銀行轉帳");
  await expect(dialog).toContainText("末五碼 5521");
  await expect(dialog.getByRole("button", { name: "編輯" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "刪除" })).toHaveCount(0);
  await expect(dialog.getByRole("button", { name: "退款" })).toHaveCount(0);

  await dialog.getByRole("button", { name: "查看關聯紀錄" }).click();
  dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "關聯紀錄" })).toBeVisible();
  await expect(dialog.getByRole("button", {
    name: "查看已退款網路費詳情",
  })).toBeVisible();
});

test("opens reimbursement payment detail from a reimbursed expense", async ({
  page,
}) => {
  await page.goto("/search");

  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("已退款網路費");
  await page.getByRole("button", { name: "查看已退款網路費詳情" }).click();

  const detailDialog = page.getByRole("dialog");
  await expect(detailDialog.getByRole("heading", {
    name: "已退款網路費",
  })).toBeVisible();
  await expect(detailDialog).toContainText("已退款");
  await detailDialog.getByRole("button", { name: "查看退款紀錄" }).click();

  const paymentDialog = page.getByRole("dialog");
  await expect(paymentDialog.getByRole("heading", { name: "退款紀錄" })).toBeVisible();
  await expect(paymentDialog).toContainText("Mei");
  await expect(paymentDialog).toContainText("銀行轉帳");
});

test("edits reimbursement payment detail from reimbursement search", async ({
  page,
}) => {
  await page.goto("/search");

  await page.getByRole("tab", { name: "退款紀錄" }).click();
  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("退款紀錄");
  await page.getByRole("button", {
    name: "查看付給 Mei 退款紀錄詳情",
  }).click();

  let detailDialog = page.getByRole("dialog", { name: "退款紀錄" });
  await expect(detailDialog).toContainText("2026/06/18");
  await expect(detailDialog).toContainText("銀行轉帳");
  await expect(detailDialog).toContainText("末五碼 5521");

  await detailDialog.getByRole("button", { name: "編輯" }).click();

  const editDialog = page.getByRole("dialog", { name: "編輯退款紀錄" });
  await expect(editDialog.getByLabel("付款日期")).toHaveValue("2026-06-18");
  await expect(editDialog.getByLabel("付款方式")).toHaveValue("bank_transfer");
  await expect(editDialog.getByLabel("備註")).toHaveAttribute(
    "placeholder",
    "可填轉帳末五碼、收據資訊或付款備註",
  );

  await editDialog.getByLabel("付款日期").fill("2026-06-24");
  await editDialog.getByLabel("付款方式").selectOption("cash");
  await editDialog.getByLabel("備註").fill("現金補登 E2E");
  await editDialog.getByRole("button", { name: "儲存變更" }).click();

  await expect(page.getByText("退款紀錄已更新")).toBeVisible();
  await expect(editDialog).toHaveCount(0);

  detailDialog = page.getByRole("dialog", { name: "退款紀錄" });
  await expect(detailDialog).toContainText("2026/06/24");
  await expect(detailDialog).toContainText("現金");
  await expect(detailDialog).toContainText("現金補登 E2E");
});

test("cancels reimbursement payment edits without changing readback", async ({
  page,
}) => {
  await page.goto("/search");

  await page.getByRole("tab", { name: "退款紀錄" }).click();
  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("退款紀錄");
  await page.getByRole("button", {
    name: "查看付給 Mei 退款紀錄詳情",
  }).click();

  const detailDialog = page.getByRole("dialog", { name: "退款紀錄" });
  await detailDialog.getByRole("button", { name: "編輯" }).click();

  const editDialog = page.getByRole("dialog", { name: "編輯退款紀錄" });
  await editDialog.getByLabel("付款日期").fill("2026-06-24");
  await editDialog.getByLabel("付款方式").selectOption("cash");
  await editDialog.getByLabel("備註").fill("不應該儲存");
  await editDialog.getByRole("button", { name: "取消" }).click();

  await expect(editDialog).toHaveCount(0);
  await expect(detailDialog).toContainText("2026/06/18");
  await expect(detailDialog).toContainText("銀行轉帳");
  await expect(detailDialog).toContainText("末五碼 5521");
  await expect(detailDialog).not.toContainText("不應該儲存");
});

test("hides reimbursement payment edit action from general members", async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-general",
  });
  await page.goto("/search");

  await page.getByRole("tab", { name: "退款紀錄" }).click();
  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("退款紀錄");
  await page.getByRole("button", {
    name: "查看付給 Mei 退款紀錄詳情",
  }).click();

  const detailDialog = page.getByRole("dialog", { name: "退款紀錄" });
  await expect(detailDialog).toContainText("銀行轉帳");
  await expect(detailDialog.getByRole("button", { name: "編輯" })).toHaveCount(0);
});

test("keeps mobile reimbursement search tabs and close control in one row", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/search");

  const tabsBox = await page
    .getByRole("tab", { name: "收支紀錄" })
    .boundingBox();
  const closeBox = await page
    .getByRole("button", { name: "關閉搜尋頁" })
    .boundingBox();

  expect(tabsBox).not.toBeNull();
  expect(closeBox).not.toBeNull();
  expect(Math.abs(tabsBox!.y - closeBox!.y)).toBeLessThan(12);
  expect(closeBox!.x).toBeGreaterThan(tabsBox!.x);
});

test("blocks cross-member batch refund and shows the refund total", async ({
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
  await expect(page.getByRole("button", { name: "批次刪除 0 筆" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "批次退款 2 筆" })).toBeEnabled();

  await page.getByRole("button", { name: "批次退款 2 筆" }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "確認批次退款" })).toBeVisible();
  await expect(dialog).toContainText("退款總金額");
  await expect(dialog).toContainText("$8,300");
  await expect(dialog).toContainText(
    "批次退款一次只能選擇同一位代墊成員的紀錄。",
  );
  await expect(dialog.getByRole("button", { name: "確認退款" })).toBeDisabled();
});

test("shows batch delete count in parentheses for selected eligible records", async ({
  page,
}) => {
  await page.goto("/search");

  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("網路費");
  await expect(page.getByRole("button", { name: "查看網路費詳情" })).toBeVisible();

  await page.getByRole("button", { name: "開啟選取模式" }).click();
  await page.getByRole("button", { name: "全選目前顯示" }).click();

  await expect(page.getByRole("button", { name: "批次刪除 1 筆" })).toBeEnabled();
});

test("loads the next server page and keeps all-select scoped to loaded rows", async ({
  page,
}) => {
  await page.goto("/search");

  await page.getByRole("textbox", { name: "搜尋紀錄" }).fill("搜尋分頁測試");

  await expect(page.getByText("搜尋結果 105 筆")).toBeVisible();
  await expect(page.getByRole("button", {
    name: "查看搜尋分頁測試 105詳情",
  })).toBeVisible();
  await expect(page.getByRole("button", {
    name: "查看搜尋分頁測試 001詳情",
  })).toHaveCount(0);

  await page.getByRole("button", { name: "開啟選取模式" }).click();
  await page.getByRole("button", { name: "全選目前顯示" }).click();

  await expect(page.getByText("已選取 100 筆")).toBeVisible();

  await page.getByText("載入更多紀錄...").scrollIntoViewIfNeeded();

  await expect(page.getByRole("button", {
    name: "查看搜尋分頁測試 001詳情",
  })).toBeVisible();
  await expect(page.getByText("已選取 100 筆")).toBeVisible();
  await expect(page.getByRole("button", { name: "全選目前顯示" })).toBeEnabled();

  await page.getByRole("button", { name: "全選目前顯示" }).click();

  await expect(page.getByText("已選取 105 筆")).toBeVisible();
  await expect(page.getByRole("button", { name: "已全選目前顯示" })).toBeDisabled();
});
