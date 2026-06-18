export const recurringReminderFeedbackValues = [
  "confirmed",
  "permission_denied",
  "missing_occurrence",
  "occurrence_already_posted",
  "occurrence_rule_mismatch",
  "ledger_record_creation_failed",
  "invalid_amount",
  "invalid_day_of_month",
  "missing_category",
  "archived_category",
  "category_type_mismatch",
  "missing_income_source_member",
  "missing_payment_source",
  "missing_member_payer",
  "stale_confirmation",
] as const;

export type RecurringReminderFeedback =
  (typeof recurringReminderFeedbackValues)[number];
