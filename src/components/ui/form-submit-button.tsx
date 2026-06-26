"use client";

import { useFormStatus } from "react-dom";
import type * as React from "react";
import { Button } from "@/components/ui/button";

type FormSubmitButtonProps = React.ComponentProps<typeof Button> & {
  pendingLabel?: React.ReactNode;
};

export function FormSubmitButton({
  children,
  disabled,
  pendingLabel = "處理中...",
  ...props
}: FormSubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={disabled || pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
