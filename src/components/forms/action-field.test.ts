import { describe, expect, it } from "vitest";

import {
  getActionFieldControlProps,
  getActionFieldErrors,
} from "./action-field";

describe("action field adapter", () => {
  it("returns field errors by name", () => {
    expect(getActionFieldErrors({
      displayName: ["請輸入顯示名稱"],
    }, "displayName")).toEqual(["請輸入顯示名稱"]);
  });

  it("links invalid controls to their field error", () => {
    expect(getActionFieldControlProps({
      errors: {
        displayName: ["請輸入顯示名稱"],
      },
      field: "displayName",
      id: "member-display-name",
    })).toEqual({
      "aria-describedby": "member-display-name-error",
      "aria-invalid": true,
    });
  });

  it("preserves existing descriptions before field errors", () => {
    expect(getActionFieldControlProps({
      describedBy: "member-display-name-hint",
      errors: {
        displayName: ["請輸入顯示名稱"],
      },
      field: "displayName",
      id: "member-display-name",
    })).toEqual({
      "aria-describedby": "member-display-name-hint member-display-name-error",
      "aria-invalid": true,
    });
  });

  it("omits invalid attributes when the field has no errors", () => {
    expect(getActionFieldControlProps({
      errors: undefined,
      field: "displayName",
      id: "member-display-name",
    })).toEqual({
      "aria-describedby": undefined,
      "aria-invalid": undefined,
    });
  });
});
