export type ActionStatus = "idle" | "success" | "error";

export type ActionFieldErrors<TField extends string = string> = Partial<
  Record<TField, string[]>
>;

export type ActionOutcomeSuccess<TResult = undefined> = {
  ok: true;
  message: string;
  data?: TResult;
  revalidated?: string[];
};

export type ActionOutcomeError<
  TField extends string = string,
  TCode extends string = string,
> = {
  ok: false;
  message: string;
  code?: TCode;
  fieldErrors?: ActionFieldErrors<TField>;
};

export type ActionOutcome<
  TResult = undefined,
  TField extends string = string,
  TCode extends string = string,
> =
  | ActionOutcomeSuccess<TResult>
  | ActionOutcomeError<TField, TCode>;

export type ActionState<
  TResult = undefined,
  TField extends string = string,
  TCode extends string = string,
> = {
  status: ActionStatus;
  ok?: ActionOutcome<TResult, TField, TCode>["ok"];
  message?: string;
  code?: TCode;
  fieldErrors?: ActionFieldErrors<TField>;
  data?: TResult;
  revalidated?: string[];
};

export type FormAction<
  TResult = undefined,
  TField extends string = string,
  TCode extends string = string,
> = (
  previousState: ActionState<TResult, TField, TCode>,
  formData: FormData,
) => Promise<ActionState<TResult, TField, TCode>>;

export function initialActionState<
  TResult = undefined,
  TField extends string = string,
  TCode extends string = string,
>(): ActionState<TResult, TField, TCode> {
  return { status: "idle" };
}

export function actionSuccess<
  TResult = undefined,
  TField extends string = string,
  TCode extends string = string,
>(
  message: string,
  data?: TResult,
): ActionState<TResult, TField, TCode> {
  return actionOutcomeToState<TResult, TField, TCode>(
    actionOutcomeSuccess(message, data),
  );
}

export function actionError<
  TResult = undefined,
  TField extends string = string,
  TCode extends string = string,
>(
  message: string,
  options?: {
    code?: TCode;
    fieldErrors?: ActionFieldErrors<TField>;
  },
): ActionState<TResult, TField, TCode> {
  return actionOutcomeToState<TResult, TField, TCode>(
    actionOutcomeError(message, options),
  );
}

export function actionOutcomeSuccess<TResult = undefined>(
  message: string,
  data?: TResult,
  options?: {
    revalidated?: string[];
  },
): ActionOutcomeSuccess<TResult> {
  return {
    ok: true,
    message,
    ...(data === undefined ? {} : { data }),
    ...(options?.revalidated ? { revalidated: options.revalidated } : {}),
  };
}

export function actionOutcomeError<
  TField extends string = string,
  TCode extends string = string,
>(
  message: string,
  options?: {
    code?: TCode;
    fieldErrors?: ActionFieldErrors<TField>;
  },
): ActionOutcomeError<TField, TCode> {
  return {
    ok: false,
    message,
    ...(options?.code ? { code: options.code } : {}),
    ...(options?.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
  };
}

export function actionOutcomeToState<
  TResult = undefined,
  TField extends string = string,
  TCode extends string = string,
>(
  outcome: ActionOutcome<TResult, TField, TCode>,
): ActionState<TResult, TField, TCode> {
  if (outcome.ok) {
    return {
      status: "success",
      ...outcome,
    };
  }

  return {
    status: "error",
    ...outcome,
  };
}

export function actionStateToOutcome<
  TResult = undefined,
  TField extends string = string,
  TCode extends string = string,
>(
  state: ActionState<TResult, TField, TCode>,
): ActionOutcome<TResult, TField, TCode> | undefined {
  if (state.status === "idle") {
    return undefined;
  }

  if (state.ok === true) {
    return {
      ok: true,
      message: state.message ?? "",
      ...(state.data === undefined ? {} : { data: state.data }),
      ...(state.revalidated ? { revalidated: state.revalidated } : {}),
    };
  }

  return {
    ok: false,
    message: state.message ?? "",
    ...(state.code ? { code: state.code } : {}),
    ...(state.fieldErrors ? { fieldErrors: state.fieldErrors } : {}),
  };
}
