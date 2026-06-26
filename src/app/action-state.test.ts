import { describe, expect, it } from "vitest";
import {
  actionError,
  actionOutcomeError,
  actionOutcomeSuccess,
  actionOutcomeToState,
  actionStateToOutcome,
  actionSuccess,
  initialActionState,
} from "./action-state";

describe("action outcome", () => {
  it("uses ok=true for successful form action state", () => {
    expect(actionSuccess("已完成", { id: "record-1" })).toEqual({
      status: "success",
      ok: true,
      message: "已完成",
      data: { id: "record-1" },
    });
  });

  it("uses ok=false for failed form action state", () => {
    expect(
      actionError("請輸入名稱", {
        code: "missing_name",
        fieldErrors: { name: ["請輸入名稱"] },
      }),
    ).toEqual({
      status: "error",
      ok: false,
      message: "請輸入名稱",
      code: "missing_name",
      fieldErrors: { name: ["請輸入名稱"] },
    });
  });

  it("adapts non-form action outcomes to form action state", () => {
    expect(
      actionOutcomeToState(
        actionOutcomeSuccess("匯入完成", { importedCount: 3 }, {
          revalidated: ["/", "/search"],
        }),
      ),
    ).toEqual({
      status: "success",
      ok: true,
      message: "匯入完成",
      data: { importedCount: 3 },
      revalidated: ["/", "/search"],
    });

    expect(
      actionOutcomeToState(
        actionOutcomeError("沒有權限", { code: "permission_denied" }),
      ),
    ).toEqual({
      status: "error",
      ok: false,
      message: "沒有權限",
      code: "permission_denied",
    });
  });

  it("does not treat idle state as an outcome", () => {
    expect(actionStateToOutcome(initialActionState())).toBeUndefined();
  });
});
