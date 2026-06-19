import type { DashboardSearchParams } from "../dashboard-page-context";
import {
  loadDashboardPageContext,
  readSearchParam,
} from "../dashboard-page-context";
import { DashboardRouteFrame } from "../dashboard-route-frame";
import {
  HomeDashboardLayout,
  type DashboardNavigationItem,
} from "../home-dashboard-layout";
import {
  CalendarClock,
  CircleDollarSign,
  HandCoins,
  LogOut,
  Plus,
  ReceiptText,
  Tags,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InviteMemberHeaderButton,
  MemberManagementPrototype,
  type PrototypeMember,
} from "./member-management-prototype";

type MembersPageProps = {
  searchParams?: DashboardSearchParams;
};

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const resolvedSearchParams = await searchParams;
  const previewRole = readSearchParam(resolvedSearchParams, "previewRole");

  if (canRenderPreview(previewRole)) {
    return (
      <PreviewMembersPage
        canManageMembers={previewRole === "admin"}
        roleLabel={previewRole === "admin" ? "管理者" : "一般成員"}
      />
    );
  }

  const context = await loadDashboardPageContext({
    activeHref: "/members",
    searchParams: resolvedSearchParams,
  });

  if (context.kind === "blocked") {
    return <DashboardRouteFrame context={context} title="成員" />;
  }

  const canManageMembers = context.homeView.profile.roles.includes("admin");

  return (
    <DashboardRouteFrame
      context={context}
      headerActions={canManageMembers ? <InviteMemberHeaderButton /> : undefined}
      headerDescription="邀請家庭成員、管理全站顯示名稱，並檢視 Google 頭像來源。"
      sidebarFooterActions={<LogoutPrototypeButton />}
      showCreateRecordActions={false}
      title="成員"
    >
      <MemberManagementPrototype
        canManageMembers={canManageMembers}
        members={buildMembersFromContext(context.dashboardData.householdMembers)}
        roleLabel={canManageMembers ? "管理者" : "非管理者"}
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

function PreviewMembersPage({
  canManageMembers,
  roleLabel,
}: {
  canManageMembers: boolean;
  roleLabel: string;
}) {
  return (
    <HomeDashboardLayout
      canCreateOwnRecords
      currentMonth="2026-06"
      displayName={canManageMembers ? "Lin 管理者" : "Mei"}
      headerActions={canManageMembers ? <InviteMemberHeaderButton /> : undefined}
      headerDescription="邀請家庭成員、管理全站顯示名稱，並檢視 Google 頭像來源。"
      navigationItems={canManageMembers ? adminPreviewNavigation : memberPreviewNavigation}
      sidebarFooterActions={<LogoutPrototypeButton />}
      showCreateRecordActions={false}
      showMonthSwitcher={false}
      subtitle="Experience Prototype · 不需登入"
      title="成員"
    >
      <MemberManagementPrototype
        canManageMembers={canManageMembers}
        members={previewMembers}
        roleLabel={roleLabel}
      />
    </HomeDashboardLayout>
  );
}

function LogoutPrototypeButton() {
  return (
    <Button asChild className="w-full justify-start" variant="ghost">
      <a href="/login">
        <LogOut aria-hidden="true" size={18} />
        登出
      </a>
    </Button>
  );
}

function buildMembersFromContext(
  members: Array<{
    id: string;
    displayName: string;
    googleAccountEmail?: string;
    roles: PrototypeMember["roles"];
    status: PrototypeMember["status"] | "disabled";
  }>,
): PrototypeMember[] {
  return members.filter(isRenderablePrototypeMember).map((member) => {
    const email = member.googleAccountEmail ?? `${member.id}@example.com`;

    return {
      id: member.id,
      avatarUrl: avatarForEmail(email),
      displayName: member.displayName,
      email,
      googleName: member.displayName,
      invitationLink: member.status === "invited"
        ? buildPreviewInviteLink(email)
        : undefined,
      roles: member.roles,
      status: member.status,
    };
  });
}

function isRenderablePrototypeMember(member: {
  id: string;
  displayName: string;
  googleAccountEmail?: string;
  roles: PrototypeMember["roles"];
  status: PrototypeMember["status"] | "disabled";
}): member is {
  id: string;
  displayName: string;
  googleAccountEmail?: string;
  roles: PrototypeMember["roles"];
  status: PrototypeMember["status"];
} {
  return member.status !== "disabled";
}

function avatarForEmail(email: string): string {
  const encoded = encodeURIComponent(email);
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encoded}&backgroundColor=0f766e,2563eb,9333ea`;
}

function buildPreviewInviteLink(email: string): string {
  const token = encodeURIComponent(`preview-existing-${email}`);

  return `/invite/accept?token=${token}`;
}

const adminPreviewNavigation: DashboardNavigationItem[] = [
  { label: "月報", href: "#", icon: CircleDollarSign, active: false },
  { label: "紀錄", href: "#", icon: ReceiptText, active: false },
  { label: "新增", href: "#", icon: Plus, active: false },
  { label: "退款", href: "#", icon: HandCoins, active: false },
  { label: "週期", href: "#", icon: CalendarClock, active: false },
  { label: "分類", href: "#", icon: Tags, active: false },
  { label: "成員", href: "#", icon: Users, active: true },
];

const memberPreviewNavigation: DashboardNavigationItem[] = [
  { label: "月報", href: "#", icon: CircleDollarSign, active: false },
  { label: "紀錄", href: "#", icon: ReceiptText, active: false },
  { label: "新增", href: "#", icon: Plus, active: false },
  { label: "退款", href: "#", icon: HandCoins, active: false },
];

const previewMembers: PrototypeMember[] = [
  {
    id: "member-admin",
    avatarUrl: avatarForEmail("lin.admin@example.com"),
    displayName: "Lin 管理者",
    email: "lin.admin@example.com",
    googleName: "Lin Chen",
    roles: ["admin"],
    status: "active",
  },
  {
    id: "member-fin",
    avatarUrl: avatarForEmail("mei.finance@example.com"),
    displayName: "Mei",
    email: "mei.finance@example.com",
    googleName: "Mei Wang",
    roles: ["finance_manager"],
    status: "active",
  },
  {
    id: "member-invited",
    avatarUrl: avatarForEmail("kai.invited@example.com"),
    displayName: "Kai",
    email: "kai.invited@example.com",
    googleName: "Kai Lin",
    invitationLink: buildPreviewInviteLink("kai.invited@example.com"),
    roles: ["general_member"],
    status: "invited",
  },
];
