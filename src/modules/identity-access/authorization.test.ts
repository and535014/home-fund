import { describe, expect, it } from "vitest";
import {
  authorize,
  type AuthorizationCommand,
  type AuthenticatedMember,
} from "./authorization";

const generalMember: AuthenticatedMember = {
  id: "member-a",
  googleAccountLinked: true,
  roles: ["general_member"],
};

const financeManager: AuthenticatedMember = {
  id: "member-finance",
  googleAccountLinked: true,
  roles: ["finance_manager"],
};

const admin: AuthenticatedMember = {
  id: "member-admin",
  googleAccountLinked: true,
  roles: ["admin"],
};

const categoryManager: AuthenticatedMember = {
  id: "member-category",
  googleAccountLinked: true,
  roles: ["general_member"],
  capabilities: ["manage_categories"],
};

const recurringManager: AuthenticatedMember = {
  id: "member-recurring",
  googleAccountLinked: true,
  roles: ["general_member"],
  capabilities: ["manage_recurring"],
};

function command(
  type: AuthorizationCommand["type"],
  target: Omit<AuthorizationCommand, "type"> = {},
): AuthorizationCommand {
  return { type, ...target } as AuthorizationCommand;
}

describe("authorize", () => {
  it("rejects a Google account that is not linked to an app member", () => {
    const result = authorize(
      {
        id: "external-google-user",
        googleAccountLinked: false,
        roles: ["general_member"],
      },
      command("browse_household_records"),
    );

    expect(result).toEqual({
      allowed: false,
      reason: "google_account_not_linked",
    });
  });

  it("allows every linked member to browse household records", () => {
    expect(
      authorize(generalMember, command("browse_household_records")),
    ).toEqual({ allowed: true });
  });

  it("rejects a general member creating records for another member", () => {
    const result = authorize(
      generalMember,
      command("create_expense_record", { targetMemberId: "member-b" }),
    );

    expect(result).toEqual({
      allowed: false,
      reason: "cannot_create_record_for_other_member",
    });
  });

  it("allows a finance manager to create records for another member", () => {
    expect(
      authorize(
        financeManager,
        command("create_expense_record", { targetMemberId: "member-b" }),
      ),
    ).toEqual({ allowed: true });
  });

  it("rejects a finance manager deleting another member's record in the MVP permission set", () => {
    const result = authorize(
      financeManager,
      command("delete_ledger_record", { recordOwnerId: "member-b" }),
    );

    expect(result).toEqual({
      allowed: false,
      reason: "finance_manager_cannot_delete_other_member_record",
    });
  });

  it("allows an admin to delete another member's record", () => {
    expect(
      authorize(admin, command("delete_ledger_record", { recordOwnerId: "b" })),
    ).toEqual({ allowed: true });
  });

  it("allows only finance managers to perform reimbursement", () => {
    expect(authorize(financeManager, command("perform_reimbursement"))).toEqual({
      allowed: true,
    });
    expect(authorize(admin, command("perform_reimbursement"))).toEqual({
      allowed: false,
      reason: "finance_manager_required",
    });
  });

  it("allows admins and explicit category managers to manage categories", () => {
    expect(authorize(admin, command("manage_categories"))).toEqual({
      allowed: true,
    });
    expect(authorize(categoryManager, command("manage_categories"))).toEqual({
      allowed: true,
    });
    expect(authorize(generalMember, command("manage_categories"))).toEqual({
      allowed: false,
      reason: "category_manager_required",
    });
  });

  it("allows admins and explicit recurring managers to manage recurring rules", () => {
    expect(authorize(admin, command("manage_recurring"))).toEqual({
      allowed: true,
    });
    expect(authorize(recurringManager, command("manage_recurring"))).toEqual({
      allowed: true,
    });
    expect(authorize(generalMember, command("manage_recurring"))).toEqual({
      allowed: false,
      reason: "recurring_manager_required",
    });
  });
});
