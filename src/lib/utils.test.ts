import { describe, expect, it } from "vitest";

import { cn } from "@/lib/utils";

describe("cn", () => {
  it("keeps project text size tokens with text color utilities", () => {
    expect(cn("text-caption", "text-muted-foreground")).toBe(
      "text-caption text-muted-foreground",
    );
    expect(cn("text-body-strong", "text-primary")).toBe(
      "text-body-strong text-primary",
    );
  });
});
