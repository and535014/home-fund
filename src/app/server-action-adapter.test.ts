import { revalidatePath } from "next/cache";
import { describe, expect, it, vi } from "vitest";
import {
  actionSuccessWithRevalidation,
  revalidateActionPaths,
} from "./server-action-adapter";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/auth/app-access", () => ({
  requireAuthenticatedMember: vi.fn(),
  requireServerActionAccess: vi.fn(),
}));

describe("server action adapter", () => {
  it("revalidates every requested path", () => {
    expect(revalidateActionPaths(["/", "/search"])).toEqual(["/", "/search"]);
    expect(revalidatePath).toHaveBeenCalledWith("/");
    expect(revalidatePath).toHaveBeenCalledWith("/search");
  });

  it("returns an action outcome state with revalidation metadata", () => {
    expect(
      actionSuccessWithRevalidation("已完成", { recordId: "record-1" }, [
        "/",
        "/search",
      ]),
    ).toEqual({
      status: "success",
      ok: true,
      message: "已完成",
      data: { recordId: "record-1" },
      revalidated: ["/", "/search"],
    });
  });
});
