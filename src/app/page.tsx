import {
  CalendarClock,
  CircleDollarSign,
  HandCoins,
  Home,
  Plus,
  ReceiptText,
  Tags,
  Users,
} from "lucide-react";
import { headers } from "next/headers";
import {
  buildHomeAccessViewFromAccess,
  type HomeBlockedView,
  type HomeDashboardView,
} from "./home-access";
import { getCurrentMemberFromHeaders } from "@/auth/server-current-member";
import type { Category } from "@/modules/categorization/category-catalog";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { HouseholdMemberAccount } from "@/modules/identity-access/member-management";
import type { RecurringOccurrence } from "@/modules/recurring-schedule/recurring-rules";

const members: HouseholdMemberAccount[] = [
  {
    id: "member-mei",
    displayName: "Mei",
    googleAccountEmail: "mei@example.com",
    googleSubject: "google-mei",
    roles: ["general_member"],
    capabilities: [],
    status: "active",
  },
  {
    id: "member-kai",
    displayName: "Kai",
    googleAccountEmail: "kai@example.com",
    googleSubject: "google-kai",
    roles: ["general_member"],
    capabilities: [],
    status: "active",
  },
  {
    id: "member-fin",
    displayName: "Lin",
    googleAccountEmail: "lin@example.com",
    googleSubject: "google-lin",
    roles: ["finance_manager"],
    capabilities: ["manage_categories"],
    status: "active",
  },
];

const categories: Category[] = [
  { id: "income-rent", type: "income", name: "房租", status: "active" },
  { id: "income-living", type: "income", name: "生活費", status: "active" },
  { id: "expense-grocery", type: "expense", name: "日用品", status: "active" },
  { id: "expense-internet", type: "expense", name: "網路費", status: "active" },
];

const records: LedgerRecord[] = [
  {
    id: "income-rent-june",
    type: "income",
    amountCents: 120_000_00,
    occurredOn: "2026-06-05",
    categoryId: "income-rent",
    createdByMemberId: "member-mei",
    sourceMemberId: "member-mei",
    reimbursementStatus: "not_applicable",
  },
  {
    id: "income-living-june",
    type: "income",
    amountCents: 80_000_00,
    occurredOn: "2026-06-10",
    categoryId: "income-living",
    createdByMemberId: "member-kai",
    sourceMemberId: "member-kai",
    reimbursementStatus: "not_applicable",
  },
  {
    id: "expense-grocery-june",
    type: "expense",
    amountCents: 6_420_00,
    occurredOn: "2026-06-09",
    categoryId: "expense-grocery",
    createdByMemberId: "member-mei",
    paymentSource: "member",
    payerMemberId: "member-mei",
    reimbursementStatus: "refundable",
  },
  {
    id: "expense-supplies-june",
    type: "expense",
    amountCents: 1_880_00,
    occurredOn: "2026-06-13",
    categoryId: "expense-grocery",
    createdByMemberId: "member-kai",
    paymentSource: "member",
    payerMemberId: "member-kai",
    reimbursementStatus: "refundable",
  },
  {
    id: "expense-internet-june",
    type: "expense",
    amountCents: 899_00,
    occurredOn: "2026-06-05",
    categoryId: "expense-internet",
    createdByMemberId: "member-fin",
    paymentSource: "fund",
    reimbursementStatus: "not_refundable",
  },
];

const pendingOccurrences: RecurringOccurrence[] = [
  {
    id: "occurrence-living-kai",
    recurringRuleId: "rule-living-kai",
    month: "2026-06",
    status: "pending",
  },
];

const categoryNames = new Map(categories.map((category) => [category.id, category.name]));

export default async function HomePage() {
  const currentMember = await getCurrentMemberFromHeaders(
    new Headers(await headers()),
  );
  const homeView = buildHomeAccessViewFromAccess({
    access: currentMember,
    householdMembers: members,
    month: "2026-06",
    records,
    categories,
    pendingOccurrences,
  });

  if (homeView.kind !== "dashboard") {
    return <AccessBlockedScreen view={homeView} />;
  }

  const { accessHints, profile, reimbursementTable, report } = homeView;
  const visibleNavigationItems = getVisibleNavigationItems(accessHints);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto grid min-h-screen w-full max-w-7xl grid-cols-1 pb-28 md:grid-cols-[15rem_1fr] md:pb-0">
        <aside className="hidden border-r border-border bg-card/70 px-4 py-5 md:block">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-button bg-primary text-primary-foreground">
              <Home aria-hidden="true" size={20} />
            </div>
            <div>
              <p className="text-label text-muted-foreground">家庭共用金</p>
              <h1 className="text-subheading text-foreground">月報工作台</h1>
              <p className="mt-1 text-caption text-muted-foreground">{profile.displayName}</p>
            </div>
          </div>
          <nav aria-label="主要功能" className="mt-8 grid gap-1">
            {visibleNavigationItems.map((item) => (
              <a
                aria-current={item.active ? "page" : undefined}
                className={`flex h-10 items-center gap-3 rounded-button px-3 text-label ${
                  item.active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
                href={item.href}
                key={item.label}
              >
                <item.icon aria-hidden="true" size={18} />
                <span>{item.label}</span>
              </a>
            ))}
          </nav>
        </aside>

        <section className="min-w-0 px-4 py-5 sm:px-6 lg:px-8">
          <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-label text-muted-foreground">2026 年 6 月</p>
              <h2 className="mt-1 text-heading text-foreground">家庭資金總覽</h2>
            </div>
            <div className="hidden flex-wrap gap-2 md:flex">
              <button
                className="inline-flex h-10 items-center gap-2 rounded-button border border-border bg-card px-3 text-label text-foreground"
                type="button"
              >
                <CalendarClock aria-hidden="true" size={18} />
                <span>切換月份</span>
              </button>
              {accessHints.actions.canCreateOwnRecords ? (
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-button bg-primary px-3 text-label text-primary-foreground"
                  type="button"
                >
                  <Plus aria-hidden="true" size={18} />
                  <span>新增紀錄</span>
                </button>
              ) : null}
            </div>
          </header>

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
              <div className="overflow-hidden rounded-card border border-border bg-card">
                <div className="hidden grid-cols-[7rem_1fr_7rem_8rem] border-b border-border px-4 py-3 text-label text-muted-foreground md:grid">
                  <span>日期</span>
                  <span>分類</span>
                  <span>狀態</span>
                  <span className="text-right">金額</span>
                </div>
                <div className="divide-y divide-border">
                  {records
                    .filter((record) => record.occurredOn.startsWith("2026-06-"))
                    .map((record) => (
                      <RecordRow key={record.id} record={record} />
                    ))}
                </div>
              </div>
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
                    <button
                      aria-label="執行退款"
                      className="grid size-10 place-items-center rounded-button bg-secondary text-foreground"
                      type="button"
                    >
                      <HandCoins aria-hidden="true" size={18} />
                    </button>
                  ) : null}
                </div>
                <div className="rounded-card border border-border bg-card">
                  {reimbursementTable.groups.map((group) => (
                    <div className="border-b border-border p-4 last:border-b-0" key={group.memberId}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-body-strong">{group.displayName}</p>
                        <p className="text-body-strong">{formatAmount(group.totalAmountCents)}</p>
                      </div>
                      <p className="mt-1 text-caption text-muted-foreground">
                        {group.expenseIds.length} 筆支出需退款
                      </p>
                    </div>
                  ))}
                </div>
              </section>

              <section aria-labelledby="category-title">
                <h3 id="category-title" className="mb-3 text-subheading">
                  分類摘要
                </h3>
                <div className="rounded-card border border-border bg-card p-4">
                  <div className="grid gap-3">
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
                  </div>
                </div>
              </section>

              <section aria-labelledby="pending-title">
                <h3 id="pending-title" className="mb-3 text-subheading">
                  待確認週期項目
                </h3>
                <div className="rounded-card border border-border bg-card p-4">
                  {report.pendingRecurringItems.map((occurrence) => (
                    <div className="flex items-center justify-between gap-3" key={occurrence.id}>
                      <div>
                        <p className="text-body-strong">生活費提醒</p>
                        <p className="text-caption text-muted-foreground">
                          {occurrence.month} 尚未確認入帳
                        </p>
                      </div>
                      <span className="rounded-pill bg-secondary px-3 py-1 text-caption text-muted-foreground">
                        pending
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] pt-3 shadow-[0_-12px_30px_rgba(0,0,0,0.28)] backdrop-blur md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-[1fr_1fr_3rem] gap-2">
          <button
            className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-button border border-border bg-card px-3 text-label text-foreground"
            type="button"
          >
            <CalendarClock aria-hidden="true" size={18} />
            <span>切換月份</span>
          </button>
          {accessHints.actions.canCreateOwnRecords ? (
            <button
              className="inline-flex h-12 min-w-0 items-center justify-center gap-2 rounded-button bg-primary px-3 text-label text-primary-foreground"
              type="button"
            >
              <Plus aria-hidden="true" size={18} />
              <span>新增紀錄</span>
            </button>
          ) : null}
          {accessHints.actions.canPerformReimbursement ? (
            <button
              aria-label="執行退款"
              className="grid size-12 place-items-center rounded-button bg-secondary text-foreground"
              type="button"
            >
              <HandCoins aria-hidden="true" size={18} />
            </button>
          ) : null}
        </div>
      </div>
    </main>
  );
}

function AccessBlockedScreen({ view }: { view: HomeBlockedView }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-4 py-8 text-foreground">
      <section
        aria-labelledby="access-state-title"
        className="w-full max-w-sm rounded-card border border-border bg-card p-5"
      >
        <p className="text-label text-muted-foreground">家庭共用金管理</p>
        <h1 id="access-state-title" className="mt-2 text-heading text-foreground">
          {view.title}
        </h1>
        <p className="mt-3 text-body text-muted-foreground">{view.description}</p>
        <button
          className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-button bg-primary px-4 text-label text-primary-foreground"
          type="button"
        >
          <Users aria-hidden="true" size={18} />
          <span>{view.primaryActionLabel}</span>
        </button>
      </section>
    </main>
  );
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
    <div className="rounded-card border border-border bg-card p-4">
      <p className="text-label text-muted-foreground">{label}</p>
      <p className={`mt-2 text-heading ${valueColor}`}>{value}</p>
    </div>
  );
}

function RecordRow({ record }: { record: LedgerRecord }) {
  const isIncome = record.type === "income";

  return (
    <div className="grid gap-2 px-4 py-3 md:grid-cols-[7rem_1fr_7rem_8rem] md:items-center">
      <span className="text-caption text-muted-foreground">{record.occurredOn}</span>
      <div className="min-w-0">
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
      </div>
      <span className="w-fit rounded-pill bg-secondary px-3 py-1 text-caption text-muted-foreground">
        {isIncome ? "confirmed" : record.reimbursementStatus}
      </span>
      <span className={`text-body-strong md:text-right ${isIncome ? "text-income" : "text-expense"}`}>
        {isIncome ? "+" : "-"}
        {formatAmount(record.amountCents)}
      </span>
    </div>
  );
}

function formatAmount(amountCents: number): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency: "TWD",
    maximumFractionDigits: 0,
  }).format(amountCents / 100);
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
