"use client";

import { UserPlus } from "lucide-react";
import { useActionState, useCallback } from "react";
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
import { FormSubmitButton } from "@/components/ui/form-submit-button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ActionField,
  ActionFieldError,
  ActionFieldLabel,
  getActionFieldControlProps,
} from "@/components/forms/action-field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { useActionStateEffect } from "@/app/use-action-state-effect";

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

  useActionStateEffect(
    actionState,
    useCallback((handledState) => {
      if (handledState.status === "success") {
        toast.success(handledState.message ?? "成員已建立。");
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
      onOpenChange={(nextOpen) => {
        if (!isPending) {
          onOpenChange(nextOpen);
        }
      }}
      open={open}
    >
      <DialogContent aria-describedby={undefined}>
        <form action={formAction} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>建立成員</DialogTitle>
          </DialogHeader>
          <ActionField
            errors={actionState.fieldErrors}
            field="displayName"
            id="member-display-name"
          >
            <ActionFieldLabel id="member-display-name">
              顯示名稱
            </ActionFieldLabel>
            <Input
              disabled={isPending}
              id="member-display-name"
              name="displayName"
              {...getActionFieldControlProps({
                errors: actionState.fieldErrors,
                field: "displayName",
                id: "member-display-name",
              })}
            />
            <ActionFieldError
              errors={actionState.fieldErrors}
              field="displayName"
              id="member-display-name"
            />
          </ActionField>
          <ActionField
            errors={actionState.fieldErrors}
            field="role"
            id="member-role"
          >
            <ActionFieldLabel id="member-role">角色</ActionFieldLabel>
            <NativeSelect
              defaultValue="general_member"
              disabled={isPending}
              id="member-role"
              name="role"
              {...getActionFieldControlProps({
                errors: actionState.fieldErrors,
                field: "role",
                id: "member-role",
              })}
            >
              <NativeSelectOption value="general_member">
                一般成員
              </NativeSelectOption>
              <NativeSelectOption value="finance_manager">
                財務管理
              </NativeSelectOption>
              <NativeSelectOption value="admin">管理者</NativeSelectOption>
            </NativeSelect>
            <ActionFieldError
              errors={actionState.fieldErrors}
              field="role"
              id="member-role"
            />
          </ActionField>
          <DialogFooter>
            <Button
              disabled={isPending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="secondary"
            >
              取消
            </Button>
            <FormSubmitButton
              disabled={isPending}
              pendingLabel="建立中..."
              type="submit"
            >
              <UserPlus aria-hidden="true" size={18} />
              建立成員
            </FormSubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
