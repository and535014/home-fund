"use client";

import {
  Copy,
  Edit3,
  MailPlus,
} from "lucide-react";
import {
  useActionState,
  useEffect,
  useState,
  type ComponentProps,
  type FormEvent,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { initialActionState, type FormAction } from "@/app/action-state";
import type {
  InviteMemberActionCode,
  InviteMemberActionField,
  InviteMemberActionResult,
  UpdateMemberDisplayNameActionCode,
  UpdateMemberDisplayNameActionField,
} from "@/app/member-actions";
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
import type { MemberManagementMember } from "@/app/member-management-context";

type MemberManagementPanelProps = {
  createInvitationAction?: FormAction<
    InviteMemberActionResult,
    InviteMemberActionField,
    InviteMemberActionCode
  >;
  members: MemberManagementMember[];
  updateDisplayNameAction?: FormAction<
    { memberId: string; displayName: string },
    UpdateMemberDisplayNameActionField,
    UpdateMemberDisplayNameActionCode
  >;
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
  createInvitationAction,
  members,
  updateDisplayNameAction,
}: MemberManagementPanelProps) {
  const router = useRouter();
  const [inviteActionState, inviteFormAction] = useActionState(
    createInvitationAction ?? fallbackCreateInvitationAction,
    initialActionState<
      InviteMemberActionResult,
      InviteMemberActionField,
      InviteMemberActionCode
    >(),
  );
  const [displayNameActionState, displayNameFormAction] = useActionState(
    updateDisplayNameAction ?? fallbackUpdateDisplayNameAction,
    initialActionState<
      { memberId: string; displayName: string },
      UpdateMemberDisplayNameActionField,
      UpdateMemberDisplayNameActionCode
    >(),
  );
  const [editableMembers, setEditableMembers] = useState(members);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [invitedEmail, setInvitedEmail] = useState("");
  const [dismissedInviteLink, setDismissedInviteLink] = useState<string | null>(
    null,
  );
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingDisplayName, setEditingDisplayName] = useState("");
  const isServerBacked = Boolean(createInvitationAction && updateDisplayNameAction);
  const displayedMembers = isServerBacked ? members : editableMembers;
  const editingMember = displayedMembers.find((member) => member.id === editingMemberId);
  const activeInviteResult = inviteActionState.status === "success" &&
    inviteActionState.data &&
    dismissedInviteLink !== inviteActionState.data.invitationLink
    ? inviteActionState.data
    : undefined;
  const shownInviteLink = activeInviteResult?.invitationLink ?? inviteLink;
  const shownInvitedEmail = activeInviteResult?.email ?? invitedEmail;
  const isInviteOpen = isInviteDialogOpen || Boolean(activeInviteResult);

  useEffect(() => {
    if (inviteActionState.status !== "error" || !inviteActionState.message) {
      return;
    }

    toast.error(inviteActionState.message);
  }, [inviteActionState]);

  useEffect(() => {
    if (inviteActionState.status !== "success") {
      return;
    }

    router.refresh();
  }, [inviteActionState, router]);

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
    const normalizedEmail = inviteEmail.trim().toLowerCase();

    if (!isLikelyEmail(normalizedEmail)) {
      event.preventDefault();
      toast.error("請輸入有效的 Google email。");
      return;
    }

    if (displayedMembers.some((member) => member.email.toLowerCase() === normalizedEmail)) {
      event.preventDefault();
      toast.error("這個 Google email 已經在成員清單中。");
      return;
    }

    if (createInvitationAction) {
      setDismissedInviteLink(null);
      return;
    }

    event.preventDefault();
    const nextInviteLink = toAbsoluteInviteLink(
      `/invite/accept?token=${encodeURIComponent(`preview-${Date.now()}-${normalizedEmail}`)}`,
    );

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
      await navigator.clipboard.writeText(toAbsoluteInviteLink(link));
      toast.success("邀請連結已複製");
    } catch {
      toast.error("無法自動複製，請手動選取連結。");
    }
  }

  function resetInviteDialog() {
    if (activeInviteResult) {
      setDismissedInviteLink(activeInviteResult.invitationLink);
    }

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
      setEditingMemberId(null);
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
        {displayedMembers.map((member) => (
          <Item key={member.id} variant="outline">
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
        open={isInviteOpen}
      >
        <DialogContent>
          {shownInviteLink ? (
            <>
              <DialogHeader>
                <DialogTitle>邀請連結已建立</DialogTitle>
                <DialogDescription>
                  將連結傳給 {shownInvitedEmail}，對方可用這個邀請加入服務。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4">
                <Field>
                  <FieldLabel htmlFor="invite-link">邀請連結</FieldLabel>
                  <div className="flex gap-2">
                    <Input
                      id="invite-link"
                      readOnly
                      value={toAbsoluteInviteLink(shownInviteLink)}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label="複製邀請連結"
                          onClick={() => copyInviteLink(shownInviteLink)}
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
                    onClick={() => {
                      resetInviteDialog();
                      setIsInviteDialogOpen(true);
                    }}
                    type="button"
                    variant="secondary"
                  >
                    再邀請一位
                  </Button>
                  <Button
                    onClick={() => {
                      resetInviteDialog();
                      setIsInviteDialogOpen(false);
                    }}
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
              <form
                action={inviteFormAction}
                className="grid gap-4"
                onSubmit={submitInvite}
              >
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="invite-email">Google email</FieldLabel>
                    <Input
                      id="invite-email"
                      inputMode="email"
                      name="googleEmail"
                      onChange={(event) => setInviteEmail(event.target.value)}
                      placeholder="mei@example.com"
                      type="email"
                      value={inviteEmail}
                    />
                    <FieldDescription>
                      {inviteActionState.fieldErrors?.googleEmail?.[0] ??
                        "受邀者必須使用這個 Google 帳號登入才會被辨識為家庭成員。"}
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
            action={displayNameFormAction}
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
            <Field>
              <FieldLabel htmlFor="display-name">顯示名稱</FieldLabel>
              <Input
                id="display-name"
                name="displayName"
                onChange={(event) => setEditingDisplayName(event.target.value)}
                value={editingDisplayName}
              />
              {displayNameActionState.fieldErrors?.displayName?.[0] ? (
                <FieldDescription>
                  {displayNameActionState.fieldErrors.displayName[0]}
                </FieldDescription>
              ) : null}
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

function memberInitials(displayName: string): string {
  return displayName.trim().slice(0, 2).toUpperCase() || "成員";
}

function isLikelyEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email);
}

function toAbsoluteInviteLink(link: string): string {
  return new URL(link, window.location.origin).toString();
}

async function fallbackCreateInvitationAction() {
  return initialActionState<
    InviteMemberActionResult,
    InviteMemberActionField,
    InviteMemberActionCode
  >();
}

async function fallbackUpdateDisplayNameAction() {
  return initialActionState<
    { memberId: string; displayName: string },
    UpdateMemberDisplayNameActionField,
    UpdateMemberDisplayNameActionCode
  >();
}
