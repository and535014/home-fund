import { createCurrentMemberDataSource } from "@/auth/current-member-data-source";
import { requireAppRouteAccess, type AppAccessSession } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import type {
  HouseholdMemberAccount,
  HouseholdMemberStatus,
} from "@/modules/identity-access/member-management";
import type { MemberRole } from "@/modules/identity-access/authorization";
import { buildInvitationLink } from "@/modules/identity-access/member-invitation-command";
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
  | "invited"
  | "renamed"
  | "permission_denied"
  | "invalid_email"
  | "member_already_active"
  | "invalid_display_name"
  | "member_not_found"
  | "cannot_remove_last_admin"
  | "member_must_have_role"
  | "duplicate_google_account_email"
  | "unknown_error";

export type CreatedInvitationResult = {
  email: string;
  invitationLink: string;
};

export type ReadyMemberManagementContext = Omit<
  AppAccessSession,
  never
> & {
  kind: "member-management";
  createdInvitation?: CreatedInvitationResult;
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
  const invitationLinks = await listPendingInvitationLinks();

  return {
    ...session,
    kind: "member-management",
    ...readMemberFeedback(resolvedSearchParams),
    members: members
      .filter(isVisibleMember)
      .map((member) => mapMemberAccountToManagementMember(
        member,
        invitationLinks,
      )),
  };
}

function readMemberFeedback(
  searchParams: Awaited<AppSearchParams> | undefined,
): {
  createdInvitation?: CreatedInvitationResult;
  memberResult?: MemberResult;
} {
  const value = readSearchParam(searchParams, "memberResult");
  const inviteEmail = readSearchParam(searchParams, "inviteEmail");
  const inviteLink = readSearchParam(searchParams, "inviteLink");

  if (isMemberResult(value)) {
    return {
      memberResult: value,
      ...(value === "invited" && inviteEmail && inviteLink
        ? {
            createdInvitation: {
              email: inviteEmail,
              invitationLink: inviteLink,
            },
          }
        : {}),
    };
  }

  return {};
}

function isMemberResult(value: unknown): value is MemberResult {
  return typeof value === "string" && [
    "invited",
    "renamed",
    "permission_denied",
    "invalid_email",
    "member_already_active",
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
  invitationLinks: Map<string, string>,
): MemberManagementMember {
  const email = member.googleAccountEmail ?? "";

  return {
    id: member.id,
    displayName: member.displayName,
    email,
    ...(member.avatarUrl ? { avatarUrl: member.avatarUrl } : {}),
    ...(member.status === "invited" && invitationLinks.has(member.id)
      ? { invitationLink: invitationLinks.get(member.id) }
      : {}),
    roles: member.roles,
    status: member.status,
  };
}

async function listPendingInvitationLinks(): Promise<Map<string, string>> {
  const invitations = await getPrismaClient().memberInvitation.findMany({
    where: {
      status: "pending",
      expiresAt: {
        gt: new Date(),
      },
      previewToken: {
        not: null,
      },
    },
    select: {
      memberId: true,
      previewToken: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const links = new Map<string, string>();

  invitations.forEach((invitation) => {
    if (!links.has(invitation.memberId) && invitation.previewToken) {
      links.set(invitation.memberId, buildInvitationLink(invitation.previewToken));
    }
  });

  return links;
}
