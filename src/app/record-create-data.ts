import type { MonthlyWorkspaceContext } from "./monthly-workspace-context";
import type { RecordCreateData } from "./record-create-context";

export function buildRecordCreateData(
  context: MonthlyWorkspaceContext,
): RecordCreateData {
  return {
    canCreateRecordsForOthers:
      context.homeView.accessHints.actions.canCreateRecordsForOthers,
    categories: context.dashboardData.categories,
    members: context.dashboardData.householdMembers,
    profile: context.homeView.profile,
  };
}
