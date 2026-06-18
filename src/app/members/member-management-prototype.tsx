"use client";

import {
  Edit3,
  LogOut,
  MailPlus,
  ShieldAlert,
  UserRoundPlus,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";

export type PrototypeMemberStatus = "active" | "invited" | "disabled";
export type PrototypeMemberRole = "admin" | "finance_manager" | "general_member";

export type PrototypeMember = {
  id: string;
  avatarUrl: string;
  displayName: string;
  email: string;
  googleName: string;
  roles: PrototypeMemberRole[];
  status: PrototypeMemberStatus;
};

type MemberManagementPrototypeProps = {
  canManageMembers: boolean;
  members: PrototypeMember[];
  roleLabel: string;
};

const statusLabels: Record<PrototypeMemberStatus, string> = {
  active: "已啟用",
  invited: "已邀請",
  disabled: "停用",
};

const roleLabels: Record<PrototypeMemberRole, string> = {
  admin: "管理者",
  finance_manager: "財務管理",
  general_member: "一般成員",
};

export function MemberManagementPrototype({
  canManageMembers,
  members,
  roleLabel,
}: MemberManagementPrototypeProps) {
  const [editableMembers, setEditableMembers] = useState(members);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [editingDisplayName, setEditingDisplayName] = useState("");
  const editingMember = editableMembers.find((member) => member.id === editingMemberId);
  const memberStats = useMemo(() => ({
    active: editableMembers.filter((member) => member.status === "active").length,
    invited: editableMembers.filter((member) => member.status === "invited").length,
    disabled: editableMembers.filter((member) => member.status === "disabled").length,
  }), [editableMembers]);

  function submitInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageMembers) {
      toast.error("只有管理者可以邀請成員。");
      return;
    }

    const normalizedEmail = inviteEmail.trim().toLowerCase();
    const displayName = inviteName.trim() || displayNameFromEmail(normalizedEmail);

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
        avatarUrl: avatarForEmail(normalizedEmail),
        displayName,
        email: normalizedEmail,
        googleName: displayName,
        roles: ["general_member"],
        status: "invited",
      },
      ...currentMembers,
    ]);
    setInviteEmail("");
    setInviteName("");
    toast.success("成員已邀請", {
      description: "受邀者使用相同 Google email 登入後，系統會重新檢查成員資格。",
    });
  }

  function startEditDisplayName(member: PrototypeMember) {
    setEditingMemberId(member.id);
    setEditingDisplayName(member.displayName);
  }

  function saveDisplayName() {
    if (!editingMember) {
      return;
    }

    const nextName = editingDisplayName.trim();

    if (!nextName) {
      toast.error("顯示名稱不能空白。");
      return;
    }

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

  if (!canManageMembers) {
    return (
      <Card aria-labelledby="members-denied-title" className="max-w-2xl">
        <CardHeader>
          <CardTitle id="members-denied-title" className="flex items-center gap-2">
            <ShieldAlert aria-hidden="true" size={20} />
            只有管理者可以管理成員
          </CardTitle>
          <CardDescription>
            目前角色：{roleLabel}。你仍可使用家庭共用金功能，但不能邀請成員或修改顯示名稱。
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="grid gap-5">
      <section aria-label="成員狀態摘要" className="grid gap-3 md:grid-cols-3">
        <MetricCard label="已啟用" value={`${memberStats.active} 人`} />
        <MetricCard label="已邀請" value={`${memberStats.invited} 人`} />
        <MetricCard label="停用" value={`${memberStats.disabled} 人`} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(18rem,0.72fr)_minmax(0,1.28fr)]">
        <Card aria-labelledby="invite-member-title">
          <CardHeader>
            <CardTitle id="invite-member-title" className="flex items-center gap-2">
              <UserRoundPlus aria-hidden="true" size={20} />
              邀請成員
            </CardTitle>
            <CardDescription>
              MVP prototype 使用 Google email 對應成員。正式寄信與邀請連結會在後續規格決定。
            </CardDescription>
          </CardHeader>
          <CardContent>
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
                <Field>
                  <FieldLabel htmlFor="invite-name">預設顯示名稱</FieldLabel>
                  <Input
                    id="invite-name"
                    onChange={(event) => setInviteName(event.target.value)}
                    placeholder="留空時先從 email 推估，首次連結可改用 Google 名稱"
                    value={inviteName}
                  />
                  <FieldDescription>
                    全站顯示的是 app 的顯示名稱；管理者之後可以修改。
                  </FieldDescription>
                </Field>
              </FieldGroup>
              <Button type="submit">
                <MailPlus aria-hidden="true" size={18} />
                邀請成員
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card aria-labelledby="member-list-title">
          <CardHeader>
            <CardTitle id="member-list-title">成員與顯示名稱</CardTitle>
            <CardDescription>
              頭像來自 Google，不可由管理者修改；顯示名稱由 app 管理，所有人都會看到同一個名稱。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ItemGroup className="gap-2">
              {editableMembers.map((member) => (
                <Item key={member.id} variant="outline">
                  <ItemMedia className="size-12 rounded-full" variant="image">
                    <span
                      aria-label={`${member.displayName} 的 Google 頭像`}
                      className="size-full bg-cover bg-center"
                      role="img"
                      style={{ backgroundImage: `url(${member.avatarUrl})` }}
                    />
                  </ItemMedia>
                  <ItemContent>
                    <ItemTitle>
                      <span>{member.displayName}</span>
                      <StatusBadge status={member.status} />
                    </ItemTitle>
                    <ItemDescription>
                      Google：{member.googleName} · {member.email}
                    </ItemDescription>
                    <div className="flex flex-wrap gap-1.5">
                      {member.roles.map((role) => (
                        <Badge key={role} variant="outline">
                          {roleLabels[role]}
                        </Badge>
                      ))}
                    </div>
                  </ItemContent>
                  <ItemActions className="ml-auto">
                    <Button
                      aria-label={`修改 ${member.displayName} 的顯示名稱`}
                      onClick={() => startEditDisplayName(member)}
                      size="icon"
                      type="button"
                      variant="secondary"
                    >
                      <Edit3 aria-hidden="true" size={16} />
                    </Button>
                  </ItemActions>
                </Item>
              ))}
            </ItemGroup>
          </CardContent>
        </Card>
      </section>

      <Card aria-labelledby="session-title">
        <CardHeader>
          <CardTitle id="session-title" className="flex items-center gap-2">
            <LogOut aria-hidden="true" size={20} />
            登出與切換 Google 帳號
          </CardTitle>
          <CardDescription>
            登出後回到登入頁，使用者可以選擇不同 Google 帳號；prototype 只呈現互動位置。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => {
              toast("Prototype：正式版會呼叫 Better Auth sign out，然後回到登入頁。");
            }}
            type="button"
            variant="secondary"
          >
            <LogOut aria-hidden="true" size={18} />
            登出
          </Button>
        </CardContent>
      </Card>

      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setEditingMemberId(null);
          }
        }}
        open={Boolean(editingMember)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改顯示名稱</DialogTitle>
            <DialogDescription>
              這只會修改 app 內所有人看到的名稱，不會改 Google 名稱或頭像。
            </DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="display-name">顯示名稱</FieldLabel>
            <Input
              id="display-name"
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
            <Button onClick={saveDisplayName} type="button">
              儲存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent>
        <p className="text-label text-muted-foreground">{label}</p>
        <p className="mt-1 text-subheading">{value}</p>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: PrototypeMemberStatus }) {
  const variant = status === "active" ? "default" : status === "invited" ? "secondary" : "outline";

  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}

function displayNameFromEmail(email: string): string {
  const [name] = email.split("@");
  return name || "新成員";
}

function avatarForEmail(email: string): string {
  const encoded = encodeURIComponent(email);
  return `https://api.dicebear.com/9.x/initials/svg?seed=${encoded}&backgroundColor=0f766e,2563eb,9333ea`;
}
