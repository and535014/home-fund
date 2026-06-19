export type MemberRole = "admin" | "finance_manager" | "general_member";
export type MemberCapability = "manage_categories" | "manage_recurring";

export type AuthenticatedMember = {
  id: string;
  googleAccountLinked: boolean;
  roles: MemberRole[];
  capabilities?: MemberCapability[];
};

export type AuthorizationCommand =
  | { type: "browse_household_records" }
  | { type: "manage_members" }
  | { type: "manage_categories" }
  | { type: "manage_recurring" }
  | { type: "create_income_record"; targetMemberId: string }
  | { type: "create_expense_record"; targetMemberId: string }
  | { type: "edit_ledger_record"; recordOwnerId: string }
  | { type: "delete_ledger_record"; recordOwnerId: string }
  | { type: "perform_reimbursement" };

export type AuthorizationResult =
  | { allowed: true }
  | {
      allowed: false;
      reason:
        | "google_account_not_linked"
        | "admin_required"
        | "category_manager_required"
        | "recurring_manager_required"
        | "finance_manager_required"
        | "cannot_create_record_for_other_member"
        | "cannot_edit_other_member_record"
        | "cannot_delete_other_member_record"
        | "finance_manager_cannot_delete_other_member_record";
    };

export function authorize(
  member: AuthenticatedMember,
  command: AuthorizationCommand,
): AuthorizationResult {
  if (!member.googleAccountLinked) {
    return { allowed: false, reason: "google_account_not_linked" };
  }

  if (command.type === "browse_household_records") {
    return { allowed: true };
  }

  if (command.type === "manage_members") {
    return hasRole(member, "admin")
      ? { allowed: true }
      : { allowed: false, reason: "admin_required" };
  }

  if (command.type === "manage_categories") {
    return hasRole(member, "admin")
      ? { allowed: true }
      : { allowed: false, reason: "admin_required" };
  }

  if (command.type === "manage_recurring") {
    return hasRole(member, "admin") || hasCapability(member, "manage_recurring")
      ? { allowed: true }
      : { allowed: false, reason: "recurring_manager_required" };
  }

  if (
    command.type === "create_income_record" ||
    command.type === "create_expense_record"
  ) {
    return canCreateRecordFor(member, command.targetMemberId);
  }

  if (command.type === "edit_ledger_record") {
    return canEditRecord(member, command.recordOwnerId);
  }

  if (command.type === "delete_ledger_record") {
    return canDeleteRecord(member, command.recordOwnerId);
  }

  if (command.type === "perform_reimbursement") {
    return hasRole(member, "admin") || hasRole(member, "finance_manager")
      ? { allowed: true }
      : { allowed: false, reason: "finance_manager_required" };
  }

  return exhaustive(command);
}

function canCreateRecordFor(
  member: AuthenticatedMember,
  targetMemberId: string,
): AuthorizationResult {
  if (hasRole(member, "admin") || hasRole(member, "finance_manager")) {
    return { allowed: true };
  }

  if (member.id === targetMemberId) {
    return { allowed: true };
  }

  return { allowed: false, reason: "cannot_create_record_for_other_member" };
}

function canEditRecord(
  member: AuthenticatedMember,
  recordOwnerId: string,
): AuthorizationResult {
  if (hasRole(member, "admin") || hasRole(member, "finance_manager")) {
    return { allowed: true };
  }

  if (member.id === recordOwnerId) {
    return { allowed: true };
  }

  return { allowed: false, reason: "cannot_edit_other_member_record" };
}

function canDeleteRecord(
  member: AuthenticatedMember,
  recordOwnerId: string,
): AuthorizationResult {
  if (hasRole(member, "admin")) {
    return { allowed: true };
  }

  if (member.id === recordOwnerId) {
    return { allowed: true };
  }

  if (hasRole(member, "finance_manager")) {
    return {
      allowed: false,
      reason: "finance_manager_cannot_delete_other_member_record",
    };
  }

  return { allowed: false, reason: "cannot_delete_other_member_record" };
}

function hasRole(member: AuthenticatedMember, role: MemberRole): boolean {
  return member.roles.includes(role);
}

function hasCapability(
  member: AuthenticatedMember,
  capability: MemberCapability,
): boolean {
  return member.capabilities?.includes(capability) ?? false;
}

function exhaustive(value: never): never {
  throw new Error(`Unhandled authorization command: ${JSON.stringify(value)}`);
}
