import { toast } from "sonner";
import type { MemberManagementMember } from "@/app/member-management-members";
import type { MemberRole } from "@/modules/identity-access/authorization";

export type MemberListStatus =
  | "unbound"
  | "link_generated"
  | "link_expired"
  | "bound"
  | "disabled";

export const roleLabels: Record<MemberRole, string> = {
  admin: "管理者",
  finance_manager: "財務管理",
  general_member: "一般成員",
};

export const statusLabels: Record<MemberListStatus, string> = {
  bound: "已綁定",
  disabled: "已停用",
  link_expired: "已失效",
  link_generated: "待綁定",
  unbound: "未綁定",
};

export function memberListStatus(
  member: MemberManagementMember,
): MemberListStatus {
  if (member.binding.state === "bound") {
    return "bound";
  }

  if (member.binding.state === "disabled") {
    return "disabled";
  }

  if (member.binding.state === "active") {
    return "link_generated";
  }

  if (member.binding.state === "expired") {
    return "link_expired";
  }

  return "unbound";
}

export function memberInitials(displayName: string): string {
  return displayName.trim().slice(0, 2).toUpperCase() || "成員";
}

export function toAbsoluteLink(link: string): string {
  return new URL(link, window.location.origin).toString();
}

export function formatBindingExpiry(value: string): string {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export async function copyBindingLink(link: string) {
  try {
    await navigator.clipboard.writeText(toAbsoluteLink(link));
    toast.success("綁定連結已複製");
  } catch {
    toast.error("無法自動複製，請手動選取連結。");
  }
}
