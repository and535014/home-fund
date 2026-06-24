import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DialogFooter } from "./dialog";

describe("DialogFooter", () => {
  it("renders an identifiable shared footer with its actions", () => {
    const html = renderToStaticMarkup(
      <DialogFooter>
        <button type="button">取消</button>
        <button type="button">確認</button>
        <button type="button">刪除</button>
      </DialogFooter>,
    );

    expect(html).toContain('data-slot="dialog-footer"');
    expect(html).toContain("取消");
    expect(html).toContain("確認");
    expect(html).toContain("刪除");
  });
});
