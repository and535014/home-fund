import { expect, test } from "./fixtures";

test("keeps unauthenticated users on the Google sign-in gate", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login/u);
  await expect(page.getByRole("heading", {
    name: "使用 Google 登入",
  })).toBeVisible();
  await expect(page.getByRole("button", {
    name: "使用 Google 登入",
  })).toBeVisible();
  await expect(page.getByRole("heading", {
    name: "家庭資金總覽",
  })).toHaveCount(0);
});

test("resolves a linked active Google user through controlled auth", async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });

  await page.goto("/?month=2026-06");

  await expect(page.getByRole("heading", {
    name: "家庭資金總覽",
  })).toBeVisible();
  await expect(page.getByText("六月生活費")).toBeVisible();
});

test("blocks a controlled Google user that is not linked to a member", async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-unlinked",
  });

  await page.goto("/");

  await expect(page).toHaveURL(/\/unauthenticated\?reason=google_account_not_linked/u);
  await expect(page.getByRole("heading", {
    name: "找不到家庭成員帳號",
  })).toBeVisible();
  await expect(page.getByRole("button", {
    name: "使用 Google 登入",
  })).toBeVisible();
  await expect(page.getByText("確認收入")).toHaveCount(0);
});

test("blocks a controlled Google user linked to an inactive member", async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-disabled",
  });

  await page.goto("/");

  await expect(page).toHaveURL(/\/unauthenticated\?reason=member_not_active/u);
  await expect(page.getByRole("heading", {
    name: "帳號尚未啟用",
  })).toBeVisible();
  await expect(page.getByRole("button", {
    name: "使用 Google 登入",
  })).toHaveCount(0);
  await expect(page.getByText("確認收入")).toHaveCount(0);
});
