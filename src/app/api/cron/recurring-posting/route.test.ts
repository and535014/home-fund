import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getPrismaClient } from "@/db/prisma";
import { runRecurringPostingJob } from "@/modules/recurring/recurring-event-command";
import { GET } from "./route";

vi.mock("@/db/prisma", () => ({
  getPrismaClient: vi.fn(),
}));

vi.mock("@/modules/recurring/recurring-event-command", () => ({
  runRecurringPostingJob: vi.fn(),
}));

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-30T16:30:00.000Z"));
  vi.stubEnv("RECURRING_POSTING_CRON_SECRET", "cron-secret");
  vi.mocked(getPrismaClient).mockReturnValue({ client: "prisma" } as never);
  vi.mocked(runRecurringPostingJob).mockResolvedValue({
    alreadyPostedCount: 1,
    householdCount: 2,
    pendingCount: 3,
    postedCount: 4,
    skippedCount: 5,
    skippedHouseholdCount: 1,
    targetMonth: "2026-07",
  });
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

describe("GET /api/cron/recurring-posting", () => {
  it("rejects invalid credentials", async () => {
    const response = await GET(new Request("https://example.com/api/cron/recurring-posting", {
      headers: { authorization: "Bearer wrong-secret" },
    }));

    await expect(response.json()).resolves.toEqual({
      ok: false,
      reason: "unauthorized",
    });
    expect(response.status).toBe(401);
    expect(runRecurringPostingJob).not.toHaveBeenCalled();
  });

  it("runs the posting job and returns summary counts", async () => {
    const response = await GET(new Request("https://example.com/api/cron/recurring-posting", {
      headers: { authorization: "Bearer cron-secret" },
    }));

    await expect(response.json()).resolves.toEqual({
      ok: true,
      alreadyPostedCount: 1,
      householdCount: 2,
      pendingCount: 3,
      postedCount: 4,
      skippedCount: 5,
      skippedHouseholdCount: 1,
      targetMonth: "2026-07",
    });
    expect(runRecurringPostingJob).toHaveBeenCalledWith({
      prisma: { client: "prisma" },
      targetDate: new Date("2026-06-30T16:30:00.000Z"),
    });
  });

  it("accepts Vercel CRON_SECRET when the recurring-specific secret is absent", async () => {
    vi.stubEnv("RECURRING_POSTING_CRON_SECRET", "");
    vi.stubEnv("CRON_SECRET", "vercel-cron-secret");

    const response = await GET(new Request("https://example.com/api/cron/recurring-posting", {
      headers: { authorization: "Bearer vercel-cron-secret" },
    }));

    expect(response.status).toBe(200);
    expect(runRecurringPostingJob).toHaveBeenCalled();
  });
});
