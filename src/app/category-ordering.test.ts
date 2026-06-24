import { describe, expect, it } from "vitest";
import { getCategoryMoveState } from "./(app)/settings/categories/category-ordering";

describe("getCategoryMoveState", () => {
  const categories = [
    { id: "expense-1" },
    { id: "expense-2" },
    { id: "expense-3" },
  ];

  it("disables upward movement for the first category", () => {
    expect(getCategoryMoveState({ categories, categoryId: "expense-1" })).toEqual({
      canMoveDown: true,
      canMoveUp: false,
    });
  });

  it("enables both directions for a middle category", () => {
    expect(getCategoryMoveState({ categories, categoryId: "expense-2" })).toEqual({
      canMoveDown: true,
      canMoveUp: true,
    });
  });

  it("disables downward movement for the last category", () => {
    expect(getCategoryMoveState({ categories, categoryId: "expense-3" })).toEqual({
      canMoveDown: false,
      canMoveUp: true,
    });
  });

  it("disables movement for unknown categories", () => {
    expect(getCategoryMoveState({ categories, categoryId: "missing" })).toEqual({
      canMoveDown: false,
      canMoveUp: false,
    });
  });
});
