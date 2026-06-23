"use client";

import { Edit3, Link } from "lucide-react";
import type { MemberManagementMember } from "@/app/member-management-members";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  memberInitials,
  memberListStatus,
  roleLabels,
  statusLabels,
  type MemberListStatus,
} from "./member-ui";

export function MemberListItem({
  member,
  onEditDisplayName,
  onOpenBinding,
}: {
  member: MemberManagementMember;
  onEditDisplayName: (memberId: string) => void;
  onOpenBinding: (memberId: string) => void;
}) {
  const status = memberListStatus(member);
  const canBindAccount =
    status === "unbound" ||
    status === "link_generated" ||
    status === "link_expired";
  const primaryRole = member.roles[0] ?? "general_member";

  return (
    <Item variant="outline">
      <ItemMedia className="size-12 rounded-full" variant="image">
        <Avatar
          aria-label={`${member.displayName} 的 Google 頭像`}
          className="size-12 ring-2 ring-border"
        >
          <AvatarImage
            alt={`${member.displayName} 的 Google 頭像`}
            referrerPolicy="no-referrer"
            src={member.avatarUrl ?? undefined}
          />
          <AvatarFallback>{memberInitials(member.displayName)}</AvatarFallback>
        </Avatar>
      </ItemMedia>
      <ItemContent className="min-w-0 gap-2">
        <ItemTitle className="w-full flex-wrap">
          <span className="min-w-0 truncate">{member.displayName}</span>
          <Badge variant="outline">{roleLabels[primaryRole]}</Badge>
        </ItemTitle>
        <ItemDescription>
          <StatusBadge status={status} />
        </ItemDescription>
      </ItemContent>
      <ItemActions className="ml-auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={`修改 ${member.displayName} 的顯示名稱`}
              onClick={() => onEditDisplayName(member.id)}
              size="icon"
              type="button"
              variant="secondary"
            >
              <Edit3 aria-hidden="true" size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>修改顯示名稱</TooltipContent>
        </Tooltip>
        {canBindAccount ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                aria-label={`管理 ${member.displayName} 的綁定帳號連結`}
                onClick={() => onOpenBinding(member.id)}
                size="icon"
                type="button"
                variant="secondary"
              >
                <Link aria-hidden="true" size={16} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>綁定帳號</TooltipContent>
          </Tooltip>
        ) : null}
      </ItemActions>
    </Item>
  );
}

function StatusBadge({ status }: { status: MemberListStatus }) {
  if (status === "disabled" || status === "link_expired") {
    return <Badge variant="destructive">{statusLabels[status]}</Badge>;
  }

  return (
    <Badge variant={status === "bound" ? "default" : "secondary"}>
      {statusLabels[status]}
    </Badge>
  );
}
