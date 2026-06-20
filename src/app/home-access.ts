import type { Category } from "../modules/categorization/category-catalog";
import type { LedgerRecord } from "../modules/fund-ledger/ledger-records";
import { buildAccessHints, type AccessHints } from "../modules/identity-access/access-hints";
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

export type HomeBlockedView = {
  kind: "unauthenticated" | "google_account_not_linked" | "member_not_active";
  title: string;
  description: string;
  primaryActionLabel: string;
  errorCode?: string;
  errorMessage?: string;
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

export function buildHomeBlockedViewFromAccess(
  access: Exclude<ResolveHouseholdAccessResult, { ok: true }>,
  authError?: string,
): HomeBlockedView {
  return blockedViewFor(access.reason, authError);
}

function blockedViewFor(
  reason: Exclude<ReturnType<typeof resolveHouseholdAccess>, { ok: true }>["reason"],
  authError?: string,
): HomeBlockedView {
  if (reason === "unauthenticated") {
    return {
      kind: "unauthenticated",
      title: "請先使用 Google 登入",
      description: "登入後才能查看家庭共用金、收支紀錄與退款資訊。",
      primaryActionLabel: "使用 Google 登入",
      ...authErrorMessageFor(authError),
    };
  }

  if (reason === "google_account_not_linked") {
    return {
      kind: "google_account_not_linked",
      title: "找不到家庭成員帳號",
      description: "這個 Google 帳號尚未被管理員邀請或連結，請確認登入帳號是否正確。",
      primaryActionLabel: "重新選擇 Google 帳號",
      ...authErrorMessageFor(authError),
    };
  }

  return {
    kind: "member_not_active",
    title: "帳號尚未啟用",
    description: "你的家庭成員帳號目前不是啟用狀態，請聯絡管理員確認權限。",
    primaryActionLabel: "重新整理狀態",
    ...authErrorMessageFor(authError),
  };
}

function authErrorMessageFor(
  authError: string | undefined,
): Pick<HomeBlockedView, "errorCode" | "errorMessage"> {
  if (!authError) {
    return {};
  }

  if (authError === "state_mismatch") {
    return {
      errorCode: authError,
      errorMessage:
        "登入驗證狀態已失效，請重新點選 Google 登入。若仍發生，請清除 localhost 的 cookie 後再試一次。",
    };
  }

  return {
    errorCode: authError,
    errorMessage: "Google 登入沒有完成，請重新嘗試。",
  };
}
