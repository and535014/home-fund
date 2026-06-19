import { expect, test } from "./fixtures";
import type { Page } from "@playwright/test";

test("general login is separate from invitation acceptance", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("heading", { name: "使用 Google 登入" })).toBeVisible();
  await expect(page.getByText("和家庭成員一起記錄支出、收入與退款")).toBeVisible();
  await expect(page.getByRole("button", { name: "使用 Google 登入" })).toBeVisible();
  await expect(page.getByText("接受成員邀請")).toHaveCount(0);
});

test("invitation acceptance keeps invite sign-in isolated", async ({ page }) => {
  await page.goto("/invite/accept?token=seed-invite-token");

  await expect(page.getByRole("heading", { name: "接受成員邀請" })).toBeVisible();
  await expect(page.getByRole("button", { name: "使用 Google 登入" })).toBeEnabled();
  await expect(page.getByRole("button", { name: "一般登入" })).toHaveCount(0);

  await page.goto("/invite/accept");
  await expect(page.getByText("這個邀請連結缺少 token")).toBeVisible();
  await expect(page.getByRole("button", { name: "使用 Google 登入" })).toBeDisabled();
});

test("admin member preview uses shared page layout without record actions", async ({
  page,
}) => {
  await signInAsAdmin(page);
  await page.goto("/members");

  await expect(page.getByRole("heading", { name: "成員" })).toBeVisible();
  await expect(page.getByRole("button", { name: "邀請成員" })).toBeVisible();
  await expect(page.getByRole("button", { name: "登出" })).toBeVisible();
  await expect(page.getByRole("button", { name: "新增收入" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "新增支出" })).toHaveCount(0);
  await expect(page.getByText("Google：")).toHaveCount(0);

  const firstRow = page
    .getByText("Admin", { exact: true })
    .locator('xpath=ancestor::*[@data-slot="item"]');
  const secondRow = page
    .getByText("Kai", { exact: true })
    .locator('xpath=ancestor::*[@data-slot="item"]');
  const thirdRow = page
    .getByText("Lin", { exact: true })
    .locator('xpath=ancestor::*[@data-slot="item"]');

  const firstBox = await firstRow.boundingBox();
  const secondBox = await secondRow.boundingBox();
  const thirdBox = await thirdRow.boundingBox();

  expect(firstBox).not.toBeNull();
  expect(secondBox).not.toBeNull();
  expect(thirdBox).not.toBeNull();
  expect(secondBox?.x ?? 0).toBeGreaterThan(firstBox?.x ?? 0);
  expect(thirdBox?.x ?? 0).toBeGreaterThan(secondBox?.x ?? 0);
});

test("admin creates an expiring invitation link and copies it automatically", async ({
  page,
}) => {
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await signInAsAdmin(page);
  await page.goto("/members");

  await page.getByRole("button", { name: "邀請成員" }).click();
  await page.getByRole("button", { name: "建立邀請連結" }).click();

  const dialog = page.getByRole("dialog", { name: "邀請連結已建立" });
  await expect(dialog).toBeVisible();
  const inviteLink = dialog.getByRole("textbox", { name: "邀請連結" });
  await expect(inviteLink).toHaveValue(/\/invite\/accept\?token=/u);
  await expect(dialog.getByText("此連結 7 天內有效")).toBeVisible();
  await expect(page.getByText("邀請連結已複製").first()).toBeVisible();
  await expect(page.getByText("待接受邀請", { exact: true })).toHaveCount(0);

  const copiedLink = await page.evaluate(() => navigator.clipboard.readText());
  expect(copiedLink).toContain("/invite/accept?token=");

  await page.getByRole("button", { name: "完成" }).click();
  await expect(page.getByRole("button", { name: /複製 .* 的邀請連結/u })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /撤銷 .* 的邀請/u })).toHaveCount(0);
});

test("admin display-name changes persist after reload", async ({ page }) => {
  await signInAsAdmin(page);
  await page.goto("/members");

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
  await page.goto("/members");

  await expect(page).toHaveURL(/\/$/u);
  await expect(page.getByRole("heading", { name: "家庭資金總覽" })).toBeVisible();
  await expect(page.getByRole("button", { name: "邀請成員" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /修改 .* 的顯示名稱/u })).toHaveCount(0);
});

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
