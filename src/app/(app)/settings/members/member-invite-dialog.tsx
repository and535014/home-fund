"use client";

import { MailPlus } from "lucide-react";
import {
  useActionState,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { initialActionState } from "@/app/action-state";
import { createMemberInvitationAction } from "@/app/member-actions";
import type {
  InviteMemberActionCode,
  InviteMemberActionField,
  InviteMemberActionResult,
} from "@/app/member-actions";
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
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  CopyInviteLinkButton,
  copyInviteLink,
  toAbsoluteInviteLink,
} from "./member-invite-link";

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

export function MemberInviteDialog() {
  const router = useRouter();
  const [inviteActionState, inviteFormAction] = useActionState(
    createMemberInvitationAction,
    initialActionState<
      InviteMemberActionResult,
      InviteMemberActionField,
      InviteMemberActionCode
    >(),
  );
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedInviteLink, setDismissedInviteLink] = useState<string | null>(
    null,
  );
  const copiedInviteLinkRef = useRef<string | null>(null);
  const activeInviteResult = inviteActionState.status === "success" &&
    inviteActionState.data &&
    dismissedInviteLink !== inviteActionState.data.invitationLink
    ? inviteActionState.data
    : undefined;
  const isDialogOpen = isOpen || Boolean(activeInviteResult);

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
    if (
      !activeInviteResult ||
      copiedInviteLinkRef.current === activeInviteResult.invitationLink
    ) {
      return;
    }

    copiedInviteLinkRef.current = activeInviteResult.invitationLink;
    void copyInviteLink(activeInviteResult.invitationLink);
  }, [activeInviteResult]);

  useEffect(() => {
    function openInviteDialog() {
      setIsOpen(true);
    }

    window.addEventListener(OPEN_MEMBER_INVITE_EVENT, openInviteDialog);
    return () => {
      window.removeEventListener(OPEN_MEMBER_INVITE_EVENT, openInviteDialog);
    };
  }, []);

  function submitInvite() {
    setDismissedInviteLink(null);
    copiedInviteLinkRef.current = null;
  }

  function resetDialog() {
    if (activeInviteResult) {
      setDismissedInviteLink(activeInviteResult.invitationLink);
    }
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          resetDialog();
        }
      }}
      open={isDialogOpen}
    >
      <DialogContent>
        {activeInviteResult ? (
          <InviteLinkResult
            invitationLink={activeInviteResult.invitationLink}
            onDone={() => {
              resetDialog();
              setIsOpen(false);
            }}
            onInviteAnother={() => {
              resetDialog();
              setIsOpen(true);
            }}
          />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>邀請成員</DialogTitle>
              <DialogDescription>
                建立邀請連結，分享給要加入的家庭成員。
              </DialogDescription>
            </DialogHeader>
            <form
              action={inviteFormAction}
              className="grid gap-4"
              onSubmit={submitInvite}
            >
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setIsOpen(false)}
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
  );
}

function InviteLinkResult({
  invitationLink,
  onDone,
  onInviteAnother,
}: {
  invitationLink: string;
  onDone: () => void;
  onInviteAnother: () => void;
}) {
  return (
    <>
      <DialogHeader>
        <DialogTitle>邀請連結已建立</DialogTitle>
        <DialogDescription>
          連結已複製，可分享給要加入的家庭成員。此連結 7 天內有效。
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4">
        <Field>
          <FieldLabel htmlFor="invite-link">邀請連結</FieldLabel>
          <div className="flex gap-2">
            <Input
              id="invite-link"
              readOnly
              value={toAbsoluteInviteLink(invitationLink)}
            />
            <CopyInviteLinkButton invitationLink={invitationLink} />
          </div>
        </Field>
        <div className="flex justify-end gap-2">
          <Button onClick={onInviteAnother} type="button" variant="secondary">
            再邀請一位
          </Button>
          <Button onClick={onDone} type="button">
            完成
          </Button>
        </div>
      </div>
    </>
  );
}
