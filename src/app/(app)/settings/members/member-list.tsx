"use client";

import { UserPlus } from "lucide-react";
import { useEffect, useState } from "react";
import type { MemberManagementMember } from "@/app/member-management-members";
import { Button } from "@/components/ui/button";
import { MemberBindingDialog } from "./member-binding-dialog";
import { CreateMemberDialog } from "./member-create-dialog";
import { EditMemberDisplayNameDialog } from "./member-edit-display-name-dialog";
import { MemberListItem } from "./member-list-item";

const OPEN_CREATE_MEMBER_EVENT = "home-fund:open-create-member";

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

export function MemberList({
  members,
}: {
  members: MemberManagementMember[];
}) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [bindingMemberId, setBindingMemberId] = useState<string | null>(null);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
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
            onEditDisplayName={setEditingMemberId}
            onOpenBinding={setBindingMemberId}
          />
        ))}
      </section>

      <CreateMemberDialog
        onOpenChange={setIsCreateOpen}
        open={isCreateOpen}
      />

      <EditMemberDisplayNameDialog
        member={editingMember}
        onOpenChange={(open) => {
          if (!open) {
            setEditingMemberId(null);
          }
        }}
      />

      <MemberBindingDialog
        member={bindingMember}
        onOpenChange={(open) => {
          if (!open) {
            setBindingMemberId(null);
          }
        }}
      />
    </>
  );
}
