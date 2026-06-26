import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Category } from "@/modules/categorization/category-catalog";
import {
  LedgerRecordAmountNameFields,
  LedgerRecordCategoryField,
} from "./ledger-record-form-fields";

describe("LedgerRecordCategoryField", () => {
  it("uses one desktop row when a category page has six or fewer options", () => {
    const html = renderToStaticMarkup(
      <LedgerRecordCategoryField
        categories={Array.from({ length: 2 }, (_, index) =>
          category(`income-${index}`, `收入 ${index + 1}`, index),
        )}
        defaultCategoryId="income-1"
      />,
    );

    expect(html).toContain("sm:grid-cols-6");
    expect(html).toContain("sm:auto-rows-max");
    expect(html).toContain("sm:items-start");
    expect(html).toContain("items-start");
    expect(html).not.toContain("sm:grid-rows-1");
    expect(html).not.toContain("sm:grid-rows-2");
    expect(html).toContain('checked="" value="income-1"');
  });

  it("keeps the desktop category picker to six visible columns across two rows", () => {
    const html = renderToStaticMarkup(
      <LedgerRecordCategoryField
        categories={Array.from({ length: 13 }, (_, index) =>
          category(`expense-${index}`, `分類 ${index + 1}`, index),
        )}
        defaultCategoryId="expense-3"
      />,
    );

    expect(html).toContain('aria-label="分類"');
    expect(html).toContain("sm:grid-cols-6");
    expect(html).toContain("sm:auto-rows-max");
    expect(html).toContain("sm:items-start");
    expect(html).toContain("sm:min-w-full");
    expect(html).toContain("sm:overflow-x-auto");
    expect(html).not.toContain("sm:grid-rows-1");
    expect(html).not.toContain("sm:grid-rows-2");
    expect(html).not.toContain("sm:grid-flow-col");
    expect(html).not.toContain("sm:auto-cols-[");
    expect(html).not.toContain("sm:overflow-visible");
    expect(html).toContain("sm:w-full");
    expect(html).toContain('checked="" value="expense-3"');
  });
});

describe("LedgerRecordAmountNameFields", () => {
  it("lays out amount and name side by side on desktop", () => {
    const html = renderToStaticMarkup(
      <LedgerRecordAmountNameFields
        amountDefaultValue="1200"
        nameDefaultValue="晚餐食材"
      />,
    );

    expect(html).toContain("sm:grid-cols-2");
    expect(html).toContain('name="amountTwd"');
    expect(html).toContain('value="1200"');
    expect(html).toContain('name="name"');
    expect(html).toContain('value="晚餐食材"');
  });
});

function category(id: string, name: string, sortOrder: number): Category {
  return {
    color: "gold",
    icon: "tags",
    id,
    name,
    sortOrder,
    status: "active",
    type: "expense",
  };
}
