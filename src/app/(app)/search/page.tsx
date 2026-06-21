import { requireAuthenticatedMember } from "@/auth/app-access";
import { getPrismaClient } from "@/db/prisma";
import { createHomeDashboardDataSource } from "@/app/home-dashboard-data-source";
import { RecordListDetail } from "@/app/record-list-detail";
import { PageLayout } from "@/components/layout/page-layout";

export default async function SearchPage() {
  const [session, dashboardData] = await Promise.all([
    requireAuthenticatedMember(),
    createHomeDashboardDataSource(getPrismaClient()).getSearchPageData(),
  ]);
  const categoriesById = Object.fromEntries(
    dashboardData.categories.map((category) => [category.id, category]),
  );
  const memberNames = Object.fromEntries(
    dashboardData.householdMembers.map((member) => [
      member.id,
      member.displayName,
    ]),
  );

  return (
    <PageLayout contentClassName="flex h-full min-h-0 flex-col">
      <section
        aria-label="搜尋紀錄"
        className="flex min-h-0 flex-1 flex-col overflow-hidden"
      >
        <RecordListDetail
          actor={session.profile}
          categories={dashboardData.categories}
          categoriesById={categoriesById}
          enableQuery
          memberNames={memberNames}
          records={dashboardData.records}
        />
      </section>
    </PageLayout>
  );
}
