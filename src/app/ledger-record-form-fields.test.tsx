import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { Category } from "@/modules/categorization/category-catalog";
import {
  LedgerRecordAmountNameFields,
  LedgerRecordCategoryField,
} from "./ledger-record-form-fields";

describe("LedgerRecordCategoryField", () => {
  it("keeps mobile options in one row and uses a fixed two-row-height desktop grid", () => {
    const html = renderToStaticMarkup(
      <LedgerRecordCategoryField
        categories={Array.from({ length: 2 }, (_, index) =>
          category(`income-${index}`, `收入 ${index + 1}`, index),
        )}
        defaultCategoryId="income-1"
      />,
    );

    expect(html).toContain("flex");
    expect(html).toContain("overflow-x-auto");
    expect(html).toContain("sm:h-40");
    expect(html).toContain("sm:grid");
    expect(html).toContain("sm:grid-cols-6");
    expect(html).toContain("sm:content-start");
    expect(html).toContain("items-start");
    expect(html).toContain('checked="" value="income-1"');
  });

  it("scrolls additional categories vertically without horizontal paging", () => {
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
    expect(html).toContain("sm:overflow-x-hidden");
    expect(html).toContain("sm:overflow-y-auto");
    expect(html).not.toContain("sm:overflow-x-auto");
    expect(html).not.toContain("min-w-full");
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
