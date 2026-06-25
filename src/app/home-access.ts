import type { Category } from "../modules/categorization/category-catalog";
import type { LedgerRecord } from "../modules/fund-ledger/ledger-records";
import { buildAccessHints, type AccessHints } from "../modules/identity-access/access-hints";
import {
  buildHomeBlockedViewFromAccess,
  type HomeBlockedView,
} from "../modules/identity-access/home-blocked-view";
import type { HouseholdMemberAccount } from "../modules/identity-access/member-management";
import {
  resolveHouseholdAccess,
  type GoogleIdentity,
  type HouseholdAccessProfile,
  type ResolveHouseholdAccessResult,
} from "../modules/identity-access/session-access";
import { buildMonthlyReport, type MonthlyReport } from "../modules/reporting/monthly-report";
import {
  buildMonthlyReimbursementTable,
  type MonthlyReimbursementTable,
} from "../modules/reimbursement/reimbursement-table";

export type HomeAccessInput = {
  googleIdentity: GoogleIdentity | null;
  householdMembers: HouseholdMemberAccount[];
  month: string;
  categories: Category[];
  records: LedgerRecord[];
};

export type ResolvedHomeAccessInput = Omit<
  HomeAccessInput,
  "googleIdentity"
> & {
  access: ResolveHouseholdAccessResult;
  authError?: string;
};

export type HomeDashboardView = {
  kind: "dashboard";
  profile: HouseholdAccessProfile;
  accessHints: AccessHints;
  reimbursementTable: MonthlyReimbursementTable;
  report: MonthlyReport;
};

export type HomeAccessView = HomeBlockedView | HomeDashboardView;

export function buildHomeAccessView(input: HomeAccessInput): HomeAccessView {
  const access = resolveHouseholdAccess({
    googleIdentity: input.googleIdentity,
    members: input.householdMembers,
  });

  return buildHomeAccessViewFromAccess({
    ...input,
    access,
  });
}

export function buildHomeAccessViewFromAccess(
  input: ResolvedHomeAccessInput,
): HomeAccessView {
  const { access } = input;

  if (!access.ok) {
    return buildHomeBlockedViewFromAccess(access, input.authError);
  }

  const reimbursementTable = buildMonthlyReimbursementTable({
    month: input.month,
    members: input.householdMembers,
    records: input.records,
  });
  const report = buildMonthlyReport({
    month: input.month,
    records: input.records,
    categories: input.categories,
    reimbursementTable,
  });

  return {
    kind: "dashboard",
    profile: access.profile,
    accessHints: buildAccessHints(access.member),
    reimbursementTable,
    report,
  };
}
