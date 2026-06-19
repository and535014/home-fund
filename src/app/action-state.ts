export type ActionStatus = "idle" | "success" | "error";

export type ActionFieldErrors<TField extends string = string> = Partial<
  Record<TField, string[]>
>;

export type ActionState<
  TResult = undefined,
  TField extends string = string,
  TCode extends string = string,
> = {
  status: ActionStatus;
  message?: string;
  code?: TCode;
  fieldErrors?: ActionFieldErrors<TField>;
  data?: TResult;
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
  return {
    status: "success",
    message,
    ...(data === undefined ? {} : { data }),
  };
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
  return {
    status: "error",
    message,
    ...(options?.code ? { code: options.code } : {}),
    ...(options?.fieldErrors ? { fieldErrors: options.fieldErrors } : {}),
  };
}
