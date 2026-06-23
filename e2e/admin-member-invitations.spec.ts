import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

test("general login is separate from member binding", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "使用 Google 登入" })).toBeVisible();
  await expect(page.getByText("和家庭成員一起記錄支出、收入與退款")).toBeVisible();
  await expect(page.getByRole("button", { name: "使用 Google 登入" })).toBeVisible();
  await expect(page.getByText("綁定 Google 帳號")).toHaveCount(0);
});

test("public binding links validate token states", async ({ page }) => {
  await page.goto("/members/bind");
  await expect(page.getByRole("heading", { name: "綁定連結無法使用" })).toBeVisible();
  await expect(page.getByText("這個綁定連結缺少必要資訊")).toBeVisible();
  await expect(page.getByRole("button", { name: "使用 Google 登入" })).toHaveCount(0);

  await page.goto("/members/bind?token=not-a-real-token");
  await expect(page.getByText("這個綁定連結無法使用")).toBeVisible();

  await page.goto("/members/bind?token=seed-bind-expired-token");
  await expect(page.getByText("這個綁定連結已過期")).toBeVisible();

  await page.goto("/members/bind?token=seed-bind-used-token");
  await expect(page.getByText("這個綁定連結已使用過")).toBeVisible();

  await page.goto("/members/bind?token=seed-bind-waiting-token");
  await expect(page.getByRole("heading", { name: "綁定 Google 帳號" })).toBeVisible();
  await expect(page.getByRole("button", { name: "使用 Google 登入" })).toBeVisible();
  await expect(page.locator('input[name="bindToken"]')).toHaveValue("seed-bind-waiting-token");
});

test("admin manages created member binding links", async ({ page }) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await signInAsAdmin(page);
  await page.goto("/settings/members");

  await expect(page.getByRole("heading", { name: "成員" })).toBeVisible();
  await expect(page.getByRole("button", { name: "建立成員" })).toBeVisible();
  await expect(page.getByText("Google：")).toHaveCount(0);

  const waitingRow = memberRow(page, "待綁定測試成員");
  await expect(waitingRow.getByText("待綁定", { exact: true })).toBeVisible();
  await waitingRow.getByRole("button", {
    name: "管理 待綁定測試成員 的綁定帳號連結",
  }).click();

  let dialog = page.getByRole("dialog", { name: "綁定 Google 帳號" });
  const existingLink = dialog.getByRole("textbox", { name: "綁定帳號連結" });
  await expect(existingLink).toHaveValue(/\/members\/bind\?token=seed-bind-waiting-token/u);
  await expect(dialog.getByText("有效期限：")).toBeVisible();
  await dialog.getByRole("button", {
    name: "複製 待綁定測試成員 的綁定帳號連結",
  }).click();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain(
    "/members/bind?token=seed-bind-waiting-token",
  );
  await dialog.getByRole("button", { name: "關閉" }).first().click();

  const expiredRow = memberRow(page, "失效測試成員");
  await expect(expiredRow.getByText("已失效", { exact: true })).toBeVisible();
  await expiredRow.getByRole("button", {
    name: "管理 失效測試成員 的綁定帳號連結",
  }).click();
  dialog = page.getByRole("dialog", { name: "綁定 Google 帳號" });
  await expect(dialog.getByText("的綁定連結已失效")).toBeVisible();
  await dialog.getByRole("button", { name: "重新產生連結" }).click();
  const regeneratedLink = dialog.getByRole("textbox", { name: "綁定帳號連結" });
  await expect(regeneratedLink).toHaveValue(/\/members\/bind\?token=/u);
  await expect(regeneratedLink).not.toHaveValue(/seed-bind-expired-token/u);
  await dialog.getByRole("button", { name: "關閉" }).first().click();

  const disabledRow = memberRow(page, "Disabled Lin");
  await expect(disabledRow.getByText("已停用", { exact: true })).toBeVisible();
  await expect(disabledRow.getByRole("button", {
    name: /管理 Disabled Lin 的綁定帳號連結/u,
  })).toHaveCount(0);
});

test("admin creates an unbound member then generates a binding link", async ({
  page,
}) => {
  await signInAsAdmin(page);
  await page.goto("/settings/members");

  await page.getByRole("button", { name: "建立成員" }).click();
  let dialog = page.getByRole("dialog", { name: "建立成員" });
  await dialog.getByRole("textbox", { name: "顯示名稱" }).fill("柏宇 E2E");
  await dialog.getByLabel("角色").selectOption("general_member");
  await dialog.getByRole("button", { name: "建立成員" }).click();
  await expect(page.getByText("成員已建立。")).toBeVisible();

  const createdRow = memberRow(page, "柏宇 E2E");
  await expect(createdRow.getByText("未綁定", { exact: true })).toBeVisible();
  await createdRow.getByRole("button", {
    name: "管理 柏宇 E2E 的綁定帳號連結",
  }).click();

  dialog = page.getByRole("dialog", { name: "綁定 Google 帳號" });
  await expect(dialog.getByText("請產生綁定連結")).toBeVisible();
  await dialog.getByRole("button", { name: "產生綁定連結" }).click();

  await expect(dialog.getByRole("textbox", { name: "綁定帳號連結" })).toHaveValue(
    /\/members\/bind\?token=/u,
  );
  await expect(dialog.getByText("有效期限：")).toBeVisible();
});

test("bound and disabled members hide binding actions", async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto("/settings/members");

  const adminRow = memberRow(page, "Admin");
  await expect(adminRow.getByText("已綁定", { exact: true })).toBeVisible();
  await expect(adminRow.getByRole("button", {
    name: /管理 Admin 的綁定帳號連結/u,
  })).toHaveCount(0);

  const disabledRow = memberRow(page, "Disabled Lin");
  await expect(disabledRow.getByText("已停用", { exact: true })).toBeVisible();
  await expect(disabledRow.getByRole("button", {
    name: /管理 Disabled Lin 的綁定帳號連結/u,
  })).toHaveCount(0);
});

test("admin display-name changes persist after reload", async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto("/settings/members");

  await page.getByRole("button", { name: "修改 Admin 的顯示名稱" }).click();
  const dialog = page.getByRole("dialog", { name: "修改顯示名稱" });
  await dialog.getByRole("textbox", { name: "顯示名稱" }).fill("Admin Updated");
  await dialog.getByRole("button", { name: "儲存" }).click();

  await expect(page.getByText("顯示名稱已更新").first()).toBeVisible();
  const memberList = page.getByLabel("成員清單");
  await expect(memberList.getByText("Admin Updated", { exact: true })).toBeVisible();

  await page.reload();
  await expect(memberList.getByText("Admin Updated", { exact: true })).toBeVisible();
});

test("non-admin members are redirected away from member management", async ({ page }) => {
  await signInAsGeneralMember(page);
  await page.goto("/settings/members");

  await expect(page).toHaveURL(/\/$/u);
  await expect(page.getByRole("heading", { name: "總覽" })).toBeVisible();
  await expect(page.getByRole("button", { name: "建立成員" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /修改 .* 的顯示名稱/u })).toHaveCount(0);
});

function memberRow(page: Page, displayName: string) {
  return page
    .getByText(displayName, { exact: true })
    .locator('xpath=ancestor::*[@data-slot="item"]');
}

async function signInAsAdmin(page: Page) {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-admin",
  });
}

async function signInAsGeneralMember(page: Page) {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-general",
  });
}
