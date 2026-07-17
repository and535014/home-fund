export type RecurringPostingSystemActor = {
  kind: "system";
  capability: "post_recurring_occurrence";
  householdId: string;
};

export function recurringPostingSystemActor(
  householdId: string,
): RecurringPostingSystemActor {
  return {
    kind: "system",
    capability: "post_recurring_occurrence",
    householdId,
  };
}
