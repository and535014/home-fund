import {
  CalendarClock,
  CircleDollarSign,
  HandCoins,
  Plus,
  ReceiptText,
  Tags,
  Users,
} from "lucide-react";
import { headers } from "next/headers";
import type { ReactNode } from "react";
import {
  createHomeDashboardDataSource,
  type HomeDashboardData,
} from "./home-dashboard-data-source";
import { HomeDashboardLayout } from "./home-dashboard-layout";
import { createLedgerRecordAction } from "./ledger-record-actions";
import {
  buildHomeAccessViewFromAccess,
  type HomeBlockedView,
  type HomeDashboardView,
} from "./home-access";
import { readDashboardMonth } from "./month-selection";
import { getCurrentMemberFromHeaders } from "@/auth/server-current-member";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
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
  const currentMember = await getCurrentMemberFromHeaders(
    new Headers(await headers()),
  );
  const resolvedSearchParams = await searchParams;
  const dashboardMonth = readDashboardMonth(resolvedSearchParams?.month);
  const authError = readSingleSearchParam(resolvedSearchParams?.error);
  const createResult = readSingleSearchParam(resolvedSearchParams?.create);
  const dashboardData = currentMember.ok
    ? await createHomeDashboardDataSource(
        getPrismaClient(),
      ).getMonthlyDashboardData(dashboardMonth)
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
    return <AccessBlockedScreen view={homeView} />;
  }

  const { accessHints, profile, reimbursementTable, report } = homeView;
  const visibleNavigationItems = getVisibleNavigationItems(accessHints);
  const categoryNames = new Map(
    dashboardData.categories.map((category) => [category.id, category.name]),
  );

  return (
    <HomeDashboardLayout
      canCreateOwnRecords={accessHints.actions.canCreateOwnRecords}
      canPerformReimbursement={accessHints.actions.canPerformReimbursement}
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

          {accessHints.actions.canCreateOwnRecords ? (
            <CreateRecordPanel
              canCreateRecordsForOthers={accessHints.actions.canCreateRecordsForOthers}
              categories={dashboardData.categories}
              feedback={createResult}
              members={dashboardData.householdMembers}
              month={dashboardMonth}
              profile={profile}
            />
          ) : null}

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
    </HomeDashboardLayout>
  );
}

function AccessBlockedScreen({ view }: { view: HomeBlockedView }) {
  const canStartGoogleSignIn =
    view.kind === "unauthenticated" || view.kind === "google_account_not_linked";

  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
      <Card
        aria-labelledby="access-state-title"
        className="w-full max-w-sm"
      >
        <CardHeader>
          <CardDescription>家庭共用金管理</CardDescription>
          <CardTitle>
            <h1 id="access-state-title" className="text-heading leading-tight">
              {view.title}
            </h1>
          </CardTitle>
        </CardHeader>
        <CardContent>
        <p className="text-body text-muted-foreground">{view.description}</p>
        {view.errorMessage ? (
          <Alert className="mt-4 text-body" role="alert" variant="destructive">
            <AlertDescription>{view.errorMessage}</AlertDescription>
          </Alert>
        ) : null}
        {canStartGoogleSignIn ? (
          <form action="/auth/google" method="post">
            <Button className="mt-5 w-full" size="lg" type="submit">
              <Users aria-hidden="true" size={18} />
              <span>{view.primaryActionLabel}</span>
            </Button>
          </form>
        ) : (
          <Button className="mt-5 w-full" size="lg" type="button">
            <Users aria-hidden="true" size={18} />
            <span>{view.primaryActionLabel}</span>
          </Button>
        )}
        </CardContent>
      </Card>
    </main>
  );
}

function CreateRecordPanel({
  canCreateRecordsForOthers,
  categories,
  feedback,
  members,
  month,
  profile,
}: {
  canCreateRecordsForOthers: boolean;
  categories: HomeDashboardData["categories"];
  feedback: string | undefined;
  members: HomeDashboardData["householdMembers"];
  month: string;
  profile: HomeDashboardView["profile"];
}) {
  const incomeCategories = categories.filter(
    (category) => category.type === "income" && category.status === "active",
  );
  const expenseCategories = categories.filter(
    (category) => category.type === "expense" && category.status === "active",
  );
  const activeMembers = members.filter((member) => member.status === "active");
  const defaultOccurredOn = `${month}-01`;
  const feedbackMessage = createRecordFeedbackMessage(feedback);

  return (
    <section
      aria-labelledby="new-record-title"
      className="mt-5 scroll-mt-32"
      id="new-record"
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h3 id="new-record-title" className="text-subheading">
            新增紀錄
          </h3>
          <p className="text-caption text-muted-foreground">
            收入、基金支出與成員代墊會依照權限與分類規則寫入本月紀錄。
          </p>
        </div>
        {feedbackMessage ? (
          <Alert
            variant={feedbackMessage.tone === "success" ? "default" : "destructive"}
            role={feedbackMessage.tone === "error" ? "alert" : "status"}
          >
            <AlertDescription>{feedbackMessage.message}</AlertDescription>
          </Alert>
        ) : null}
      </div>

      <div className="grid min-w-0 gap-3 lg:grid-cols-3">
        <CreateRecordFormCard
          categories={incomeCategories}
          defaultOccurredOn={defaultOccurredOn}
          memberField={
            <MemberSelectField
              canSelectOthers={canCreateRecordsForOthers}
              fieldName="sourceMemberId"
              label="收入來源"
              members={activeMembers}
              profile={profile}
            />
          }
          month={month}
          recordType="income"
          submitLabel="新增收入"
          title="收入"
        />
        <CreateRecordFormCard
          categories={expenseCategories}
          defaultOccurredOn={defaultOccurredOn}
          hiddenFields={<input name="paymentSource" type="hidden" value="fund" />}
          month={month}
          recordType="expense"
          submitLabel="新增基金支出"
          title="基金支出"
        />
        <CreateRecordFormCard
          categories={expenseCategories}
          defaultOccurredOn={defaultOccurredOn}
          hiddenFields={<input name="paymentSource" type="hidden" value="member" />}
          memberField={
            <MemberSelectField
              canSelectOthers={canCreateRecordsForOthers}
              fieldName="payerMemberId"
              label="代墊成員"
              members={activeMembers}
              profile={profile}
            />
          }
          month={month}
          recordType="expense"
          submitLabel="新增代墊"
          title="成員代墊"
        />
      </div>
    </section>
  );
}

function CreateRecordFormCard({
  categories,
  defaultOccurredOn,
  hiddenFields,
  memberField,
  month,
  recordType,
  submitLabel,
  title,
}: {
  categories: HomeDashboardData["categories"];
  defaultOccurredOn: string;
  hiddenFields?: ReactNode;
  memberField?: ReactNode;
  month: string;
  recordType: "income" | "expense";
  submitLabel: string;
  title: string;
}) {
  const hasCategories = categories.length > 0;

  return (
    <Card className="min-w-0">
      <form action={createLedgerRecordAction}>
        <input name="month" type="hidden" value={month} />
        <input name="recordType" type="hidden" value={recordType} />
        {hiddenFields}

        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>{title}</CardTitle>
          <Badge
            variant="secondary"
            className={recordType === "income" ? "text-income" : "text-expense"}
          >
            {recordType === "income" ? "收入" : "支出"}
          </Badge>
        </CardHeader>

        <CardContent>
          <FieldGroup>
        <Field>
          <FieldLabel>金額</FieldLabel>
          <Input
            inputMode="decimal"
            min="1"
            name="amountTwd"
            placeholder="例如 1200"
            required
            step="0.01"
            type="number"
          />
        </Field>
        <Field>
          <FieldLabel>日期</FieldLabel>
          <Input
            defaultValue={defaultOccurredOn}
            name="occurredOn"
            required
            type="date"
          />
        </Field>
        <Field>
          <FieldLabel>分類</FieldLabel>
          <NativeSelect
            className="w-full"
            disabled={!hasCategories}
            name="categoryId"
            required
          >
            <NativeSelectOption value="">選擇分類</NativeSelectOption>
            {categories.map((category) => (
              <NativeSelectOption key={category.id} value={category.id}>
                {category.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
        </Field>
        {memberField}
        <Field>
          <FieldLabel>備註</FieldLabel>
          <Input
            name="note"
            placeholder="可留空"
            type="text"
          />
        </Field>

        <Button className="mt-1 w-full" disabled={!hasCategories} type="submit">
          <Plus aria-hidden="true" size={18} />
          <span>{submitLabel}</span>
        </Button>
        </FieldGroup>
      </CardContent>
      </form>
    </Card>
  );
}

function MemberSelectField({
  canSelectOthers,
  fieldName,
  label,
  members,
  profile,
}: {
  canSelectOthers: boolean;
  fieldName: "sourceMemberId" | "payerMemberId";
  label: string;
  members: HomeDashboardData["householdMembers"];
  profile: HomeDashboardView["profile"];
}) {
  if (!canSelectOthers) {
    return (
      <>
        <input name={fieldName} type="hidden" value={profile.id} />
        <Field>
          <FieldLabel>{label}</FieldLabel>
          <FieldContent>
          <p className="flex h-10 items-center rounded-input border border-input bg-secondary px-3 text-body text-foreground">
            {profile.displayName}
          </p>
          </FieldContent>
        </Field>
      </>
    );
  }

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <NativeSelect
        className="w-full"
        defaultValue={profile.id}
        name={fieldName}
        required
      >
        {members.map((member) => (
          <NativeSelectOption key={member.id} value={member.id}>
            {member.displayName}
          </NativeSelectOption>
        ))}
      </NativeSelect>
    </Field>
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

function createRecordFeedbackMessage(
  result: string | undefined,
): { tone: "success" | "error"; message: string } | undefined {
  if (!result) {
    return undefined;
  }

  if (result === "success") {
    return {
      tone: "success",
      message: "紀錄已新增。",
    };
  }

  const messages: Record<string, string> = {
    archived_category: "這個分類已封存，請改選其他分類。",
    category_type_mismatch: "分類類型與紀錄類型不一致。",
    fund_paid_expense_cannot_have_member_payer: "基金支出不能指定代墊成員。",
    invalid_amount: "金額格式不正確，請輸入大於 0 的金額。",
    invalid_date: "日期格式不正確。",
    missing_category: "請選擇分類。",
    missing_member_payer: "請選擇代墊成員。",
    missing_payer_member: "請選擇代墊成員。",
    missing_source_member: "請選擇收入來源。",
    permission_denied: "目前帳號沒有新增這筆紀錄的權限。",
  };

  return {
    tone: "error",
    message: messages[result] ?? "紀錄新增失敗，請確認欄位後再試一次。",
  };
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
          {categoryNames.get(record.categoryId) ?? record.categoryId}
        </p>
        <p className="text-caption text-muted-foreground">
          {isIncome
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

function getVisibleNavigationItems(accessHints: HomeDashboardView["accessHints"]) {
  return [
    {
      label: "月報",
      href: "#",
      icon: CircleDollarSign,
      active: true,
      visible: accessHints.navigation.canOpenReports,
    },
    {
      label: "紀錄",
      href: "#",
      icon: ReceiptText,
      active: false,
      visible: accessHints.navigation.canOpenRecords,
    },
    {
      label: "新增",
      href: "#",
      icon: Plus,
      active: false,
      visible: accessHints.navigation.canOpenCreateRecord,
    },
    {
      label: "退款",
      href: "#",
      icon: HandCoins,
      active: false,
      visible: accessHints.navigation.canOpenReimbursements,
    },
    {
      label: "週期",
      href: "#",
      icon: CalendarClock,
      active: false,
      visible: accessHints.navigation.canOpenRecurring,
    },
    {
      label: "分類",
      href: "#",
      icon: Tags,
      active: false,
      visible: accessHints.navigation.canOpenCategories,
    },
    {
      label: "成員",
      href: "#",
      icon: Users,
      active: false,
      visible: accessHints.navigation.canOpenMembers,
    },
  ].filter((item) => item.visible);
}
