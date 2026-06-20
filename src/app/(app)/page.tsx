import { loadMonthlyWorkspaceContext } from "@/app/monthly-workspace-context";
import {
	readSearchParam,
	type AppSearchParams,
} from "@/app/route-search-params";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import { formatAmount, SummaryMetric } from "@/app/dashboard-widgets";
import {
	CategoryVisualLabel,
	getCategoryColorCssColor,
} from "@/app/category-visuals";
import { MonthSwitcher } from "@/app/month-switcher";
import { RecordListDetail } from "@/app/record-list-detail";
import {
	MonthlyTrendChart,
	type MonthlyTrendPoint,
} from "@/app/dashboard-charts";
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
	const monthRecords = dashboardData.records.filter((record) =>
		record.occurredOn.startsWith(`${month}-`),
	);
	const recentRecords = monthRecords.slice(-5).reverse();
	const trendPoints = buildMonthlyTrendPoints(month, monthRecords);
	const reimbursementFeedback = readSearchParam(
		context.rawSearchParams,
		"reimbursement",
	);

	return (
		<PageLayout
			contentClassName="h-full min-h-0 pb-5"
			header={
				<PageHeader
					actions={<MonthSwitcher currentMonth={month} />}
					title="總覽"
				/>
			}
		>
			<div className="grid h-full min-h-0 gap-4 lg:grid-cols-[minmax(0,1.75fr)_minmax(18rem,0.85fr)] xl:grid-cols-[minmax(0,2fr)_minmax(22rem,0.92fr)]">
				<div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)_minmax(0,1.15fr)] gap-4">
					<section
						aria-label="月報摘要"
						className="grid h-full min-h-0 gap-3 lg:grid-cols-3"
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

					<div className="grid min-h-0 gap-4 lg:grid-cols-2">
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
					className="lg:border-l lg:border-border lg:pl-4"
					title="紀錄"
				>
					<RecordListDetail
						actor={homeView.profile}
						categories={dashboardData.categories}
						categoriesById={categoriesById}
						memberNames={memberNames}
						records={recentRecords}
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
	title,
}: {
	children: ReactNode;
	className?: string;
	contentClassName?: string;
	title: string;
}) {
	return (
		<section
			aria-label={title}
			className={cn(
				"flex h-full min-h-0 min-w-0 flex-col justify-start gap-3 overflow-hidden",
				className,
			)}
		>
			<h3 className="shrink-0 text-body-strong text-foreground">{title}</h3>
			<div
				className={cn(
					"min-h-0 min-w-0 flex-1 overflow-hidden",
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
			className="h-full min-h-0 min-w-0 overflow-hidden pt-3"
		>
			<div className="h-full min-h-0 min-w-0">
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
					? "已完成退款，退款頁可查看剩餘待處理項目。"
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
	const expenseSummaries = summaries
		.filter((summary) => summary.type === "expense")
		.slice(0, 5);
	const totalExpenseCents = expenseSummaries.reduce(
		(total, summary) => total + summary.totalAmountCents,
		0,
	);

	return (
		<DashboardPanel
			contentClassName="flex flex-col justify-start"
			title="支出分類"
		>
			{totalExpenseCents > 0 ? (
				<div className="grid h-full content-start items-start gap-3">
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
		<div className="grid grid-cols-[minmax(0,1.8fr)_minmax(0,3fr)_minmax(0,1.5fr)] items-center gap-3">
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
			<div className="flex min-w-0 items-baseline justify-end gap-2 text-right">
				<span className="text-body-strong text-expense">
					{formatAmount(summary.totalAmountCents)}
				</span>
				<span className="text-caption text-muted-foreground">{percent}%</span>
			</div>
		</div>
	);
}

function buildMonthlyTrendPoints(
	month: string,
	records: LedgerRecord[],
): MonthlyTrendPoint[] {
	const byDate = new Map<string, MonthlyTrendPoint>();
	const [year, monthNumber] = month.split("-").map(Number);
	const daysInMonth = new Date(year, monthNumber, 0).getDate();

	for (let day = 1; day <= daysInMonth; day += 1) {
		const date = `${month}-${String(day).padStart(2, "0")}`;

		byDate.set(date, {
			balance: 0,
			date: `${monthNumber}/${day}`,
			expense: 0,
			income: 0,
		});
	}

	for (const record of records) {
		const point = byDate.get(record.occurredOn);

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
