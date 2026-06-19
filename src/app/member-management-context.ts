import { createCurrentMemberDataSource } from "@/auth/current-member-data-source";
import { requireAppRouteAccess, type AppAccessSession } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import type {
  HouseholdMemberAccount,
  HouseholdMemberStatus,
} from "@/modules/identity-access/member-management";
import type { MemberRole } from "@/modules/identity-access/authorization";
import { readSearchParam, type AppSearchParams } from "./route-search-params";

export type MemberManagementMemberStatus = Extract<
  HouseholdMemberStatus,
  "active" | "invited"
>;

export type MemberManagementMember = {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  invitationLink?: string;
  roles: MemberRole[];
  status: MemberManagementMemberStatus;
};

export type MemberResult =
  | "renamed"
  | "permission_denied"
  | "invalid_display_name"
  | "member_not_found"
  | "cannot_remove_last_admin"
  | "member_must_have_role"
  | "duplicate_google_account_email"
  | "unknown_error";

export type ReadyMemberManagementContext = Omit<
  AppAccessSession,
  never
> & {
  kind: "member-management";
  memberResult?: MemberResult;
  members: MemberManagementMember[];
};

export type MemberManagementContext = ReadyMemberManagementContext;

export async function loadMemberManagementContext({
  searchParams,
}: {
  searchParams?: AppSearchParams;
}): Promise<MemberManagementContext> {
  const resolvedSearchParams = await searchParams;
  const session = await requireAppRouteAccess("members");
  const members = await createCurrentMemberDataSource(
    getPrismaClient(),
  ).listHouseholdMembers();

  return {
    ...session,
    kind: "member-management",
    ...readMemberResult(resolvedSearchParams),
    members: members
      .filter(isVisibleMember)
      .map(mapMemberAccountToManagementMember),
  };
}

function readMemberResult(
  searchParams: Awaited<AppSearchParams> | undefined,
): { memberResult?: MemberResult } {
  const value = readSearchParam(searchParams, "memberResult");

  if (isMemberResult(value)) {
    return { memberResult: value };
  }

  return {};
}

function isMemberResult(value: unknown): value is MemberResult {
  return typeof value === "string" && [
    "renamed",
    "permission_denied",
    "invalid_display_name",
    "member_not_found",
    "cannot_remove_last_admin",
    "member_must_have_role",
    "duplicate_google_account_email",
    "unknown_error",
  ].includes(value);
}

function isVisibleMember(
  member: HouseholdMemberAccount,
): member is HouseholdMemberAccount & { status: MemberManagementMemberStatus } {
  return member.status === "active" || member.status === "invited";
}

function mapMemberAccountToManagementMember(
  member: HouseholdMemberAccount & { status: MemberManagementMemberStatus },
): MemberManagementMember {
  const email = member.googleAccountEmail ?? "";

  return {
    id: member.id,
    displayName: member.displayName,
    email,
    ...(member.avatarUrl ? { avatarUrl: member.avatarUrl } : {}),
    ...(member.status === "invited" && email
      ? { invitationLink: buildInviteLink(email) }
      : {}),
    roles: member.roles,
    status: member.status,
  };
}

function buildInviteLink(email: string): string {
  const token = encodeURIComponent(`preview-existing-${email}`);

  return `/invite/accept?token=${token}`;
}
