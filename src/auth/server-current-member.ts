import { getPrismaClient as getRuntimePrismaClient } from "../db/prisma";
import {
  resolveCurrentMember,
  type CurrentMemberDataSource,
} from "./current-member";
import {
  createCurrentMemberDataSource,
  type CurrentMemberPrismaClient,
} from "./current-member-data-source";
import { createAuth as createRuntimeAuth } from "./index";

type AuthSessionUser = {
  id: string;
  email?: string | null;
};

type AuthSessionResult = {
  user: AuthSessionUser;
} | null;

export type CurrentMemberAuthApi = {
  api: {
    getSession(context: { headers: Headers }): Promise<AuthSessionResult>;
  };
};

export type ResolveCurrentMemberFromRequestInput = {
  headers: Headers;
  auth: CurrentMemberAuthApi;
  dataSource: CurrentMemberDataSource;
};

export type CurrentMemberRuntimeFactories = {
  createAuth(): Promise<CurrentMemberAuthApi>;
  getPrismaClient(): CurrentMemberPrismaClient;
};

const defaultRuntimeFactories: CurrentMemberRuntimeFactories = {
  createAuth: createRuntimeAuth,
  getPrismaClient: getRuntimePrismaClient,
};

export async function resolveCurrentMemberFromRequest(
  input: ResolveCurrentMemberFromRequestInput,
) {
  const session = await input.auth.api.getSession({
    headers: input.headers,
  });

  return resolveCurrentMember({
    user: session?.user ?? null,
    dataSource: input.dataSource,
  });
}

export async function getCurrentMember(request: Request) {
  return getCurrentMemberFromHeaders(request.headers);
}

export async function getCurrentMemberFromHeaders(
  headers: Headers,
  factories: CurrentMemberRuntimeFactories = defaultRuntimeFactories,
) {
  const e2eCurrentMember = resolveE2eCurrentMember(headers);

  if (e2eCurrentMember) {
    return e2eCurrentMember;
  }

  const controlledE2eAuth = createControlledE2eAuth(headers);

  if (controlledE2eAuth) {
    return resolveCurrentMemberFromRequest({
      headers,
      auth: controlledE2eAuth,
      dataSource: createCurrentMemberDataSource(factories.getPrismaClient()),
    });
  }

  const auth = await factories.createAuth();

  return resolveCurrentMemberFromRequest({
    headers,
    auth,
    dataSource: createCurrentMemberDataSource(factories.getPrismaClient()),
  });
}

function resolveE2eCurrentMember(headers: Headers) {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const email = headers.get("x-e2e-current-member-email")?.trim().toLowerCase();

  if (!email) {
    return null;
  }

  return {
    ok: true as const,
    member: {
      id: "member-e2e-fin",
      googleAccountLinked: true,
      roles: ["finance_manager" as const],
      capabilities: ["manage_categories" as const],
    },
    profile: {
      id: "member-e2e-fin",
      displayName: "Lin",
      roles: ["finance_manager" as const],
      capabilities: ["manage_categories" as const],
    },
    events: ["Household member access resolved"] as [
      "Household member access resolved",
    ],
  };
}

function createControlledE2eAuth(headers: Headers): CurrentMemberAuthApi | null {
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const userId = headers.get("x-e2e-auth-user-id")?.trim();

  if (!userId) {
    return null;
  }

  return {
    api: {
      getSession: async () => ({
        user: {
          id: userId,
        },
      }),
    },
  };
}
