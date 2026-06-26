"use client";

import { useMemo } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { REIMBURSEMENT_PAYMENT_METHOD_OPTIONS } from "@/modules/reimbursement/reimbursement-payment";

export function ReimbursementPaymentFields({
  disabled = false,
  idPrefix,
}: {
  disabled?: boolean;
  idPrefix: string;
}) {
  const defaultPaidOn = useMemo(() => formatLocalDate(new Date()), []);

  return (
    <section
      aria-labelledby={`${idPrefix}-payment-title`}
      className="grid gap-3"
    >
      <h3 id={`${idPrefix}-payment-title`} className="sr-only">
        退款表單
      </h3>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field>
          <FieldLabel htmlFor={`${idPrefix}-method`}>
            付款方式
          </FieldLabel>
          <NativeSelect
            defaultValue="bank_transfer"
            disabled={disabled}
            id={`${idPrefix}-method`}
            name="reimbursementMethod"
          >
            {REIMBURSEMENT_PAYMENT_METHOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </NativeSelect>
        </Field>

        <Field>
          <FieldLabel htmlFor={`${idPrefix}-paid-on`}>
            付款日期
          </FieldLabel>
          <Input
            defaultValue={defaultPaidOn}
            disabled={disabled}
            id={`${idPrefix}-paid-on`}
            name="reimbursementPaidOn"
            type="date"
          />
        </Field>
      </div>

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-reference`}>
          交易備註
        </FieldLabel>
        <Input
          disabled={disabled}
          id={`${idPrefix}-reference`}
          name="reimbursementReference"
          placeholder="可填轉帳末五碼、收據資訊或付款備註"
        />
      </Field>
    </section>
  );
}

function formatLocalDate(date: Date): string {
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}
