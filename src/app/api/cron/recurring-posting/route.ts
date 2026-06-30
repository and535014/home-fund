import { NextResponse } from "next/server";
import { getPrismaClient } from "@/db/prisma";
import {
  runRecurringPostingJob,
  type RecurringEventPostingJobPrismaClient,
} from "@/modules/recurring/recurring-event-command";

export async function GET(request: Request) {
  const authorization = request.headers.get("authorization");
  const secret = process.env.RECURRING_POSTING_CRON_SECRET || process.env.CRON_SECRET;

  if (process.env.NODE_ENV === "production" && !secret) {
    return NextResponse.json(
      { ok: false, reason: "missing_cron_secret" },
      { status: 500 },
    );
  }

  if (secret && authorization !== `Bearer ${secret}`) {
    return NextResponse.json(
      { ok: false, reason: "unauthorized" },
      { status: 401 },
    );
  }

  try {
    const result = await runRecurringPostingJob({
      prisma: getPrismaClient() as unknown as RecurringEventPostingJobPrismaClient,
      targetDate: new Date(),
    });

    return NextResponse.json({
      ok: true,
      alreadyPostedCount: result.alreadyPostedCount,
      householdCount: result.householdCount,
      pendingCount: result.pendingCount,
      postedCount: result.postedCount,
      skippedCount: result.skippedCount,
      skippedHouseholdCount: result.skippedHouseholdCount,
      targetMonth: result.targetMonth,
    });
  } catch (error) {
    console.error("Recurring posting cron failed", error);

    return NextResponse.json(
      { ok: false, reason: "job_failed" },
      { status: 500 },
    );
  }
}
