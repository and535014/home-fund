"use client";

import {
  Copy,
  Edit3,
  MailPlus,
} from "lucide-react";
import {
  useEffect,
  useState,
  type ComponentProps,
  type FormEvent,
} from "react";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
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
import type {
  MemberManagementMember,
  MemberResult,
} from "@/app/member-management-context";

type MemberFormAction = (formData: FormData) => void | Promise<void>;

type MemberManagementPanelProps = {
  memberResult?: MemberResult;
  members: MemberManagementMember[];
  updateDisplayNameAction?: MemberFormAction;
};

const statusLabels: Record<MemberManagementMember["status"], string> = {
  active: "已啟用",
  invited: "已邀請",
};

const roleLabels: Record<MemberManagementMember["roles"][number], string> = {
  admin: "管理者",
  finance_manager: "財務管理",
  general_member: "一般成員",
};

const OPEN_MEMBER_INVITE_EVENT = "home-fund:open-member-invite";

export function InviteMemberHeaderButton({
  className,
  size,
}: {
  className?: string;
  size?: ComponentProps<typeof Button>["size"];
}) {
  return (
    <Button
      className={className}
      onClick={() => {
        window.dispatchEvent(new Event(OPEN_MEMBER_INVITE_EVENT));
      }}
      size={size}
      type="button"
    >
      <MailPlus aria-hidden="true" size={18} />
      邀請成員
    </Button>
  );
}

export function MemberManagementPanel({
  memberResult,
  members,
  updateDisplayNameAction,
}: MemberManagementPanelProps) {
  const [editableMembers, setEditableMembers] = useState(members);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [invitedEmail, setInvitedEmail] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingDisplayName, setEditingDisplayName] = useState("");
  const editingMember = editableMembers.find((member) => member.id === editingMemberId);

  useEffect(() => {
    if (!memberResult) {
      return;
    }

    showMemberResultToast(memberResult);

    const url = new URL(window.location.href);
    url.searchParams.delete("memberResult");
    url.searchParams.delete("memberAction");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }, [memberResult]);

  useEffect(() => {
    function openInviteDialog() {
      setIsInviteDialogOpen(true);
    }

    window.addEventListener(OPEN_MEMBER_INVITE_EVENT, openInviteDialog);
    return () => {
      window.removeEventListener(OPEN_MEMBER_INVITE_EVENT, openInviteDialog);
    };
  }, []);

  function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedEmail = inviteEmail.trim().toLowerCase();
    const nextInviteLink = buildInviteLink(normalizedEmail);

    if (!normalizedEmail.includes("@")) {
      toast.error("請輸入有效的 Google email。");
      return;
    }

    if (editableMembers.some((member) => member.email.toLowerCase() === normalizedEmail)) {
      toast.error("這個 Google email 已經在成員清單中。");
      return;
    }

    setEditableMembers((currentMembers) => [
      {
        id: `member-preview-${Date.now()}`,
        displayName: normalizedEmail,
        email: normalizedEmail,
        invitationLink: nextInviteLink,
        roles: ["general_member"],
        status: "invited",
      },
      ...currentMembers,
    ]);
    setInviteEmail("");
    setInvitedEmail(normalizedEmail);
    setInviteLink(nextInviteLink);
  }

  async function copyInviteLink(link = inviteLink) {
    if (!link) {
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      toast.success("邀請連結已複製");
    } catch {
      toast.error("無法自動複製，請手動選取連結。");
    }
  }

  function resetInviteDialog() {
    setInviteEmail("");
    setInviteLink("");
    setInvitedEmail("");
  }

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

    if (updateDisplayNameAction) {
      return;
    }

    event.preventDefault();
    setEditableMembers((currentMembers) =>
      currentMembers.map((member) =>
        member.id === editingMember.id
          ? { ...member, displayName: nextName }
          : member,
      ),
    );
    setEditingMemberId(null);
    toast.success("顯示名稱已更新", {
      description: `${nextName} 會成為所有人看到的名稱。`,
    });
  }

  return (
    <div className="grid gap-5">
      <section
        aria-label="成員清單"
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {editableMembers.map((member) => (
          <Item key={member.id} variant="outline">
            <ItemMedia className="size-12 rounded-full" variant="image">
              <Avatar
                aria-label={`${member.displayName} 的 Google 頭像`}
                className="size-12 ring-2 ring-border"
              >
                <AvatarImage
                  alt={`${member.displayName} 的 Google 頭像`}
                  src={member.avatarUrl ?? undefined}
                />
                <AvatarFallback>
                  {memberInitials(member.displayName)}
                </AvatarFallback>
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
              {member.status === "invited" && member.invitationLink ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      aria-label={`複製 ${member.displayName} 的邀請連結`}
                      onClick={() => copyInviteLink(member.invitationLink)}
                      size="icon"
                      type="button"
                      variant="secondary"
                    >
                      <Copy aria-hidden="true" size={16} />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>複製邀請連結</TooltipContent>
                </Tooltip>
              ) : null}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    aria-label={`修改 ${member.displayName} 的顯示名稱`}
                    onClick={() => startEditDisplayName(member)}
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
        ))}
      </section>

      <Dialog
        onOpenChange={(open) => {
          setIsInviteDialogOpen(open);
          if (!open) {
            resetInviteDialog();
          }
        }}
        open={isInviteDialogOpen}
      >
        <DialogContent>
          {inviteLink ? (
            <>
              <DialogHeader>
                <DialogTitle>邀請連結已建立</DialogTitle>
                <DialogDescription>
                  將連結傳給 {invitedEmail}，對方可用這個邀請加入服務。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <Field>
                  <FieldLabel htmlFor="invite-link">邀請連結</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      id="invite-link"
                      readOnly
                      value={inviteLink}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="複製邀請連結"
                          onClick={() => copyInviteLink()}
                          size="icon"
                          type="button"
                        >
                          <Copy aria-hidden="true" size={18} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>複製邀請連結</TooltipContent>
                    </Tooltip>
                  </div>
                </Field>
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={resetInviteDialog}
                    type="button"
                    variant="secondary"
                  >
                    再邀請一位
                  </Button>
                  <Button
                    onClick={() => setIsInviteDialogOpen(false)}
                    type="button"
                  >
                    完成
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>邀請成員</DialogTitle>
                <DialogDescription>
                  輸入要加入家庭共用金服務的 Google email。
                </DialogDescription>
              </DialogHeader>
              <form className="grid gap-4" onSubmit={submitInvite}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="invite-email">Google email</FieldLabel>
                    <Input
                      id="invite-email"
                      inputMode="email"
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="mei@example.com"
                      type="email"
                      value={inviteEmail}
                    />
                    <FieldDescription>
                      受邀者必須使用這個 Google 帳號登入才會被辨識為家庭成員。
                    </FieldDescription>
                  </Field>
                </FieldGroup>
                <div className="flex justify-end gap-2">
                  <Button
                    onClick={() => setIsInviteDialogOpen(false)}
                    type="button"
                    variant="secondary"
                  >
                    取消
                  </Button>
                  <Button type="submit">
                    <MailPlus aria-hidden="true" size={18} />
                    建立邀請連結
                  </Button>
                </div>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setEditingMemberId(null);
          }
        }}
        open={Boolean(editingMember)}
      >
        <DialogContent>
          <form
            action={updateDisplayNameAction}
            className="grid gap-4"
            onSubmit={submitDisplayName}
          >
            <DialogHeader>
              <DialogTitle>修改顯示名稱</DialogTitle>
              <DialogDescription>
                這只會修改 app 內所有人看到的名稱，不會改 Google 名稱或頭像。
              </DialogDescription>
            </DialogHeader>
            <input name="memberId" type="hidden" value={editingMember?.id ?? ""} />
            <input name="returnTo" type="hidden" value="/members" />
            <Field>
              <FieldLabel htmlFor="display-name">顯示名稱</FieldLabel>
              <Input
                id="display-name"
                name="displayName"
                onChange={(event) => setEditingDisplayName(event.target.value)}
                value={editingDisplayName}
              />
            </Field>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => setEditingMemberId(null)}
                type="button"
                variant="secondary"
              >
                取消
              </Button>
              <Button type="submit">
                儲存
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatusBadge({ status }: { status: MemberManagementMember["status"] }) {
  const variant = status === "active" ? "default" : "secondary";

  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}

function buildInviteLink(email: string): string {
  const token = encodeURIComponent(`preview-${Date.now()}-${email}`);
  const origin = window.location.origin;

  return `${origin}/invite/accept?token=${token}`;
}

function memberInitials(displayName: string): string {
  return displayName.trim().slice(0, 2).toUpperCase() || "成員";
}

function showMemberResultToast(result: MemberResult) {
  if (result === "renamed") {
    toast.success("顯示名稱已更新");
    return;
  }

  const messages: Record<Exclude<MemberResult, "renamed">, string> = {
    cannot_remove_last_admin: "至少需要保留一位管理者。",
    duplicate_google_account_email: "這個 Google email 已經在成員清單中。",
    invalid_display_name: "顯示名稱不能空白。",
    member_must_have_role: "成員至少需要一個角色。",
    member_not_found: "找不到這位成員。",
    permission_denied: "你沒有權限管理成員。",
    unknown_error: "成員資料無法更新。",
  };

  toast.error(messages[result]);
}
