// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LedgerRecordEntryKindTabs } from "./ledger-record-entry-kind-tabs";

afterEach(cleanup);

describe("LedgerRecordEntryKindTabs", () => {
  it("renders the three shared choices and reports a change", () => {
    const onEntryKindChange = vi.fn();
    render(
      <LedgerRecordEntryKindTabs
        entryKind="member-expense"
        onEntryKindChange={onEntryKindChange}
      />,
    );

    expect(screen.getByRole("tab", { name: "成員支出" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    fireEvent.mouseDown(screen.getByRole("tab", { name: "收入" }), {
      button: 0,
      ctrlKey: false,
    });
    expect(onEntryKindChange).toHaveBeenCalledWith("income");
  });

  it("disables every choice while a mutation is pending", () => {
    render(
      <LedgerRecordEntryKindTabs
        disabled
        entryKind="income"
        onEntryKindChange={vi.fn()}
      />,
    );

    expect(screen.getAllByRole("tab")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ disabled: true }),
        expect.objectContaining({ disabled: true }),
        expect.objectContaining({ disabled: true }),
      ]),
    );
  });
});
