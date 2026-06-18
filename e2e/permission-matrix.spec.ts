import type { Locator, Page } from "@playwright/test";
import { expect, test } from "./fixtures";

test.describe.configure({ mode: "serial" });

test("lets a linked active general member browse the dashboard", async ({
  page,
}) => {
  await signInAsGeneralMember(page);

  await page.goto("/?month=2026-06");

  await expect(page.getByRole("heading", {
    name: "家庭資金總覽",
  })).toBeVisible();
  await expect(page.getByText("六月生活費")).toBeVisible();
});

test("blocks a general member from creating income for another member", async ({
  page,
}) => {
  await signInAsGeneralMember(page);
  await page.goto("/?month=2026-06&create=income");

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "新增收入" })).toBeVisible();
  await dialog.locator('input[name="name"]').fill("E2E 未授權收入");
  await dialog.locator('input[name="amountTwd"]').fill("1111");
  await dialog.locator('input[name="occurredOn"]').fill("2026-06-21");
  await selectFieldOption(page, "分類", "生活費");
  await setFormValue(dialog, "sourceMemberId", "member-kai");

  await dialog.getByRole("button", { name: "新增收入" }).click();

  await expect(page.getByRole("dialog").getByRole("heading", {
    name: "新增收入",
  })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "目前帳號沒有新增這筆紀錄的權限。",
  );
  await expect(page).toHaveURL(/create=income/u);
  await expect(page).toHaveURL(/result=permission_denied/u);
  await expect(page.getByText("E2E 未授權收入")).toHaveCount(0);
});

test("blocks a general member from creating a member-paid expense for another member", async ({
  page,
}) => {
  await signInAsGeneralMember(page);
  await page.goto("/?month=2026-06&create=expense");

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "新增支出" })).toBeVisible();
  await dialog.locator('input[name="name"]').fill("E2E 未授權代墊");
  await dialog.locator('input[name="amountTwd"]').fill("4321");
  await dialog.locator('input[name="occurredOn"]').fill("2026-06-22");
  await selectFieldOption(page, "分類", "日用品");
  await setFormValue(dialog, "payerMemberId", "member-kai");

  await dialog.getByRole("button", { name: "新增支出" }).click();

  await expect(page.getByRole("dialog").getByRole("heading", {
    name: "新增支出",
  })).toBeVisible();
  await expect(page.getByRole("alert")).toContainText(
    "目前帳號沒有新增這筆紀錄的權限。",
  );
  await expect(page).toHaveURL(/create=expense/u);
  await expect(page).toHaveURL(/result=permission_denied/u);
  await expect(page.getByText("E2E 未授權代墊")).toHaveCount(0);
  await expect(page.locator('section[aria-labelledby="reimbursement-title"]')
    .getByText("$4,321")).toHaveCount(0);
});

test("allows a finance manager to create income for another member", async ({
  page,
}) => {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-linked",
  });
  await page.goto("/?month=2026-06&create=income");

  const dialog = page.getByRole("dialog");
  await expect(dialog.getByRole("heading", { name: "新增收入" })).toBeVisible();
  await dialog.locator('input[name="name"]').fill("E2E 權限允許收入");
  await dialog.locator('input[name="amountTwd"]').fill("2222");
  await dialog.locator('input[name="occurredOn"]').fill("2026-06-23");
  await selectFieldOption(page, "分類", "生活費");
  await selectFieldOption(page, "收入來源", "Kai");

  await dialog.getByRole("button", { name: "新增收入" }).click();

  await expect(page.getByText("E2E 權限允許收入")).toBeVisible();
  await expect(page).toHaveURL(/month=2026-06/u);
});

async function signInAsGeneralMember(page: Page) {
  await page.setExtraHTTPHeaders({
    "x-e2e-auth-user-id": "user-e2e-general",
  });
}

async function selectFieldOption(page: Page, label: string, option: string) {
  await page
    .getByText(label, { exact: true })
    .locator("..")
    .getByRole("combobox")
    .selectOption({ label: option });
}

async function setFormValue(
  locator: Locator,
  name: string,
  value: string,
) {
  await locator.locator(`[name="${name}"]`).evaluate((element, nextValue) => {
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLSelectElement
    ) {
      element.value = nextValue;
    }
  }, value);
}
