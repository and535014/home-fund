"use client";

import { Copy, Link } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { initialActionState } from "@/app/action-state";
import {
  createMemberBindingLinkAction,
  type CreateMemberBindingLinkActionState,
} from "@/app/member-actions";
import type { MemberManagementMember } from "@/app/member-management-members";
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
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  copyBindingLink,
  formatBindingExpiry,
  memberListStatus,
  toAbsoluteLink,
} from "./member-ui";

export function MemberBindingDialog({
  member,
  onOpenChange,
}: {
  member: MemberManagementMember | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [bindingResult, setBindingResult] = useState<{
    memberId: string;
    link: string;
    expiresAt: string;
  } | null>(null);
  const status = member ? memberListStatus(member) : null;
  const activeBindingResult = bindingResult?.memberId === member?.id
    ? bindingResult
    : null;
  const link = activeBindingResult?.link ?? member?.binding.link ?? null;
  const expiresAt = activeBindingResult?.expiresAt ??
    (member?.binding.expiresAt ? member.binding.expiresAt.toISOString() : null);

  function generateBindingLink() {
    if (!member) {
      return;
    }

    const formData = new FormData();
    formData.set("memberId", member.id);
    startTransition(async () => {
      const result = await createMemberBindingLinkAction(
        initialActionState() as CreateMemberBindingLinkActionState,
        formData,
      );

      if (result.status === "error") {
        toast.error(result.message ?? "綁定連結無法建立。");
        return;
      }

      if (result.data) {
        setBindingResult({
          memberId: member.id,
          link: result.data.bindingLink,
          expiresAt: result.data.expiresAt,
        });
        toast.success("綁定連結已產生。");
        router.refresh();
      }
    });
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(member)}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>綁定 Google 帳號</DialogTitle>
        </DialogHeader>
        {member && link && status !== "link_expired" ? (
          <div className="grid gap-4">
            <Field>
              <FieldLabel htmlFor="binding-link">綁定帳號連結</FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="binding-link"
                  readOnly
                  value={toAbsoluteLink(link)}
                />
                <Button
                  aria-label={`複製 ${member.displayName} 的綁定帳號連結`}
                  onClick={() => copyBindingLink(link)}
                  size="icon"
                  type="button"
                  variant="secondary"
                >
                  <Copy aria-hidden="true" size={16} />
                </Button>
              </div>
              {expiresAt ? (
                <FieldDescription className="text-destructive">
                  有效期限：{formatBindingExpiry(expiresAt)}
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
            </div>
          </div>
        ) : member && status === "link_expired" ? (
          <div className="grid gap-4">
            <p className="text-body text-destructive">
              {member.displayName}
              的綁定連結已失效，請重新產生連結後再傳給成員。
            </p>
            {expiresAt ? (
              <p className="text-caption text-destructive">
                原有效期限：{formatBindingExpiry(expiresAt)}
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
              <Button
                disabled={isPending}
                onClick={generateBindingLink}
                type="button"
              >
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
              <Button
                disabled={isPending}
                onClick={generateBindingLink}
                type="button"
              >
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
