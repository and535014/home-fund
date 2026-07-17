import { describe, expect, it } from "vitest";
import { recurringPostingSystemActor } from "./system-actor";

describe("recurringPostingSystemActor", () => {
  it("creates a household-scoped recurring posting actor without a Member identity", () => {
    expect(recurringPostingSystemActor("household-demo")).toEqual({
      kind: "system",
      capability: "post_recurring_occurrence",
      householdId: "household-demo",
    });
  });
});
