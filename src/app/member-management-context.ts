import { createCurrentMemberDataSource } from "@/auth/current-member-data-source";
import { requireAppRouteAccess, type AppAccessSession } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import type { HouseholdMemberAccount } from "@/modules/identity-access/member-management";
import type { AppSearchParams } from "./route-search-params";

export type ReadyMemberManagementContext = Omit<
  AppAccessSession,
  never
> & {
  kind: "member-management";
  members: HouseholdMemberAccount[];
};

export type MemberManagementContext = ReadyMemberManagementContext;

export async function loadMemberManagementContext({
  searchParams,
}: {
  searchParams?: AppSearchParams;
}): Promise<MemberManagementContext> {
  await searchParams;
  const session = await requireAppRouteAccess("members");
  const members = await createCurrentMemberDataSource(
    getPrismaClient(),
  ).listHouseholdMembers();

  return {
    ...session,
    kind: "member-management",
    members,
  };
}
