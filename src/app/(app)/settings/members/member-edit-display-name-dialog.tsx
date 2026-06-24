"use client";

import { useActionState, useEffect } from "react";
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

  useEffect(() => {
    if (actionState.status === "success") {
      toast.success(actionState.message ?? "顯示名稱已更新");
      onOpenChange(false);
      router.refresh();
    }

    if (actionState.status === "error" && actionState.message) {
      toast.error(actionState.message);
    }
  }, [actionState, onOpenChange, router]);

  return (
    <Dialog onOpenChange={onOpenChange} open={Boolean(member)}>
      <DialogContent aria-describedby={undefined}>
        <form action={formAction} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>修改顯示名稱</DialogTitle>
          </DialogHeader>
          <input name="memberId" type="hidden" value={member?.id ?? ""} />
          <Field>
            <FieldLabel htmlFor="display-name">顯示名稱</FieldLabel>
            <Input
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
              onClick={() => onOpenChange(false)}
              type="button"
              variant="secondary"
            >
              取消
            </Button>
            <Button disabled={isPending} type="submit">
              儲存
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
