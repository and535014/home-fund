import { redirect } from "next/navigation";
import { requireAuthenticatedMember } from "@/auth/app-access";
import { PageHeader, PageLayout } from "@/components/layout/page-layout";
import { getPrismaClient } from "@/db/prisma";
import { loadHouseholdCategories } from "@/modules/categorization/category-query";
import {
  loadHouseholdMemberOptions,
  type HouseholdMemberOptionQueryPrismaClient,
} from "@/modules/identity-access/household-member-query";
import {
  loadRecurringEventsForSettings,
  type RecurringEventSettingsPrismaClient,
} from "@/modules/recurring/recurring-event-query";
import { RecurringEventsPanel } from "./recurring-events-panel";

export default async function RecurringSettingsPage() {
  const session = await requireAuthenticatedMember();

  if (!session.accessHints.actions.canManageRecurringEvents) {
    redirect("/");
  }

  const prisma = getPrismaClient();
  const householdId = session.access.member.householdId;
  const [categories, events, members] = await Promise.all([
    loadHouseholdCategories({ householdId, prisma }),
    loadRecurringEventsForSettings({
      householdId,
      prisma: prisma as unknown as RecurringEventSettingsPrismaClient,
    }),
    loadHouseholdMemberOptions({
      householdId,
      prisma: prisma as unknown as HouseholdMemberOptionQueryPrismaClient,
    }),
  ]);
  const memberNameById = Object.fromEntries(
    members.map((member) => [member.id, member.displayName] as const),
  );

  return (
    <PageLayout
      contentClassName="h-full min-h-0 overflow-hidden"
      header={
        <PageHeader
          hideOnMobile
          title="週期事件"
        />
      }
    >
      <RecurringEventsPanel
        categories={categories}
        events={events}
        memberNameById={memberNameById}
      />
    </PageLayout>
  );
}
