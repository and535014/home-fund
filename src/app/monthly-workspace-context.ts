import { getPrismaClient } from "@/db/prisma";
import { requireAuthenticatedMember } from "@/auth/app-access";
import {
  createHomeDashboardDataSource,
  type HomeDashboardData,
} from "./home-dashboard-data-source";
import {
  buildHomeAccessViewFromAccess,
  type HomeDashboardView,
} from "./home-access";
import { readDashboardMonth } from "./month-selection";
import type { AppAccessSession } from "@/auth/app-access";
import { readSearchParam, type AppSearchParams } from "./route-search-params";

export type ReadyMonthlyWorkspaceContext = Omit<
  AppAccessSession,
  never
> & {
  kind: "workspace";
  dashboardData: HomeDashboardData;
  homeView: HomeDashboardView;
  month: string;
  rawSearchParams:
    | Record<string, string | string[] | undefined>
    | URLSearchParams
    | undefined;
};

export type MonthlyWorkspaceContext = ReadyMonthlyWorkspaceContext;

export async function loadMonthlyWorkspaceContext({
  searchParams,
}: {
  searchParams?: AppSearchParams;
}): Promise<MonthlyWorkspaceContext> {
  const session = await requireAuthenticatedMember();
  const rawSearchParams = await searchParams;
  const month = readDashboardMonth(
    readSearchParam(rawSearchParams, "month"),
  );
  const dashboardData = await createHomeDashboardDataSource(
    getPrismaClient(),
  ).getMonthlyDashboardData(session.access.member.householdId, month);
  const homeView = buildHomeAccessViewFromAccess({
    access: session.access,
    authError: readSearchParam(rawSearchParams, "error"),
    householdMembers: dashboardData.householdMembers,
    month,
    records: dashboardData.records,
    categories: dashboardData.categories,
  });

  if (homeView.kind !== "dashboard") {
    throw new Error("Authenticated monthly workspace resolved to blocked view.");
  }

  return {
    ...session,
    kind: "workspace",
    dashboardData,
    homeView,
    month,
    rawSearchParams,
  };
}
