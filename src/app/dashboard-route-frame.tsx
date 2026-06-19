import type { ReactNode } from "react";
import { CreateRecordDialog } from "./create-record-dialog";
import type { DashboardPageContext } from "./dashboard-page-context";
import { DashboardAccessScreen } from "./dashboard-access-screen";
import { HomeDashboardLayout } from "./home-dashboard-layout";

type DashboardRouteFrameProps = {
  children?: ReactNode;
  context: DashboardPageContext;
  headerActions?: ReactNode;
  headerDescription?: string;
  mobileFooterActions?: ReactNode;
  sidebarFooterActions?: ReactNode;
  showCreateRecordActions?: boolean;
  title: string;
};

export function DashboardRouteFrame({
  children,
  context,
  headerActions,
  headerDescription,
  mobileFooterActions,
  sidebarFooterActions,
  showCreateRecordActions = true,
  title,
}: DashboardRouteFrameProps) {
  if (context.kind === "blocked") {
    return <DashboardAccessScreen view={context.view} />;
  }

  const createRecordMode = readCreateRecordMode(context.createResult);
  const createRecordFeedback = readCreateRecordFeedback(
    context.createResult,
    context.createFeedbackResult,
  );
  const baseHref = context.activeHref;

  return (
    <HomeDashboardLayout
      canCreateOwnRecords={context.homeView.accessHints.actions.canCreateOwnRecords}
      createExpenseHref={buildCreateHref(baseHref, context.month, "expense")}
      createIncomeHref={buildCreateHref(baseHref, context.month, "income")}
      createRecordDialogContent={
        createRecordMode ? (
          <CreateRecordDialog
            canCreateRecordsForOthers={
              context.homeView.accessHints.actions.canCreateRecordsForOthers
            }
            categories={context.dashboardData.categories}
            defaultOpen={createRecordMode !== undefined}
            feedback={createRecordFeedback}
            members={context.dashboardData.householdMembers}
            mode={createRecordMode}
            month={context.month}
            profile={context.homeView.profile}
            returnTo={baseHref}
          />
        ) : undefined
      }
      currentMonth={context.month}
      displayName={context.homeView.profile.displayName}
      headerActions={headerActions}
      headerDescription={headerDescription}
      mobileFooterActions={mobileFooterActions}
      navigationItems={context.navigationItems}
      sidebarFooterActions={sidebarFooterActions}
      showCreateRecordActions={showCreateRecordActions}
      title={title}
    >
      {children}
    </HomeDashboardLayout>
  );
}

function buildCreateHref(
  baseHref: string,
  month: string,
  create: "income" | "expense",
): string {
  const params = new URLSearchParams({
    month,
    create,
  });

  return `${baseHref}?${params.toString()}`;
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
