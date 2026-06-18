import { headers } from "next/headers";
import { CreateRecordDialog } from "./create-record-dialog";
import { CreateRecordToast } from "./create-record-toast";
import { DashboardAccessScreen } from "./dashboard-access-screen";
import { getVisibleDashboardNavigationItems } from "./dashboard-navigation";
import {
  createHomeDashboardDataSource,
  type HomeDashboardData,
} from "./home-dashboard-data-source";
import { HomeDashboardLayout } from "./home-dashboard-layout";
import { buildHomeAccessViewFromAccess } from "./home-access";
import { readDashboardMonth } from "./month-selection";
import { confirmRecurringReminderAction } from "./recurring-reminder-actions";
import {
  recurringReminderFeedbackValues,
  type RecurringReminderFeedback,
} from "./recurring-reminder-feedback";
import {
  RecurringReminderConfirmationPanel,
} from "./recurring-reminder-confirmation-panel";
import { markExpensesReimbursedAction } from "./reimbursement-actions";
import { ReimbursementSettlementPanel } from "./reimbursement-settlement-panel";
import { getCurrentMemberFromHeaders } from "@/auth/server-current-member";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getPrismaClient } from "@/db/prisma";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";

const emptyDashboardData: HomeDashboardData = {
  householdMembers: [],
  categories: [],
  records: [],
  pendingOccurrences: [],
  pendingRecurringReminders: [],
};

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined> | URLSearchParams>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const requestHeaders = new Headers(await headers());
  const currentMember = await getCurrentMemberFromHeaders(requestHeaders);
  const resolvedSearchParams = await searchParams;
  const dashboardMonth = readDashboardMonth(
    readSearchParam(resolvedSearchParams, "month"),
  );
  const authError = readSearchParam(resolvedSearchParams, "error");
  const createResult = readSearchParam(resolvedSearchParams, "create");
  const createFeedbackResult = readSearchParam(resolvedSearchParams, "result");
  const reimbursementFeedback = readReimbursementFeedback(
    readSearchParam(resolvedSearchParams, "reimbursement"),
  );
  const recurringFeedback = readRecurringReminderFeedback(
    readSearchParam(resolvedSearchParams, "recurring"),
  );
  const dashboardData = currentMember.ok
    ? await getDashboardData(dashboardMonth)
    : emptyDashboardData;
  const homeView = buildHomeAccessViewFromAccess({
    access: currentMember,
    authError,
    householdMembers: dashboardData.householdMembers,
    month: dashboardMonth,
    records: dashboardData.records,
    categories: dashboardData.categories,
    pendingOccurrences: dashboardData.pendingOccurrences,
    pendingRecurringReminders: dashboardData.pendingRecurringReminders,
  });

  if (homeView.kind !== "dashboard") {
    return <DashboardAccessScreen view={homeView} />;
  }

  const {
    accessHints,
    pendingRecurringReminders,
    profile,
    reimbursementTable,
    report,
  } = homeView;
  const visibleNavigationItems = getVisibleDashboardNavigationItems(
    accessHints,
    "/",
  );
  const categoryNames = new Map(
    dashboardData.categories.map((category) => [category.id, category.name]),
  );
  const createRecordMode = readCreateRecordMode(createResult);
  const createRecordFeedback = readCreateRecordFeedback(
    createResult,
    createFeedbackResult,
  );

  return (
    <HomeDashboardLayout
      canCreateOwnRecords={accessHints.actions.canCreateOwnRecords}
      createExpenseHref={`/?month=${encodeURIComponent(dashboardMonth)}&create=expense`}
      createIncomeHref={`/?month=${encodeURIComponent(dashboardMonth)}&create=income`}
      createRecordDialogContent={
        createRecordMode ? (
          <CreateRecordDialog
            canCreateRecordsForOthers={accessHints.actions.canCreateRecordsForOthers}
            categories={dashboardData.categories}
            defaultOpen={createRecordMode !== undefined}
            feedback={createRecordFeedback}
            members={dashboardData.householdMembers}
            mode={createRecordMode}
            month={dashboardMonth}
            profile={profile}
          />
        ) : undefined
      }
      currentMonth={dashboardMonth}
      displayName={profile.displayName}
      navigationItems={visibleNavigationItems}
    >
          <section
            aria-label="月報摘要"
            className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"
          >
            <SummaryMetric
              label="確認收入"
              tone="income"
              value={formatAmount(report.totals.confirmedIncomeCents)}
            />
            <SummaryMetric
              label="確認支出"
              tone="expense"
              value={formatAmount(report.totals.confirmedExpenseCents)}
            />
            <SummaryMetric
              label="本月結餘"
              tone="default"
              value={formatAmount(report.totals.netCents)}
            />
            <SummaryMetric
              label="待退款"
              tone="default"
              value={formatAmount(report.reimbursementSummary.refundableTotalCents)}
            />
          </section>

          <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(20rem,0.8fr)]">
            <section aria-labelledby="records-title" className="min-w-0">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 id="records-title" className="text-subheading">
                    本月紀錄
                  </h3>
                  <p className="text-caption text-muted-foreground">
                    {report.recordIds.length} 筆確認紀錄
                  </p>
                </div>
              </div>
              <Card className="overflow-hidden">
                <Table className="min-w-[34rem] sm:min-w-0">
                  <TableHeader>
                    <TableRow>
                      <TableHead>日期</TableHead>
                      <TableHead>分類</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead className="text-right">金額</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dashboardData.records
                      .filter((record) => record.occurredOn.startsWith(`${dashboardMonth}-`))
                      .map((record) => (
                        <RecordRow
                          categoryNames={categoryNames}
                          key={record.id}
                          record={record}
                        />
                      ))}
                  </TableBody>
                </Table>
              </Card>
            </section>

            <aside className="grid gap-5">
              <ReimbursementSettlementPanel
                canPerformReimbursement={accessHints.actions.canPerformReimbursement}
                feedback={reimbursementFeedback}
                markExpensesReimbursedAction={markExpensesReimbursedAction}
                month={dashboardMonth}
                reimbursementTable={reimbursementTable}
              />

              <section aria-labelledby="category-title">
                <h3 id="category-title" className="mb-3 text-subheading">
                  分類摘要
                </h3>
                <Card>
                  <CardContent className="grid gap-3">
                    {report.categorySummaries.map((summary) => (
                      <div className="grid gap-1" key={summary.categoryId}>
                        <div className="flex items-center justify-between gap-3 text-label">
                          <span>{summary.categoryName}</span>
                          <span
                            className={
                              summary.type === "income"
                                ? "text-income"
                                : "text-expense"
                            }
                          >
                            {formatAmount(summary.totalAmountCents)}
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-pill bg-secondary">
                          <div
                            className={`h-full rounded-pill ${
                              summary.type === "income" ? "bg-income" : "bg-expense"
                            }`}
                            style={{
                              width: `${Math.max(
                                12,
                                Math.min(
                                  100,
                                  (summary.totalAmountCents /
                                    Math.max(
                                      report.totals.confirmedIncomeCents,
                                      report.totals.confirmedExpenseCents,
                                    )) *
                                    100,
                                ),
                              )}%`,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </section>

              <RecurringReminderConfirmationPanel
                confirmRecurringReminderAction={confirmRecurringReminderAction}
                feedback={recurringFeedback}
                month={dashboardMonth}
                pendingReminders={pendingRecurringReminders}
              />
            </aside>
          </div>
          {createResult === "success" ? <CreateRecordToast /> : null}
    </HomeDashboardLayout>
  );
}

async function getDashboardData(
  month: string,
): Promise<HomeDashboardData> {
  return createHomeDashboardDataSource(getPrismaClient()).getMonthlyDashboardData(
    month,
  );
}

function readSearchParam(
  searchParams: Record<string, string | string[] | undefined> | URLSearchParams | undefined,
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

function readCreateRecordFeedback(
  createResult: string | undefined,
  createFeedbackResult: string | undefined,
): string | undefined {
  if (createFeedbackResult) {
    return createFeedbackResult;
  }

  if (
    !createResult ||
    createResult === "open" ||
    createResult === "income" ||
    createResult === "expense" ||
    createResult === "success"
  ) {
    return undefined;
  }

  return createResult;
}

function readCreateRecordMode(
  createResult: string | undefined,
): "income" | "expense" | undefined {
  if (createResult === "income" || createResult === "open") {
    return "income";
  }

  if (createResult === "expense") {
    return "expense";
  }

  return undefined;
}

function readReimbursementFeedback(
  reimbursementResult: string | undefined,
):
  | "success"
  | "permission_denied"
  | "empty_selection"
  | "expense_not_found"
  | "not_refundable"
  | "already_reimbursed"
  | undefined {
  if (
    reimbursementResult === "success" ||
    reimbursementResult === "permission_denied" ||
    reimbursementResult === "empty_selection" ||
    reimbursementResult === "expense_not_found" ||
    reimbursementResult === "not_refundable" ||
    reimbursementResult === "already_reimbursed"
  ) {
    return reimbursementResult;
  }

  return undefined;
}

function readRecurringReminderFeedback(
  recurringResult: string | undefined,
): RecurringReminderFeedback | undefined {
  if (!recurringResult) {
    return undefined;
  }

  return recurringReminderFeedbackValues.find((value) => value === recurringResult);
}

function SummaryMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "default" | "income" | "expense";
}) {
  const valueColor =
    tone === "income" ? "text-income" : tone === "expense" ? "text-expense" : "text-foreground";

  return (
    <Card>
      <CardContent>
      <p className="text-label text-muted-foreground">{label}</p>
      <p className={`mt-2 text-heading ${valueColor}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function RecordRow({
  categoryNames,
  record,
}: {
  categoryNames: Map<string, string>;
  record: LedgerRecord;
}) {
  const isIncome = record.type === "income";

  return (
    <TableRow>
      <TableCell className="text-caption text-muted-foreground">
        {record.occurredOn}
      </TableCell>
      <TableCell className="min-w-52">
        <p className="truncate text-body-strong">
          {record.name}
        </p>
        <p className="text-caption text-muted-foreground">
          {categoryNames.get(record.categoryId) ?? record.categoryId} · {isIncome
            ? "家庭成員收入"
            : record.paymentSource === "member"
              ? "成員代墊"
              : "基金支出"}
        </p>
      </TableCell>
      <TableCell>
        <Badge>{ledgerRecordStatusLabel(record)}</Badge>
      </TableCell>
      <TableCell className={`text-right text-body-strong ${isIncome ? "text-income" : "text-expense"}`}>
        {isIncome ? "+" : "-"}
        {formatAmount(record.amountCents)}
      </TableCell>
    </TableRow>
  );
}

function formatAmount(amountCents: number): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
}

function ledgerRecordStatusLabel(record: LedgerRecord): string {
  if (record.type === "income") {
    return "已入帳";
  }

  const reimbursementStatusLabels: Record<
    LedgerRecord["reimbursementStatus"],
    string
  > = {
    not_applicable: "不適用",
    not_refundable: "不需退款",
    refundable: "待退款",
    reimbursed: "已退款",
  };

  return reimbursementStatusLabels[record.reimbursementStatus];
}
