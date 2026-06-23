"use client";

import { UserPlus } from "lucide-react";
import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { initialActionState } from "@/app/action-state";
import {
  createMemberAction,
  type CreateMemberActionCode,
  type CreateMemberActionField,
  type CreateMemberActionResult,
} from "@/app/member-actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

export function CreateMemberDialog({
  onOpenChange,
  open,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}) {
  const router = useRouter();
  const [actionState, formAction, isPending] = useActionState(
    createMemberAction,
    initialActionState<
      CreateMemberActionResult,
      CreateMemberActionField,
      CreateMemberActionCode
    >(),
  );

  useEffect(() => {
    if (actionState.status === "success") {
      toast.success(actionState.message ?? "成員已建立。");
      onOpenChange(false);
      router.refresh();
    }

    if (actionState.status === "error" && actionState.message) {
      toast.error(actionState.message);
    }
  }, [actionState, onOpenChange, router]);

  return (
    <Dialog
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
      }}
      open={open}
    >
      <DialogContent aria-describedby={undefined}>
        <form action={formAction} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>建立成員</DialogTitle>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="member-display-name">
              顯示名稱
            </FieldLabel>
            <Input id="member-display-name" name="displayName" />
            {actionState.fieldErrors?.displayName?.map((error) => (
              <FieldError key={error}>{error}</FieldError>
            ))}
          </Field>
          <Field>
            <FieldLabel htmlFor="member-role">角色</FieldLabel>
            <NativeSelect
              defaultValue="general_member"
              id="member-role"
              name="role"
            >
              <NativeSelectOption value="general_member">
                一般成員
              </NativeSelectOption>
              <NativeSelectOption value="finance_manager">
                財務管理
              </NativeSelectOption>
              <NativeSelectOption value="admin">管理者</NativeSelectOption>
            </NativeSelect>
            {actionState.fieldErrors?.role?.map((error) => (
              <FieldError key={error}>{error}</FieldError>
            ))}
          </Field>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => onOpenChange(false)}
              type="button"
              variant="secondary"
            >
              取消
            </Button>
            <Button disabled={isPending} type="submit">
              <UserPlus aria-hidden="true" size={18} />
              建立成員
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
