"use client";

import { useEffect, useRef } from "react";
import type { ActionState } from "./action-state";

export function useActionStateEffect<
  TResult,
  TField extends string,
  TCode extends string,
>(
  actionState: ActionState<TResult, TField, TCode>,
  onHandledState: (
    actionState: Exclude<
      ActionState<TResult, TField, TCode>,
      { status: "idle" }
    >,
  ) => void,
) {
  const handledActionStateRef = useRef<typeof actionState | null>(null);

  useEffect(() => {
    if (
      actionState.status === "idle" ||
      handledActionStateRef.current === actionState
    ) {
      return;
    }

    handledActionStateRef.current = actionState;
    onHandledState(
      actionState as Exclude<typeof actionState, { status: "idle" }>,
    );
  }, [actionState, onHandledState]);
}
