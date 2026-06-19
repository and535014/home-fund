import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { buildAccessHints, type AccessHints } from "@/modules/identity-access/access-hints";
import { authorize, type AuthorizationCommand } from "@/modules/identity-access/authorization";
import type {
  HouseholdAccessProfile,
  ResolveHouseholdAccessResult,
} from "@/modules/identity-access/session-access";
import {
  buildHomeBlockedViewFromAccess,
  type HomeBlockedView,
} from "@/app/home-access";
import { getCurrentMemberFromServerHeaders } from "./server-current-member-cache";

export type AuthenticatedAppMember = Extract<
  ResolveHouseholdAccessResult,
  { ok: true }
>;

export type AppAccessSession = {
  access: AuthenticatedAppMember;
  accessHints: AccessHints;
  profile: HouseholdAccessProfile;
};

export const requireAuthenticatedMember = cache(async (): Promise<AppAccessSession> => {
  const currentMember = await getCurrentMemberFromServerHeaders();

  if (!currentMember.ok) {
    if (currentMember.reason === "unauthenticated") {
      redirect("/login");
    }

    redirectToUnauthenticatedLogout(
      buildHomeBlockedViewFromAccess(currentMember),
    );
  }

  return {
    access: currentMember,
    accessHints: buildAccessHints(currentMember.member),
    profile: currentMember.profile,
  };
});

export async function requireAppRouteAccess(
  route: "admin" | "categories" | "members",
): Promise<AppAccessSession> {
  const session = await requireAuthenticatedMember();

  if (route === "admin" && !session.profile.roles.includes("admin")) {
    redirect("/");
  }

  if (route === "categories") {
    await requireAuthorization({ type: "manage_categories" }, session);
  }

  if (route === "members") {
    await requireAuthorization({ type: "manage_members" }, session);
  }

  return session;
}

export async function requireServerActionAccess(
  command: AuthorizationCommand,
): Promise<AppAccessSession> {
  return requireAuthorization(command, await requireAuthenticatedMember());
}

async function requireAuthorization(
  command: AuthorizationCommand,
  session: AppAccessSession,
): Promise<AppAccessSession> {
  const result = authorize(session.access.member, command);

  if (!result.allowed) {
    redirect("/");
  }

  return session;
}

function redirectToUnauthenticatedLogout(view: HomeBlockedView): never {
  const params = new URLSearchParams({
    reason: view.kind,
  });

  if (view.errorCode) {
    params.set("auth_error", view.errorCode);
  }

  redirect(`/unauthenticated/logout?${params.toString()}`);
}
