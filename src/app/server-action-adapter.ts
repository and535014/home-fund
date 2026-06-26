import { revalidatePath } from "next/cache";
import {
  actionOutcomeSuccess,
  actionOutcomeToState,
  type ActionState,
} from "@/app/action-state";
import {
  requireAuthenticatedMember,
  requireServerActionAccess,
  type AppAccessSession,
} from "@/auth/app-access";
import type { AuthorizationCommand } from "@/modules/identity-access/authorization";

export type ServerActionAccess = AppAccessSession;

export async function requireMutationAccess(
  command?: AuthorizationCommand,
): Promise<ServerActionAccess> {
  if (command) {
    return requireServerActionAccess(command);
  }

  return requireAuthenticatedMember();
}

export function revalidateActionPaths(paths: string[]): string[] {
  paths.forEach((path) => revalidatePath(path));
  return paths;
}

export function actionSuccessWithRevalidation<
  TResult = undefined,
  TField extends string = string,
  TCode extends string = string,
>(
  message: string,
  data: TResult,
  paths: string[],
): ActionState<TResult, TField, TCode> {
  return actionOutcomeToState<TResult, TField, TCode>(
    actionOutcomeSuccess(message, data, {
      revalidated: revalidateActionPaths(paths),
    }),
  );
}
