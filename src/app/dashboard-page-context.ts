import { headers } from "next/headers";
import { getCurrentMemberFromHeaders } from "@/auth/server-current-member";
import { getPrismaClient } from "@/db/prisma";
import { getVisibleDashboardNavigationItems } from "./dashboard-navigation";
import {
  createHomeDashboardDataSource,
  type HomeDashboardData,
} from "./home-dashboard-data-source";
import {
  buildHomeAccessViewFromAccess,
  type HomeBlockedView,
  type HomeDashboardView,
} from "./home-access";
import { readDashboardMonth } from "./month-selection";

export type DashboardSearchParams =
  | Promise<Record<string, string | string[] | undefined> | URLSearchParams>
  | Record<string, string | string[] | undefined>
  | URLSearchParams
  | undefined;

export type BlockedDashboardPageContext = {
  kind: "blocked";
  view: HomeBlockedView;
};

export type ReadyDashboardPageContext = {
  kind: "dashboard";
  activeHref: string;
  createFeedbackResult?: string;
  createResult?: string;
  dashboardData: HomeDashboardData;
  homeView: HomeDashboardView;
  month: string;
  navigationItems: ReturnType<typeof getVisibleDashboardNavigationItems>;
  rawSearchParams:
    | Record<string, string | string[] | undefined>
    | URLSearchParams
    | undefined;
};

export type DashboardPageContext =
  | BlockedDashboardPageContext
  | ReadyDashboardPageContext;

const emptyDashboardData: HomeDashboardData = {
  householdMembers: [],
  categories: [],
  records: [],
  pendingOccurrences: [],
  pendingRecurringReminders: [],
};

export async function loadDashboardPageContext({
  activeHref,
  searchParams,
}: {
  activeHref: string;
  searchParams?: DashboardSearchParams;
}): Promise<DashboardPageContext> {
  const requestHeaders = new Headers(await headers());
  const currentMember = await getCurrentMemberFromHeaders(requestHeaders);
  const resolvedSearchParams = await searchParams;
  const month = readDashboardMonth(readSearchParam(resolvedSearchParams, "month"));
  const authError = readSearchParam(resolvedSearchParams, "error");
  const dashboardData = currentMember.ok
    ? await createHomeDashboardDataSource(getPrismaClient()).getMonthlyDashboardData(
        month,
      )
    : emptyDashboardData;
  const homeView = buildHomeAccessViewFromAccess({
    access: currentMember,
    authError,
    householdMembers: dashboardData.householdMembers,
    month,
    records: dashboardData.records,
    categories: dashboardData.categories,
    pendingOccurrences: dashboardData.pendingOccurrences,
    pendingRecurringReminders: dashboardData.pendingRecurringReminders,
  });

  if (homeView.kind !== "dashboard") {
    return {
      kind: "blocked",
      view: homeView,
    };
  }

  return {
    kind: "dashboard",
    activeHref,
    createFeedbackResult: readSearchParam(resolvedSearchParams, "result"),
    createResult: readSearchParam(resolvedSearchParams, "create"),
    dashboardData,
    homeView,
    month,
    navigationItems: getVisibleDashboardNavigationItems(
      homeView.accessHints,
      activeHref,
    ),
    rawSearchParams: resolvedSearchParams,
  };
}

export function readSearchParam(
  searchParams:
    | Record<string, string | string[] | undefined>
    | URLSearchParams
    | undefined,
  key: string,
): string | undefined {
  if (!searchParams) {
    return undefined;
  }

  if (searchParams instanceof URLSearchParams) {
    return searchParams.get(key) ?? undefined;
  }

  const value = searchParams[key];

  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}
