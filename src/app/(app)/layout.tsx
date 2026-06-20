import type { ReactNode } from "react";
import { loadMonthlyWorkspaceContext } from "@/app/monthly-workspace-context";
import { buildRecordCreateData } from "@/app/record-create-data";
import { RecordCreateScope } from "@/app/record-create";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { getVisibleDashboardNavigationItems } from "../dashboard-navigation";

export default async function AppLayout({
  children,
}: {
  children: ReactNode;
}) {
  const context = await loadMonthlyWorkspaceContext({});

  return (
    <RecordCreateScope createRecord={buildRecordCreateData(context)}>
      <AuthenticatedLayout
        account={{
          displayName: context.profile.displayName,
          avatarUrl: context.profile.avatarUrl,
        }}
        canCreateRecord={context.homeView.accessHints.actions.canCreateOwnRecords}
        navigation={getVisibleDashboardNavigationItems(context.accessHints)}
      >
        {children}
      </AuthenticatedLayout>
    </RecordCreateScope>
  );
}
