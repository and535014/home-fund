import { HandCoins } from "lucide-react";
import { headers } from "next/headers";
import { CreateRecordToast } from "./create-record-toast";
import { DashboardAccessScreen } from "./dashboard-access-screen";
import { getVisibleDashboardNavigationItems } from "./dashboard-navigation";
import {
  createE2eHomeDashboardData,
  createHomeDashboardDataSource,
  type HomeDashboardData,
} from "./home-dashboard-data-source";
import { HomeDashboardLayout } from "./home-dashboard-layout";
import { buildHomeAccessViewFromAccess } from "./home-access";
import { readDashboardMonth } from "./month-selection";
import { RecordEntryPanel } from "./record-entry-panel";
import { getCurrentMemberFromHeaders } from "@/auth/server-current-member";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";
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
};

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const requestHeaders = new Headers(await headers());
  const currentMember = await getCurrentMemberFromHeaders(requestHeaders);
  const resolvedSearchParams = await searchParams;
  const dashboardMonth = readDashboardMonth(resolvedSearchParams?.month);
  const authError = readSingleSearchParam(resolvedSearchParams?.error);
  const createResult = readSingleSearchParam(resolvedSearchParams?.create);
  const createFeedbackResult = readSingleSearchParam(resolvedSearchParams?.result);
  const dashboardData = currentMember.ok
    ? await getDashboardData(dashboardMonth, requestHeaders)
    : emptyDashboardData;
  const homeView = buildHomeAccessViewFromAccess({
    access: currentMember,
    authError,
    householdMembers: dashboardData.householdMembers,
    month: dashboardMonth,
    records: dashboardData.records,
    categories: dashboardData.categories,
    pendingOccurrences: dashboardData.pendingOccurrences,
  });

  if (homeView.kind !== "dashboard") {
    return <DashboardAccessScreen view={homeView} />;
  }

  const { accessHints, profile, reimbursementTable, report } = homeView;
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
        <>
          <DialogHeader>
            <DialogTitle>
              {createRecordMode === "income" ? "新增收入" : "新增支出"}
            </DialogTitle>
            <DialogDescription>
              {createRecordMode === "income"
                ? "建立家庭成員繳交的房租、生活費或其他收入。"
                : "建立基金直接支出，或成員先代墊的支出。"}
            </DialogDescription>
          </DialogHeader>
          <RecordEntryPanel
            canCreateRecordsForOthers={accessHints.actions.canCreateRecordsForOthers}
            categories={dashboardData.categories}
            feedback={createRecordFeedback}
            members={dashboardData.householdMembers}
            mode={createRecordMode}
            month={dashboardMonth}
            profile={profile}
          />
        </>
        ) : undefined
      }
      currentMonth={dashboardMonth}
      defaultOpenCreateRecordDialog={createRecordMode !== undefined}
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
              <section aria-labelledby="reimbursement-title">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <h3 id="reimbursement-title" className="text-subheading">
                      退款表
                    </h3>
                    <p className="text-caption text-muted-foreground">
                      {report.reimbursementSummary.expenseIds.length} 筆待處理
                    </p>
                  </div>
                  {accessHints.actions.canPerformReimbursement ? (
                    <Button aria-label="執行退款" size="icon" type="button" variant="secondary">
                      <HandCoins aria-hidden="true" size={18} />
                    </Button>
                  ) : null}
                </div>
                <Card className="p-0">
                  <ItemGroup>
                  {reimbursementTable.groups.map((group) => (
                    <Item
                      className="rounded-none border-b border-border last:border-b-0"
                      key={group.memberId}
                    >
                      <ItemContent className="min-w-0">
                        <ItemTitle>{group.displayName}</ItemTitle>
                        <ItemDescription>
                          {group.expenseIds.length} 筆支出需退款
                        </ItemDescription>
                      </ItemContent>
                      <p className="shrink-0 text-body-strong">
                        {formatAmount(group.totalAmountCents)}
                      </p>
                    </Item>
                  ))}
                  </ItemGroup>
                </Card>
              </section>

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

              <section aria-labelledby="pending-title">
                <h3 id="pending-title" className="mb-3 text-subheading">
                  待確認週期項目
                </h3>
                <Card>
                  <CardContent>
                  {report.pendingRecurringItems.map((occurrence) => (
                    <div className="flex items-center justify-between gap-3" key={occurrence.id}>
                      <div>
                        <p className="text-body-strong">生活費提醒</p>
                        <p className="text-caption text-muted-foreground">
                          {occurrence.month} 尚未確認入帳
                        </p>
                      </div>
                      <Badge>待確認</Badge>
                    </div>
                  ))}
                  </CardContent>
                </Card>
              </section>
            </aside>
          </div>
          {createResult === "success" ? <CreateRecordToast /> : null}
    </HomeDashboardLayout>
  );
}

async function getDashboardData(
  month: string,
  requestHeaders: Headers,
): Promise<HomeDashboardData> {
  if (
    process.env.NODE_ENV !== "production" &&
    requestHeaders.get("x-e2e-dashboard-fixture") === "1"
  ) {
    return createE2eHomeDashboardData(month);
  }

  return createHomeDashboardDataSource(getPrismaClient()).getMonthlyDashboardData(
    month,
  );
}

function readSingleSearchParam(
  value: string | string[] | undefined,
): string | undefined {
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
