"use client";

import { Copy } from "lucide-react";
import type { ComponentProps } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function CopyInviteLinkButton({
  ariaLabel = "複製邀請連結",
  invitationLink,
  variant,
}: {
  ariaLabel?: string;
  invitationLink: string;
  variant?: ComponentProps<typeof Button>["variant"];
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={ariaLabel}
          onClick={() => copyInviteLink(invitationLink)}
          size="icon"
          type="button"
          variant={variant}
        >
          <Copy aria-hidden="true" size={18} />
        </Button>
      </TooltipTrigger>
      <TooltipContent>複製邀請連結</TooltipContent>
    </Tooltip>
  );
}

export function toAbsoluteInviteLink(link: string): string {
  return new URL(link, window.location.origin).toString();
}

export async function copyInviteLink(link: string) {
  try {
    await navigator.clipboard.writeText(toAbsoluteInviteLink(link));
    toast.success("邀請連結已複製");
  } catch {
    toast.error("無法自動複製，請手動選取連結。");
  }
}
