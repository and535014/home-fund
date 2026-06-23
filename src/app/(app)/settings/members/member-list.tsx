"use client";

import { Check, Copy, Edit3, Link, UserPlus } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const OPEN_CREATE_MEMBER_EVENT = "home-fund:open-create-member";

type PrototypeRole = "admin" | "finance_manager" | "general_member";
type PrototypeStatus =
  | "unbound"
  | "link_generated"
  | "link_expired"
  | "bound"
  | "disabled";

type PrototypeMember = {
  avatarUrl: string | null;
  bindingExpiresAt: string | null;
  bindingLink: string | null;
  displayName: string;
  id: string;
  role: PrototypeRole;
  status: PrototypeStatus;
};

const roleLabels: Record<PrototypeRole, string> = {
  admin: "管理者",
  finance_manager: "財務管理",
  general_member: "一般成員",
};

const statusLabels: Record<PrototypeStatus, string> = {
  bound: "已綁定",
  disabled: "已停用",
  link_expired: "已失效",
  link_generated: "待綁定",
  unbound: "未綁定",
};

const initialMembers: PrototypeMember[] = [
  {
    avatarUrl: "https://api.dicebear.com/9.x/initials/svg?seed=An",
    bindingExpiresAt: null,
    bindingLink: null,
    displayName: "安琪",
    id: "member-1",
    role: "admin",
    status: "bound",
  },
  {
    avatarUrl: null,
    bindingExpiresAt: null,
    bindingLink: null,
    displayName: "柏宇",
    id: "member-2",
    role: "general_member",
    status: "unbound",
  },
  {
    avatarUrl: null,
    bindingExpiresAt: "2026-06-29 23:59",
    bindingLink: "/members/bind?token=preview-bind-member-3",
    displayName: "佳蓉",
    id: "member-3",
    role: "finance_manager",
    status: "link_generated",
  },
  {
    avatarUrl: null,
    bindingExpiresAt: "2026-06-29 23:59",
    bindingLink: "/members/bind?token=preview-disabled-member-4",
    displayName: "停用測試成員",
    id: "member-4",
    role: "general_member",
    status: "disabled",
  },
  {
    avatarUrl: null,
    bindingExpiresAt: "2026-06-20 23:59",
    bindingLink: "/members/bind?token=preview-expired-member-5",
    displayName: "失效測試成員",
    id: "member-5",
    role: "general_member",
    status: "link_expired",
  },
];

export function CreateMemberHeaderButton() {
  return (
    <Button
      onClick={() => window.dispatchEvent(new Event(OPEN_CREATE_MEMBER_EVENT))}
      type="button"
    >
      <UserPlus aria-hidden="true" size={18} />
      建立成員
    </Button>
  );
}

export function MemberList() {
  const [members, setMembers] = useState<PrototypeMember[]>(initialMembers);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [bindingMemberId, setBindingMemberId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingDisplayName, setEditingDisplayName] = useState("");
  const bindingMember =
    members.find((member) => member.id === bindingMemberId) ?? null;
  const editingMember =
    members.find((member) => member.id === editingMemberId) ?? null;

  useEffect(() => {
    function openCreateMemberDialog() {
      setIsCreateOpen(true);
    }

    window.addEventListener(OPEN_CREATE_MEMBER_EVENT, openCreateMemberDialog);
    return () => {
      window.removeEventListener(
        OPEN_CREATE_MEMBER_EVENT,
        openCreateMemberDialog,
      );
    };
  }, []);

  function createMember(displayName: string, role: PrototypeRole) {
    const id = `member-${Date.now()}`;
    const member: PrototypeMember = {
      avatarUrl: null,
      bindingExpiresAt: null,
      bindingLink: null,
      displayName,
      id,
      role,
      status: "unbound",
    };

    setMembers((currentMembers) => [member, ...currentMembers]);
    setIsCreateOpen(false);
    toast.success("成員已建立。");
  }

  function generateBindingLink(memberId: string) {
    setMembers((currentMembers) =>
      currentMembers.map((member) => {
        if (
          member.id !== memberId ||
          member.status === "disabled" ||
          member.status === "bound"
        ) {
          return member;
        }

        return {
          ...member,
          bindingExpiresAt: formatBindingExpiry(addDays(new Date(), 7)),
          bindingLink: `/members/bind?token=preview-bind-${member.id}`,
          status: "link_generated",
        };
      }),
    );
    toast.success("綁定連結已產生。");
  }

  function markBound(memberId: string) {
    setMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === memberId
          ? {
              ...member,
              avatarUrl: `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(member.displayName)}`,
              bindingExpiresAt: null,
              bindingLink: null,
              status: "bound",
            }
          : member,
      ),
    );
    toast.success("已模擬 Google 綁定完成。");
  }

  function startEditDisplayName(member: PrototypeMember) {
    setEditingMemberId(member.id);
    setEditingDisplayName(member.displayName);
  }

  function updateDisplayName() {
    const nextDisplayName = editingDisplayName.trim();

    if (!editingMember || !nextDisplayName) {
      toast.error("顯示名稱不能空白。");
      return;
    }

    setMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === editingMember.id
          ? { ...member, displayName: nextDisplayName }
          : member,
      ),
    );
    setEditingMemberId(null);
    toast.success("顯示名稱已更新。");
  }

  return (
    <>
      <section
        aria-label="成員清單"
        className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      >
        {members.map((member) => (
          <MemberListItem
            key={member.id}
            member={member}
            onEditDisplayName={startEditDisplayName}
            onOpenBinding={setBindingMemberId}
          />
        ))}
      </section>

      <CreateMemberDialog
        onCreateMember={createMember}
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
      />

      <EditMemberDisplayNameDialog
        displayName={editingDisplayName}
        member={editingMember}
        onDisplayNameChange={setEditingDisplayName}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMemberId(null);
          }
        }}
        onSave={updateDisplayName}
      />

      <MemberBindingDialog
        member={bindingMember}
        onCopyLink={copyBindingLink}
        onGenerateLink={generateBindingLink}
        onMarkBound={markBound}
        onOpenChange={(open) => {
          if (!open) {
            setBindingMemberId(null);
          }
        }}
      />
    </>
  );
}

function MemberListItem({
  member,
  onEditDisplayName,
  onOpenBinding,
}: {
  member: PrototypeMember;
  onEditDisplayName: (member: PrototypeMember) => void;
  onOpenBinding: (memberId: string) => void;
}) {
  const canBindAccount =
    member.status === "unbound" ||
    member.status === "link_generated" ||
    member.status === "link_expired";

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
          <Badge variant="outline">{roleLabels[member.role]}</Badge>
        </ItemTitle>
        <ItemDescription>
          <StatusBadge status={member.status} />
        </ItemDescription>
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

function MemberBindingDialog({
  member,
  onCopyLink,
  onGenerateLink,
  onMarkBound,
  onOpenChange,
}: {
  member: PrototypeMember | null;
  onCopyLink: (link: string) => void;
  onGenerateLink: (memberId: string) => void;
  onMarkBound: (memberId: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const hasBindingLink = Boolean(member?.bindingLink);
  const isExpired = member?.status === "link_expired";

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(member)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>綁定 Google 帳號</DialogTitle>
        </DialogHeader>
        {member && hasBindingLink && !isExpired ? (
          <div className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="binding-link">綁定帳號連結</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="binding-link"
                  readOnly
                  value={toAbsoluteLink(member.bindingLink ?? "")}
                />
                <Button
                  aria-label={`複製 ${member.displayName} 的綁定帳號連結`}
                  onClick={() => onCopyLink(member.bindingLink ?? "")}
                  size="icon"
                  type="button"
                  variant="secondary"
                >
                  <Copy aria-hidden="true" size={16} />
                </Button>
              </div>
              {member.bindingExpiresAt ? (
                <FieldDescription className="text-destructive">
                  有效期限：{member.bindingExpiresAt}
                </FieldDescription>
              ) : null}
            </Field>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="secondary"
              >
                關閉
              </Button>
              <Button
                onClick={() => {
                  onMarkBound(member.id);
                  onOpenChange(false);
                }}
                type="button"
              >
                <Check aria-hidden="true" size={18} />
                模擬完成綁定
              </Button>
            </div>
          </div>
        ) : member && isExpired ? (
          <div className="grid gap-4">
            <p className="text-body text-destructive">
              {member.displayName}
              的綁定連結已失效，請重新產生連結後再傳給成員。
            </p>
            {member.bindingExpiresAt ? (
              <p className="text-caption text-destructive">
                原有效期限：{member.bindingExpiresAt}
              </p>
            ) : null}
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="secondary"
              >
                關閉
              </Button>
              <Button onClick={() => onGenerateLink(member.id)} type="button">
                <Link aria-hidden="true" size={18} />
                重新產生連結
              </Button>
            </div>
          </div>
        ) : member ? (
          <div className="grid gap-4">
            <p className="text-body text-muted-foreground">
              {member.displayName}
              尚未綁定 Google 帳號，請產生綁定連結，複製並傳給成員來進行綁定。
            </p>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => onOpenChange(false)}
                type="button"
                variant="secondary"
              >
                取消
              </Button>
              <Button onClick={() => onGenerateLink(member.id)} type="button">
                <Link aria-hidden="true" size={18} />
                產生綁定連結
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EditMemberDisplayNameDialog({
  displayName,
  member,
  onDisplayNameChange,
  onOpenChange,
  onSave,
}: {
  displayName: string;
  member: PrototypeMember | null;
  onDisplayNameChange: (displayName: string) => void;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}) {
  function submitDisplayName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSave();
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(member)}>
      <DialogContent>
        <form className="grid gap-4" onSubmit={submitDisplayName}>
          <DialogHeader>
            <DialogTitle>修改顯示名稱</DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="display-name">顯示名稱</FieldLabel>
            <Input
              id="display-name"
              onChange={(event) => onDisplayNameChange(event.target.value)}
              value={displayName}
            />
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

function CreateMemberDialog({
  onCreateMember,
  onOpenChange,
  open,
}: {
  onCreateMember: (displayName: string, role: PrototypeRole) => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState<PrototypeRole>("general_member");
  const [error, setError] = useState<string | null>(null);

  function submitCreateMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextDisplayName = displayName.trim();

    if (!nextDisplayName) {
      setError("顯示名稱不能空白。");
      return;
    }

    onCreateMember(nextDisplayName, role);
    setDisplayName("");
    setRole("general_member");
    setError(null);
  }

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          setError(null);
        }
      }}
      open={open}
    >
      <DialogContent>
        <form className="grid gap-4" onSubmit={submitCreateMember}>
          <DialogHeader>
            <DialogTitle>建立成員</DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="prototype-member-display-name">
              顯示名稱
            </FieldLabel>
            <Input
              id="prototype-member-display-name"
              onChange={(event) => setDisplayName(event.target.value)}
              value={displayName}
            />
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>
          <Field>
            <FieldLabel htmlFor="prototype-member-role">角色</FieldLabel>
            <NativeSelect
              id="prototype-member-role"
              onChange={(event) => setRole(event.target.value as PrototypeRole)}
              value={role}
            >
              <NativeSelectOption value="general_member">
                一般成員
              </NativeSelectOption>
              <NativeSelectOption value="finance_manager">
                財務管理
              </NativeSelectOption>
              <NativeSelectOption value="admin">管理者</NativeSelectOption>
            </NativeSelect>
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="secondary"
            >
              取消
            </Button>
            <Button type="submit">
              <UserPlus aria-hidden="true" size={18} />
              建立成員
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: PrototypeStatus }) {
  if (status === "disabled" || status === "link_expired") {
    return <Badge variant="destructive">{statusLabels[status]}</Badge>;
  }

  return (
    <Badge variant={status === "bound" ? "default" : "secondary"}>
      {statusLabels[status]}
    </Badge>
  );
}

function memberInitials(displayName: string): string {
  return displayName.trim().slice(0, 2).toUpperCase() || "成員";
}

function toAbsoluteLink(link: string): string {
  return new URL(link, window.location.origin).toString();
}

function addDays(date: Date, days: number): Date {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function formatBindingExpiry(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

async function copyBindingLink(link: string) {
  try {
    await navigator.clipboard.writeText(toAbsoluteLink(link));
    toast.success("綁定連結已複製");
  } catch {
    toast.error("無法自動複製，請手動選取連結。");
  }
}
