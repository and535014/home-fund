"use client";

import { useActionState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { initialActionState } from "@/app/action-state";
import {
  updateMemberDisplayNameAction,
  type UpdateMemberDisplayNameActionCode,
  type UpdateMemberDisplayNameActionField,
  type UpdateMemberDisplayNameActionResult,
} from "@/app/member-actions";
import type { MemberManagementMember } from "@/app/member-management-members";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useActionStateEffect } from "@/app/use-action-state-effect";

export function EditMemberDisplayNameDialog({
  member,
  onOpenChange,
}: {
  member: MemberManagementMember | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [actionState, formAction, isPending] = useActionState(
    updateMemberDisplayNameAction,
    initialActionState<
      UpdateMemberDisplayNameActionResult,
      UpdateMemberDisplayNameActionField,
      UpdateMemberDisplayNameActionCode
    >(),
  );

  useActionStateEffect(
    actionState,
    useCallback((handledState) => {
      if (handledState.status === "success") {
        toast.success(handledState.message ?? "顯示名稱已更新");
        onOpenChange(false);
        router.refresh();
      }

      if (handledState.status === "error" && handledState.message) {
        toast.error(handledState.message);
      }
    }, [onOpenChange, router]),
  );

  return (
    <Dialog
      onOpenChange={(open) => {
        if (!isPending) {
          onOpenChange(open);
        }
      }}
      open={Boolean(member)}
    >
      <DialogContent aria-describedby={undefined}>
        <form action={formAction} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>修改顯示名稱</DialogTitle>
          </DialogHeader>
          <input name="memberId" type="hidden" value={member?.id ?? ""} />
          <Field>
            <FieldLabel htmlFor="display-name">顯示名稱</FieldLabel>
            <Input
              disabled={isPending}
              key={member?.id ?? "display-name"}
              defaultValue={member?.displayName ?? ""}
              id="display-name"
              name="displayName"
            />
            {actionState.fieldErrors?.displayName?.map((error) => (
              <FieldError key={error}>{error}</FieldError>
            ))}
          </Field>
          <DialogFooter>
            <Button
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="secondary"
            >
              取消
            </Button>
            <Button disabled={isPending} type="submit">
              {isPending ? "儲存中..." : "儲存"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
