import { loadMonthlyWorkspaceContext } from "@/app/monthly-workspace-context";
import {
	readSearchParam,
	type AppSearchParams,
} from "@/app/route-search-params";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import { SummaryMetric } from "@/app/dashboard-widgets";
import {
	CategoryVisualLabel,
	getCategoryColorCssColor,
} from "@/app/category-visuals";
import { MonthSwitcher } from "@/app/month-switcher";
import { HomeRecordTabs } from "@/app/home-record-tabs";
import {
	MonthlyTrendChart,
	type MonthlyTrendPoint,
} from "@/app/dashboard-charts";
import { formatAmount } from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
	CategoryColorKey,
	CategoryIconKey,
} from "@/modules/categorization/category-visual-options";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import type { ReactNode } from "react";

type HomePageProps = {
	searchParams?: AppSearchParams;
};

export default async function HomePage({ searchParams }: HomePageProps) {
	const context = await loadMonthlyWorkspaceContext({ searchParams });

	const { dashboardData, homeView, month } = context;
	const { reimbursementTable, report } = homeView;
	const categoriesById = Object.fromEntries(
		dashboardData.categories.map((category) => [category.id, category]),
	);
	const memberNames = Object.fromEntries(
		dashboardData.householdMembers.map((member) => [
			member.id,
			member.displayName,
		]),
	);
	const visibleMonthRecords = dashboardData.records.toReversed();
	const trendPoints = buildYearlyTrendPoints(month, dashboardData.yearlyRecords);
	const reimbursementFeedback = readSearchParam(
		context.rawSearchParams,
		"reimbursement",
	);

	return (
		<PageLayout
			contentClassName="md:h-full md:min-h-0 md:pb-5"
			header={
				<PageHeader
					actions={<MonthSwitcher currentMonth={month} />}
					hideTitleOnMobile
					title="總覽"
				/>
			}
		>
			<div className="grid gap-7 md:h-full md:min-h-0 md:gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(18rem,0.85fr)] xl:grid-cols-[minmax(0,2fr)_minmax(22rem,0.92fr)]">
				<div className="grid gap-7 md:min-h-0 md:grid-rows-[auto_minmax(0,1fr)_minmax(0,1.15fr)] md:gap-4">
					<section
						aria-label="月報摘要"
						className="grid grid-cols-3 gap-2 sm:gap-3 md:h-full md:min-h-0"
					>
						<SummaryMetric
							label="餘額"
							tone="default"
							value={formatAmount(report.totals.netCents)}
						/>
						<SummaryMetric
							label="支出"
							tone="expense"
							value={formatAmount(report.totals.confirmedExpenseCents)}
						/>
						<SummaryMetric
							label="收入"
							tone="income"
							value={formatAmount(report.totals.confirmedIncomeCents)}
						/>
					</section>

					<MonthlyTrendPanel data={trendPoints} />

					<div className="grid gap-7 md:min-h-0 md:gap-4 lg:grid-cols-2">
						<PendingReimbursementsPanel
							feedback={reimbursementFeedback}
							pendingCount={reimbursementTable.groups.reduce(
								(total, group) => total + group.expenseIds.length,
								0,
							)}
							totalAmount={formatAmount(
								report.reimbursementSummary.refundableTotalCents,
							)}
						/>
						<CategoryStatsPanel summaries={report.categorySummaries} />
					</div>
				</div>

				<DashboardPanel
					className="min-h-88 lg:min-h-0 lg:border-l lg:border-border lg:pl-4"
					showTitle={false}
					title="紀錄"
				>
					<HomeRecordTabs
						actor={homeView.profile}
						categories={dashboardData.categories}
						categoriesById={categoriesById}
						memberNames={memberNames}
						records={visibleMonthRecords}
					/>
				</DashboardPanel>
			</div>
		</PageLayout>
	);
}

function DashboardPanel({
	children,
	className,
	contentClassName,
	showTitle = true,
	title,
}: {
	children: ReactNode;
	className?: string;
	contentClassName?: string;
	showTitle?: boolean;
	title: string;
}) {
	return (
		<section
			aria-label={title}
			className={cn(
				"flex min-w-0 flex-col justify-start gap-3 md:h-full md:min-h-0 md:overflow-hidden",
				className,
			)}
		>
			{showTitle ? (
				<h3 className="shrink-0 text-body-strong text-foreground">{title}</h3>
			) : null}
			<div
				className={cn(
					"min-w-0 md:min-h-0 md:flex-1 md:overflow-hidden",
					contentClassName,
				)}
			>
				{children}
			</div>
		</section>
	);
}

function MonthlyTrendPanel({ data }: { data: MonthlyTrendPoint[] }) {
	return (
		<section
			aria-label="收支趨勢"
			className="hidden min-w-0 overflow-hidden pt-3 md:block md:h-full md:min-h-0"
		>
			<div className="h-[13rem] min-w-0 md:h-full md:min-h-0">
				<MonthlyTrendChart data={data} />
			</div>
		</section>
	);
}

function PendingReimbursementsPanel({
	feedback,
	pendingCount,
	totalAmount,
}: {
	feedback?: string;
	pendingCount: number;
	totalAmount: string;
}) {
	return (
		<DashboardPanel
			contentClassName="flex flex-col items-start justify-start"
			title="待退款"
		>
			<p className="text-heading text-foreground">{totalAmount}</p>
			<p className="text-caption text-muted-foreground">
				{feedback === "success"
					? "已完成退款，搜尋頁可繼續篩選待處理項目。"
					: `${pendingCount} 筆成員代墊支出待處理。`}
			</p>
		</DashboardPanel>
	);
}

function CategoryStatsPanel({
	summaries,
}: {
	summaries: {
		categoryId: string;
		categoryColor: CategoryColorKey;
		categoryIcon: CategoryIconKey;
		categoryName: string;
		categorySortOrder: number;
		totalAmountCents: number;
		type: "expense" | "income";
	}[];
}) {
	const expenseSummaries = summaries.filter(
		(summary) => summary.type === "expense",
	);
	const totalExpenseCents = expenseSummaries.reduce(
		(total, summary) => total + summary.totalAmountCents,
		0,
	);

	return (
		<DashboardPanel
			contentClassName="flex flex-col justify-start overflow-y-auto pr-1 md:overflow-y-auto"
			title="支出分類"
		>
			{totalExpenseCents > 0 ? (
				<div className="grid content-start items-start gap-3">
					{expenseSummaries.map((summary) => (
						<CategoryStatRow
							key={summary.categoryId}
							maxAmountCents={totalExpenseCents}
							summary={summary}
						/>
					))}
				</div>
			) : (
				<div className="flex h-full w-full items-start justify-start text-caption text-muted-foreground">
					尚無支出分類資料
				</div>
			)}
		</DashboardPanel>
	);
}

function CategoryStatRow({
	maxAmountCents,
	summary,
}: {
	maxAmountCents: number;
	summary: {
		categoryId: string;
		categoryColor: CategoryColorKey;
		categoryIcon: CategoryIconKey;
		categoryName: string;
		categorySortOrder: number;
		totalAmountCents: number;
		type: "expense" | "income";
	};
}) {
	const percent =
		maxAmountCents > 0
			? Math.round((summary.totalAmountCents / maxAmountCents) * 100)
			: 0;

	return (
		<div className="grid grid-cols-[minmax(6.25rem,1fr)_minmax(4.5rem,1.35fr)_max-content] items-center gap-2 md:grid-cols-[minmax(0,1.8fr)_minmax(3rem,3fr)_max-content] md:gap-3">
			<CategoryVisualLabel
				category={{
					id: summary.categoryId,
					color: summary.categoryColor,
					icon: summary.categoryIcon,
					name: summary.categoryName,
					sortOrder: summary.categorySortOrder,
					status: "active",
					type: summary.type,
				}}
				compact
			/>
			<div className="h-2 w-full min-w-0 overflow-hidden rounded-full bg-muted">
				<div
					aria-hidden="true"
					className="h-full rounded-full"
					style={{
						backgroundColor: getCategoryColorCssColor(summary.categoryColor),
						width: `${Math.max(percent, 2)}%`,
					}}
				/>
			</div>
			<div className="grid min-w-0 grid-cols-[4.75rem_2rem] items-baseline justify-end gap-1.5 text-right tabular-nums md:grid-cols-[5.5rem_2.5rem] md:gap-2">
				<span className="text-body-strong text-expense">
					{formatAmount(summary.totalAmountCents)}
				</span>
				<span className="text-caption text-muted-foreground">{percent}%</span>
			</div>
		</div>
	);
}

function buildYearlyTrendPoints(
	month: string,
	records: LedgerRecord[],
): MonthlyTrendPoint[] {
	const byDate = new Map<string, MonthlyTrendPoint>();
	const [year] = month.split("-").map(Number);

	for (let monthIndex = 1; monthIndex <= 12; monthIndex += 1) {
		const date = `${year}-${String(monthIndex).padStart(2, "0")}`;

		byDate.set(date, {
			balance: 0,
			date: `${monthIndex}月`,
			expense: 0,
			income: 0,
		});
	}

	for (const record of records) {
		const point = byDate.get(record.occurredOn.slice(0, 7));

		if (!point) {
			continue;
		}

		if (record.type === "income") {
			point.income += record.amountCents / 100;
		} else {
			point.expense += record.amountCents / 100;
		}
	}

	let balance = 0;

	return Array.from(byDate.values()).map((point) => {
		balance += point.income - point.expense;

		return {
			...point,
			balance,
		};
	});
}
