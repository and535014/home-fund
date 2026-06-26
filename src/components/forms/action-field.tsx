"use client";

import * as React from "react";

import type { ActionFieldErrors } from "@/app/action-state";
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

type FieldName = string;

type ActionFieldErrorMap<TField extends FieldName = FieldName> =
  ActionFieldErrors<TField>;

function fieldErrorId(id: string) {
  return `${id}-error`;
}

export function getActionFieldErrors<TField extends FieldName>(
  errors: ActionFieldErrorMap<TField> | undefined,
  field: TField,
) {
  return errors?.[field] ?? [];
}

export function getActionFieldControlProps<TField extends FieldName>({
  describedBy,
  errors,
  field,
  id,
}: {
  describedBy?: string;
  errors?: ActionFieldErrorMap<TField>;
  field: TField;
  id: string;
}) {
  const fieldErrors = getActionFieldErrors(errors, field);
  const errorId = fieldErrorId(id);
  const describedByIds = [
    describedBy,
    fieldErrors.length > 0 ? errorId : undefined,
  ].filter(Boolean).join(" ");

  return {
    "aria-describedby": describedByIds || undefined,
    "aria-invalid": fieldErrors.length > 0 || undefined,
  } satisfies React.AriaAttributes;
}

export function ActionField<TField extends FieldName>({
  children,
  className,
  errors,
  field,
  id,
  ...props
}: React.ComponentProps<typeof Field> & {
  errors?: ActionFieldErrorMap<TField>;
  field: TField;
  id: string;
}) {
  const fieldErrors = getActionFieldErrors(errors, field);

  return (
    <Field
      className={className}
      data-invalid={fieldErrors.length > 0 ? "true" : undefined}
      id={`${id}-field`}
      {...props}
    >
      {children}
    </Field>
  );
}

export function ActionFieldLabel({
  children,
  className,
  id,
  ...props
}: React.ComponentProps<typeof FieldLabel> & {
  id: string;
}) {
  return (
    <FieldLabel className={className} htmlFor={id} {...props}>
      {children}
    </FieldLabel>
  );
}

export function ActionFieldError<TField extends FieldName>({
  className,
  errors,
  field,
  id,
}: {
  className?: string;
  errors?: ActionFieldErrorMap<TField>;
  field: TField;
  id: string;
}) {
  const fieldErrors = getActionFieldErrors(errors, field);

  return (
    <FieldError
      className={cn(className)}
      id={fieldErrorId(id)}
      errors={fieldErrors.map((message) => ({ message }))}
    />
  );
}
