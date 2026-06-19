import { TrendingDown, TrendingUp } from "lucide-react";
import { MobileActionBar } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { CreateRecordDialog } from "./create-record-dialog";
import type { ReadyMonthlyWorkspaceContext } from "./monthly-workspace-context";

type RecordCreateProps = {
  context: ReadyMonthlyWorkspaceContext;
};

export function RecordCreateHeaderActions({ context }: RecordCreateProps) {
  if (!context.homeView.accessHints.actions.canCreateOwnRecords) {
    return null;
  }

  return (
    <>
      <Button asChild className="hidden md:inline-flex" variant="secondary">
        <a href={buildCreateRecordHref(context.returnTo, context.month, "income")}>
          <TrendingUp aria-hidden="true" size={18} />
          <span>新增收入</span>
        </a>
      </Button>
      <Button asChild className="hidden md:inline-flex">
        <a href={buildCreateRecordHref(context.returnTo, context.month, "expense")}>
          <TrendingDown aria-hidden="true" size={18} />
          <span>新增支出</span>
        </a>
      </Button>
    </>
  );
}

export function RecordCreateMobileActionBar({ context }: RecordCreateProps) {
  if (!context.homeView.accessHints.actions.canCreateOwnRecords) {
    return null;
  }

  return (
    <MobileActionBar>
      <Button asChild className="h-12 min-w-0 flex-1 px-3" size="lg" variant="secondary">
        <a href={buildCreateRecordHref(context.returnTo, context.month, "income")}>
          <TrendingUp aria-hidden="true" size={18} />
          <span className="truncate">收入</span>
        </a>
      </Button>
      <Button asChild className="h-12 min-w-0 flex-1 px-3" size="lg">
        <a href={buildCreateRecordHref(context.returnTo, context.month, "expense")}>
          <TrendingDown aria-hidden="true" size={18} />
          <span className="truncate">支出</span>
        </a>
      </Button>
    </MobileActionBar>
  );
}

export function RecordCreateDialogHost({ context }: RecordCreateProps) {
  const createRecordMode = readCreateRecordMode(context.createResult);

  if (!createRecordMode) {
    return null;
  }

  return (
    <CreateRecordDialog
      canCreateRecordsForOthers={
        context.homeView.accessHints.actions.canCreateRecordsForOthers
      }
      categories={context.dashboardData.categories}
      defaultOpen
      feedback={readCreateRecordFeedback(
        context.createResult,
        context.createFeedbackResult,
      )}
      members={context.dashboardData.householdMembers}
      mode={createRecordMode}
      month={context.month}
      profile={context.homeView.profile}
      returnTo={context.returnTo}
    />
  );
}

export function buildCreateRecordHref(
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
