"use client";

import { Edit3 } from "lucide-react";
import {
  useActionState,
  useEffect,
  useState,
  type ComponentProps,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { initialActionState } from "@/app/action-state";
import { updateMemberDisplayNameAction } from "@/app/member-actions";
import type {
  UpdateMemberDisplayNameActionCode,
  UpdateMemberDisplayNameActionField,
} from "@/app/member-actions";
import type { MemberManagementMember } from "@/app/member-management-members";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const statusLabels: Record<MemberManagementMember["status"], string> = {
  active: "已啟用",
  disabled: "已停用",
  invited: "已邀請",
};

const roleLabels: Record<MemberManagementMember["roles"][number], string> = {
  admin: "管理者",
  finance_manager: "財務管理",
  general_member: "一般成員",
};

export function MemberList({ members }: { members: MemberManagementMember[] }) {
  const router = useRouter();
  const [displayNameActionState, displayNameFormAction] = useActionState(
    updateMemberDisplayNameAction,
    initialActionState<
      { memberId: string; displayName: string },
      UpdateMemberDisplayNameActionField,
      UpdateMemberDisplayNameActionCode
    >(),
  );
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingDisplayName, setEditingDisplayName] = useState("");
  const editingMember =
    members.find((member) => member.id === editingMemberId) ?? null;

  useEffect(() => {
    if (displayNameActionState.status !== "success") {
      return;
    }

    toast.success(displayNameActionState.message ?? "顯示名稱已更新");
    router.refresh();
  }, [displayNameActionState, router]);

  useEffect(() => {
    if (displayNameActionState.status !== "error" || !displayNameActionState.message) {
      return;
    }

    toast.error(displayNameActionState.message);
  }, [displayNameActionState]);

  function startEditDisplayName(member: MemberManagementMember) {
    setEditingMemberId(member.id);
    setEditingDisplayName(member.displayName);
  }

  function submitDisplayName(event: FormEvent<HTMLFormElement>) {
    if (!editingMember) {
      event.preventDefault();
      return;
    }

    const nextName = editingDisplayName.trim();

    if (!nextName) {
      event.preventDefault();
      toast.error("顯示名稱不能空白。");
      return;
    }

    setEditingMemberId(null);
  }

  return (
    <>
      <section
        aria-label="成員清單"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {members.map((member) => (
          <MemberListItem
            key={member.id}
            member={member}
            onEditDisplayName={startEditDisplayName}
          />
        ))}
      </section>

      <EditMemberDisplayNameDialog
        action={displayNameFormAction}
        displayName={editingDisplayName}
        fieldError={displayNameActionState.fieldErrors?.displayName?.[0]}
        member={editingMember}
        onDisplayNameChange={setEditingDisplayName}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMemberId(null);
          }
        }}
        onSubmit={submitDisplayName}
      />
    </>
  );
}

function MemberListItem({
  member,
  onEditDisplayName,
}: {
  member: MemberManagementMember;
  onEditDisplayName: (member: MemberManagementMember) => void;
}) {
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
          {member.roles.map((role) => (
            <Badge key={role} variant="outline">
              {roleLabels[role]}
            </Badge>
          ))}
        </ItemTitle>
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={member.status} />
        </div>
      </ItemContent>
      <ItemActions className="ml-auto">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label={`修改 ${member.displayName} 的顯示名稱`}
              onClick={() => onEditDisplayName(member)}
              size="icon"
              type="button"
              variant="secondary"
            >
              <Edit3 aria-hidden="true" size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>修改顯示名稱</TooltipContent>
        </Tooltip>
      </ItemActions>
    </Item>
  );
}

function EditMemberDisplayNameDialog({
  action,
  displayName,
  fieldError,
  member,
  onDisplayNameChange,
  onOpenChange,
  onSubmit,
}: {
  action: ComponentProps<"form">["action"];
  displayName: string;
  fieldError?: string;
  member: MemberManagementMember | null;
  onDisplayNameChange: (displayName: string) => void;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(member)}>
      <DialogContent>
        <form action={action} className="grid gap-4" onSubmit={onSubmit}>
          <DialogHeader>
            <DialogTitle>修改顯示名稱</DialogTitle>
            <DialogDescription>
              這只會修改 app 內所有人看到的名稱，不會改 Google 名稱或頭像。
            </DialogDescription>
          </DialogHeader>
          <input name="memberId" type="hidden" value={member?.id ?? ""} />
          <Field>
            <FieldLabel htmlFor="display-name">顯示名稱</FieldLabel>
            <Input
              id="display-name"
              name="displayName"
              onChange={(event) => onDisplayNameChange(event.target.value)}
              value={displayName}
            />
            {fieldError ? (
              <FieldDescription>{fieldError}</FieldDescription>
            ) : null}
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="secondary"
            >
              取消
            </Button>
            <Button type="submit">儲存</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: MemberManagementMember["status"] }) {
  const variant = status === "active" ? "default" : "secondary";

  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}

function memberInitials(displayName: string): string {
  return displayName.trim().slice(0, 2).toUpperCase() || "成員";
}
