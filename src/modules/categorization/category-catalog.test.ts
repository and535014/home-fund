import { describe, expect, it } from "vitest";
import type { AuthenticatedMember } from "../identity-access/authorization";
import {
  archiveCategory,
  createCategory,
  listAvailableCategories,
  renameCategory,
  reorderCategories,
  unarchiveCategory,
  updateCategory,
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
    color: "blue",
    icon: "home",
    sortOrder: 20,
    status: "active",
  },
  {
    id: "category-expense-grocery",
    type: "expense",
    name: "日用品",
    color: "gold",
    icon: "shopping-cart",
    sortOrder: 20,
    status: "active",
  },
  {
    id: "category-expense-internet",
    type: "expense",
    name: "網路費",
    color: "violet",
    icon: "wifi",
    sortOrder: 10,
    status: "active",
  },
  {
    id: "category-expense-archived",
    type: "expense",
    name: "舊分類",
    color: "rose",
    icon: "tags",
    sortOrder: 30,
    status: "archived",
  },
];

describe("category catalog", () => {
  it("allows admins to create income and expense categories", () => {
    expect(createCategory(admin, {
      type: "expense",
      name: "水電費",
      color: "blue",
      icon: "home",
    }, { categories, generateId: () => "category-expense-internet" }))
      .toEqual({
        ok: true,
      category: {
        id: "category-expense-internet",
        type: "expense",
        name: "水電費",
        color: "blue",
        icon: "home",
        sortOrder: 30,
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

  it("updates active category names and visual identity without changing historical ids", () => {
    expect(updateCategory(admin, {
      categoryId: "category-expense-grocery",
      color: "teal",
      icon: "home",
      name: "家庭用品",
    }, { categories })).toEqual({
      ok: true,
      category: {
        id: "category-expense-grocery",
        type: "expense",
        name: "家庭用品",
        color: "teal",
        icon: "home",
        sortOrder: 20,
        status: "active",
      },
      events: ["Category updated"],
    });
  });

  it("rejects invalid color and icon values", () => {
    expect(createCategory(admin, {
      type: "expense",
      name: "水電費",
      color: "not-a-color",
      icon: "home",
    }, { categories })).toEqual({
      ok: false,
      reason: "invalid_color",
    });

    expect(updateCategory(admin, {
      categoryId: "category-expense-grocery",
      color: "blue",
      icon: "not-an-icon",
      name: "日用品",
    }, { categories })).toEqual({
      ok: false,
      reason: "invalid_icon",
    });
  });

  it("keeps the old rename command as a name-only compatibility path", () => {
    expect(renameCategory(admin, {
      categoryId: "category-expense-grocery",
      name: "家庭用品",
    }, { categories })).toMatchObject({
      ok: true,
      category: {
        color: "gold",
        icon: "shopping-cart",
        name: "家庭用品",
      },
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
        color: "gold",
        icon: "shopping-cart",
        sortOrder: 20,
        status: "archived",
      },
      events: ["Category updated"],
    });
  });

  it("unarchives categories and appends them to active order", () => {
    expect(unarchiveCategory(admin, {
      categoryId: "category-expense-archived",
    }, { categories })).toEqual({
      ok: true,
      category: {
        id: "category-expense-archived",
        type: "expense",
        name: "舊分類",
        color: "rose",
        icon: "tags",
        sortOrder: 30,
        status: "active",
      },
      events: ["Category unarchived"],
    });
  });

  it("rejects invalid unarchive commands", () => {
    expect(unarchiveCategory(generalMember, {
      categoryId: "category-expense-archived",
    }, { categories })).toEqual({
      ok: false,
      reason: "permission_denied",
      authorizationReason: "admin_required",
    });

    expect(unarchiveCategory(admin, {
      categoryId: "category-missing",
    }, { categories })).toEqual({
      ok: false,
      reason: "category_not_found",
    });

    expect(unarchiveCategory(admin, {
      categoryId: "category-expense-grocery",
    }, { categories })).toEqual({
      ok: false,
      reason: "invalid_state",
    });

    expect(unarchiveCategory(admin, {
      categoryId: "category-expense-archived",
    }, {
      categories: [
        ...categories.filter((category) => category.id !== "category-expense-grocery"),
        {
          id: "category-expense-duplicate",
          type: "expense",
          name: "舊分類",
          color: "blue",
          icon: "tags",
          sortOrder: 40,
          status: "active",
        },
      ],
    })).toEqual({
      ok: false,
      reason: "duplicate_active_category_name",
    });
  });

  it("lists only active categories for new income or expense records", () => {
    expect(listAvailableCategories(categories, "expense")).toEqual([
      {
        id: "category-expense-internet",
        type: "expense",
        name: "網路費",
        color: "violet",
        icon: "wifi",
        sortOrder: 10,
        status: "active",
      },
      {
        id: "category-expense-grocery",
        type: "expense",
        name: "日用品",
        color: "gold",
        icon: "shopping-cart",
        sortOrder: 20,
        status: "active",
      },
    ]);
  });

  it("rejects invalid reorder payloads", () => {
    expect(reorderCategories(admin, {
      type: "expense",
      orderedCategoryIds: [
        "category-expense-grocery",
        "category-expense-grocery",
      ],
    }, { categories })).toEqual({
      ok: false,
      reason: "invalid_order",
    });

    expect(reorderCategories(admin, {
      type: "expense",
      orderedCategoryIds: [
        "category-expense-grocery",
        "category-income-rent",
      ],
    }, { categories })).toEqual({
      ok: false,
      reason: "invalid_order",
    });
  });

  it("accepts valid same-type active reorder", () => {
    expect(reorderCategories(admin, {
      type: "expense",
      orderedCategoryIds: [
        "category-expense-grocery",
        "category-expense-internet",
      ],
    }, { categories })).toMatchObject({
      ok: true,
      events: ["Category updated"],
    });
  });
});
