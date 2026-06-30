import type {
  CreateRecurringEventCommand,
  RecurringSchedule,
} from "@/modules/recurring/recurring-event";

type ParseResult<TCommand, TReason extends string> =
  | {
      ok: true;
      command: TCommand;
    }
  | {
      ok: false;
      reason: TReason;
    };

type CreateRecurringEventFormFailureReason =
  | "invalid_amount"
  | "invalid_payment_source"
  | "invalid_posting_mode"
  | "invalid_record_type"
  | "invalid_recurrence_schedule"
  | "invalid_schedule_day"
  | "missing_category"
  | "missing_name"
  | "missing_payer_member"
  | "missing_source_member";

export function parseCreateRecurringEventForm(
  formData: FormData,
): ParseResult<CreateRecurringEventCommand, CreateRecurringEventFormFailureReason> {
  const type = readFormString(formData, "recordType");
  const name = readFormString(formData, "name");
  const amountCents = parseAmountCents(readFormString(formData, "amountTwd"));
  const categoryId = readFormString(formData, "categoryId");
  const postingMode = readFormString(formData, "postingMode");
  const schedule = parseRecurringSchedule(formData);
  const note = readOptionalFormString(formData, "note");

  if (!name) {
    return { ok: false, reason: "missing_name" };
  }

  if (amountCents === null) {
    return { ok: false, reason: "invalid_amount" };
  }

  if (!categoryId) {
    return { ok: false, reason: "missing_category" };
  }

  if (!schedule.ok) {
    return schedule;
  }

  if (postingMode !== "immediate" && postingMode !== "reminder") {
    return { ok: false, reason: "invalid_posting_mode" };
  }

  if (type === "income") {
    const sourceMemberId = readFormString(formData, "sourceMemberId");

    if (!sourceMemberId) {
      return { ok: false, reason: "missing_source_member" };
    }

    return {
      ok: true,
      command: {
        amountCents,
        categoryId,
        name,
        postingMode,
        schedule: schedule.schedule,
        sourceMemberId,
        type: "income",
        ...(note ? { note } : {}),
      } satisfies CreateRecurringEventCommand,
    };
  }

  if (type !== "expense") {
    return { ok: false, reason: "invalid_record_type" };
  }

  const paymentSource = readFormString(formData, "paymentSource");

  if (paymentSource === "fund") {
    return {
      ok: true,
      command: {
        amountCents,
        categoryId,
        name,
        paymentSource,
        postingMode,
        schedule: schedule.schedule,
        type: "expense",
        ...(note ? { note } : {}),
      } satisfies CreateRecurringEventCommand,
    };
  }

  if (paymentSource !== "member") {
    return { ok: false, reason: "invalid_payment_source" };
  }

  const payerMemberId = readFormString(formData, "payerMemberId");

  if (!payerMemberId) {
    return { ok: false, reason: "missing_payer_member" };
  }

  return {
    ok: true,
    command: {
      amountCents,
      categoryId,
      name,
      payerMemberId,
      paymentSource,
      postingMode,
      schedule: schedule.schedule,
      type: "expense",
      ...(note ? { note } : {}),
    } satisfies CreateRecurringEventCommand,
  };
}

export function parseDeleteRecurringEventForm(
  formData: FormData,
): ParseResult<{ recurringEventId: string }, "missing_recurring_event_id"> {
  const recurringEventId = readFormString(formData, "recurringEventId");

  if (!recurringEventId) {
    return { ok: false, reason: "missing_recurring_event_id" };
  }

  return {
    ok: true,
    command: { recurringEventId },
  };
}

export function parseConfirmRecurringOccurrenceForm(
  formData: FormData,
): ParseResult<{ occurrenceId: string }, "missing_occurrence_id"> {
  const occurrenceId = readFormString(formData, "occurrenceId");

  if (!occurrenceId) {
    return { ok: false, reason: "missing_occurrence_id" };
  }

  return {
    ok: true,
    command: { occurrenceId },
  };
}

function parseRecurringSchedule(formData: FormData):
  | {
      ok: true;
      schedule: RecurringSchedule;
    }
  | {
      ok: false;
      reason: "invalid_recurrence_schedule" | "invalid_schedule_day";
    } {
  const recurrenceSchedule = readFormString(formData, "recurrenceSchedule");

  if (recurrenceSchedule === "month_end") {
    return {
      ok: true,
      schedule: { anchor: "month_end" },
    };
  }

  if (recurrenceSchedule !== "fixed_day") {
    return { ok: false, reason: "invalid_recurrence_schedule" };
  }

  const dayOfMonth = Number(readFormString(formData, "recurrenceDay"));

  if (!Number.isInteger(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 28) {
    return { ok: false, reason: "invalid_schedule_day" };
  }

  return {
    ok: true,
    schedule: {
      anchor: "fixed_day",
      dayOfMonth,
    },
  };
}

function parseAmountCents(value: string): number | null {
  if (!/^\d+(?:\.\d{1,2})?$/u.test(value)) {
    return null;
  }

  const [dollars, cents = ""] = value.split(".");
  const amountCents = Number(dollars) * 100 + Number(cents.padEnd(2, "0"));

  return amountCents > 0 ? amountCents : null;
}

function readFormString(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

function readOptionalFormString(formData: FormData, key: string): string | undefined {
  const value = readFormString(formData, key);

  return value || undefined;
}
