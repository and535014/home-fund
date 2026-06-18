import {
  CircleDollarSign,
  HandCoins,
  Plus,
  ReceiptText,
  Tags,
} from "lucide-react";
import type { Category } from "@/modules/categorization/category-catalog";
import { getCategoryReferenceCounts } from "@/modules/categorization/category-command";
import type { LedgerRecord } from "@/modules/fund-ledger/ledger-records";
import { getPrismaClient } from "@/db/prisma";
import {
  archiveCategoryAction,
  createCategoryAction,
  renameCategoryAction,
} from "../category-actions";
import type { DashboardSearchParams } from "../dashboard-page-context";
import {
  loadDashboardPageContext,
  readSearchParam,
} from "../dashboard-page-context";
import { DashboardRouteFrame } from "../dashboard-route-frame";
import { HomeDashboardLayout, type DashboardNavigationItem } from "../home-dashboard-layout";
import {
  AddCategoryHeaderButton,
  buildEditableCategories,
  CategoryManagementPanel,
  type CategoryResult,
} from "./category-management-panel";

type CategoriesPageProps = {
  searchParams?: DashboardSearchParams;
};

const CATEGORY_HEADER_DESCRIPTION =
  "啟用中的分類可用於新增收入或支出，封存後仍保留在歷史紀錄。";

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const resolvedSearchParams = await searchParams;
  const previewRole = readSearchParam(resolvedSearchParams, "previewRole");
  const categoryResult = readCategoryResult(
    readSearchParam(resolvedSearchParams, "categoryResult"),
  );

  if (canRenderPreview(previewRole)) {
    return (
      <PreviewCategoryManagementPage
        isAdmin={previewRole === "admin"}
        roleLabel={previewRole === "admin" ? "管理者" : "非管理者"}
      />
    );
  }

  const context = await loadDashboardPageContext({
    activeHref: "/categories",
    searchParams: resolvedSearchParams,
  });

  if (context.kind === "blocked") {
    return <DashboardRouteFrame context={context} title="分類" />;
  }

  const isAdmin = context.homeView.profile.roles.includes("admin");

  if (!isAdmin) {
    return (
      <DashboardRouteFrame
        context={context}
        headerDescription={CATEGORY_HEADER_DESCRIPTION}
        showCreateRecordActions={false}
        title="分類"
      >
        <CategoryManagementPanel
          categories={[]}
          isAdmin={false}
          roleLabel="非管理者"
        />
      </DashboardRouteFrame>
    );
  }

  const referenceCounts = await getCategoryReferenceCounts({
    categoryIds: context.dashboardData.categories.map((category) => category.id),
    prisma: getPrismaClient(),
  });
  const categoriesWithReferenceCounts = context.dashboardData.categories.map(
    (category) => ({
      ...category,
      recordCount: referenceCounts.get(category.id) ?? 0,
    }),
  );

  return (
    <DashboardRouteFrame
      context={context}
      headerActions={
        isAdmin ? <AddCategoryHeaderButton className="hidden md:inline-flex" /> : undefined
      }
      headerDescription={CATEGORY_HEADER_DESCRIPTION}
      mobileFooterActions={
        isAdmin ? (
          <AddCategoryHeaderButton className="h-12 min-w-0 flex-1 px-3" size="lg" />
        ) : undefined
      }
      showCreateRecordActions={false}
      title="分類"
    >
      <CategoryManagementPanel
        archiveAction={archiveCategoryAction}
        categories={categoriesWithReferenceCounts}
        categoryResult={categoryResult}
        createAction={createCategoryAction}
        isAdmin
        renameAction={renameCategoryAction}
        roleLabel="管理者"
      />
    </DashboardRouteFrame>
  );
}

function canRenderPreview(previewRole: string | undefined): previewRole is "admin" | "member" {
  return (
    process.env.NODE_ENV !== "production" &&
    (previewRole === "admin" || previewRole === "member")
  );
}

function PreviewCategoryManagementPage({
  isAdmin,
  roleLabel,
}: {
  isAdmin: boolean;
  roleLabel: string;
}) {
  return (
    <HomeDashboardLayout
      canCreateOwnRecords
      currentMonth="2026-06"
      displayName={isAdmin ? "Lin" : "Mei"}
      headerActions={
        isAdmin ? <AddCategoryHeaderButton className="hidden md:inline-flex" /> : undefined
      }
      headerDescription={CATEGORY_HEADER_DESCRIPTION}
      mobileFooterActions={
        isAdmin ? (
          <AddCategoryHeaderButton className="h-12 min-w-0 flex-1 px-3" size="lg" />
        ) : undefined
      }
      navigationItems={isAdmin ? adminPreviewNavigation : memberPreviewNavigation}
      showMonthSwitcher={false}
      showCreateRecordActions={false}
      subtitle="Experience Prototype · 不需登入"
      title="分類"
    >
      <CategoryManagementPanel
        categories={buildEditableCategories(previewCategories, previewRecords)}
        isAdmin={isAdmin}
        roleLabel={roleLabel}
      />
    </HomeDashboardLayout>
  );
}

function readCategoryResult(value: string | undefined): CategoryResult | undefined {
  const validResults: CategoryResult[] = [
    "created",
    "renamed",
    "archived",
    "permission_denied",
    "invalid_name",
    "category_not_found",
    "archived_category",
    "duplicate_active_category_name",
    "unknown_error",
  ];

  return validResults.find((result) => result === value);
}

const adminPreviewNavigation: DashboardNavigationItem[] = [
  { label: "月報", href: "#", icon: CircleDollarSign, active: false },
  { label: "紀錄", href: "#", icon: ReceiptText, active: false },
  { label: "新增", href: "#", icon: Plus, active: false },
  { label: "退款", href: "#", icon: HandCoins, active: false },
  { label: "分類", href: "#categories-title", icon: Tags, active: true },
];

const memberPreviewNavigation: DashboardNavigationItem[] = [
  { label: "月報", href: "#", icon: CircleDollarSign, active: false },
  { label: "紀錄", href: "#", icon: ReceiptText, active: false },
  { label: "新增", href: "#", icon: Plus, active: false },
  { label: "退款", href: "#", icon: HandCoins, active: false },
];

const previewCategories: Category[] = [
  { id: "income-rent", type: "income", name: "房租", status: "active" },
  { id: "income-living", type: "income", name: "生活費", status: "active" },
  { id: "expense-grocery", type: "expense", name: "日用品", status: "active" },
  { id: "expense-internet", type: "expense", name: "網路費", status: "active" },
  {
    id: "expense-transport-archived",
    type: "expense",
    name: "舊交通",
    status: "archived",
  },
];

const previewRecords: LedgerRecord[] = [
  {
    id: "income-rent-june",
    type: "income",
    name: "六月房租",
    amountCents: 120_000_00,
    occurredOn: "2026-06-05",
    categoryId: "income-rent",
    createdByMemberId: "member-fin",
    sourceMemberId: "member-fin",
    reimbursementStatus: "not_applicable",
  },
  {
    id: "expense-grocery-june",
    type: "expense",
    name: "日用品代墊",
    amountCents: 6_420_00,
    occurredOn: "2026-06-09",
    categoryId: "expense-grocery",
    createdByMemberId: "member-fin",
    paymentSource: "member",
    payerMemberId: "member-fin",
    reimbursementStatus: "refundable",
  },
  {
    id: "expense-transport-old",
    type: "expense",
    name: "舊交通補登",
    amountCents: 980_00,
    occurredOn: "2026-06-12",
    categoryId: "expense-transport-archived",
    createdByMemberId: "member-mei",
    paymentSource: "fund",
    reimbursementStatus: "not_refundable",
  },
];
