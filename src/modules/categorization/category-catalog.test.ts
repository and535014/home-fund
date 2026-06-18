import { describe, expect, it } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  archiveCategory,
  createCategory,
  listAvailableCategories,
  renameCategory,
  type Category,
} from "./category-catalog";

const admin: AuthenticatedMember = {
  id: "member-admin",
  googleAccountLinked: true,
  roles: ["admin"],
};

const categoryManager: AuthenticatedMember = {
  id: "member-manager",
  googleAccountLinked: true,
  roles: ["general_member"],
  capabilities: ["manage_categories"],
};

const generalMember: AuthenticatedMember = {
  id: "member-mei",
  googleAccountLinked: true,
  roles: ["general_member"],
};

const categories: Category[] = [
  {
    id: "category-income-rent",
    type: "income",
    name: "房租",
    status: "active",
  },
  {
    id: "category-expense-grocery",
    type: "expense",
    name: "日用品",
    status: "active",
  },
  {
    id: "category-expense-archived",
    type: "expense",
    name: "舊分類",
    status: "archived",
  },
];

describe("category catalog", () => {
  it("allows admins to create income and expense categories", () => {
    expect(createCategory(admin, {
      type: "expense",
      name: "網路費",
    }, { categories, generateId: () => "category-expense-internet" }))
      .toEqual({
        ok: true,
        category: {
          id: "category-expense-internet",
          type: "expense",
          name: "網路費",
          status: "active",
        },
        events: ["Category created"],
      });
  });

  it("rejects members with manage_categories capability when they are not admins", () => {
    expect(createCategory(categoryManager, {
      type: "income",
      name: "生活費",
    }, { categories, generateId: () => "category-income-living" })).toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "admin_required",
    });
  });

  it("rejects unauthorized category management", () => {
    expect(createCategory(generalMember, {
      type: "expense",
      name: "網路費",
    }, { categories })).toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "admin_required",
    });
  });

  it("rejects blank names and duplicate active names within the same type", () => {
    expect(createCategory(admin, {
      type: "expense",
      name: " ",
    }, { categories })).toEqual({
      ok: false,
      reason: "invalid_name",
    });

    expect(createCategory(admin, {
      type: "expense",
      name: "日用品",
    }, { categories })).toEqual({
      ok: false,
      reason: "duplicate_active_category_name",
    });

    expect(createCategory(admin, {
      type: "income",
      name: "日用品",
    }, { categories, generateId: () => "category-income-supplies" }))
      .toMatchObject({ ok: true });
  });

  it("renames active categories without changing historical ids", () => {
    expect(renameCategory(admin, {
      categoryId: "category-expense-grocery",
      name: "家庭用品",
    }, { categories })).toEqual({
      ok: true,
      category: {
        id: "category-expense-grocery",
        type: "expense",
        name: "家庭用品",
        status: "active",
      },
      events: ["Category updated"],
    });
  });

  it("archives categories and keeps them readable for history", () => {
    expect(archiveCategory(admin, {
      categoryId: "category-expense-grocery",
    }, { categories })).toEqual({
      ok: true,
      category: {
        id: "category-expense-grocery",
        type: "expense",
        name: "日用品",
        status: "archived",
      },
      events: ["Category updated"],
    });
  });

  it("lists only active categories for new income or expense records", () => {
    expect(listAvailableCategories(categories, "expense")).toEqual([
      {
        id: "category-expense-grocery",
        type: "expense",
        name: "日用品",
        status: "active",
      },
    ]);
  });
});
